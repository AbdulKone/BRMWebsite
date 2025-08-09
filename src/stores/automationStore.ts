import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ---------- Types ----------
interface AutomationStats {
  prospectsAdded: number;
  emailsSent: number;
  openRate: number;
  responseRate: number;
  conversionRate: number;
  activeSequences: number;
  scheduledEmails: number;
}

interface WorkingHours {
  start: string;
  end: string;
}

interface AutomationConfig {
  dailyLimit: number;
  followUpDelay: number;
  workingHours: WorkingHours;
  workingDays: string[];
}

interface BatchWorkflowAction {
  workflowId: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
}

interface AutomationState {
  isActive: boolean;
  stats: AutomationStats | null;
  config: AutomationConfig;
  isLoading: boolean;
  error: string | null;
}

interface AutomationActions {
  toggleAutomation: () => Promise<void>;
  updateConfig: (config: Partial<AutomationConfig>) => void;
  fetchStats: () => Promise<void>;
  triggerN8nWorkflow: (workflowId: string, data?: Record<string, any>, opts?: { timeoutMs?: number }) => Promise<any>;
  batchTriggerWorkflows: (actions: BatchWorkflowAction[], opts?: { timeoutMs?: number }) => Promise<any>;
  syncWithN8n: () => Promise<void>;
  startProspectionCampaign: () => Promise<void>;
}

// ---------- Helpers ----------

// Détermistic JSON stringify (tri récursif des clés) pour signature HMAC stable
function stableStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

// Appelle le service serveur qui signe le payload avec la clé secrète côté serveur
async function generateSignatureClient(payload: { action: string; data: any; timestamp: number }, timeoutMs = 5000): Promise<string> {
  const resp = await fetchWithTimeout('/api/generate-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, timeoutMs);

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Signature service failed: ${resp.status} ${text}`);
  }

  const json = await resp.json().catch(() => null);
  if (!json || !json.signature) throw new Error('Invalid response from signature service');
  return json.signature;
}

// helper util (fetch with timeout) — adapte si déjà présent dans ton store
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(input, { ...init, signal: controller.signal });
    clearTimeout(id);
    return resp;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Utilitaire current timestamp
const nowTs = () => Math.floor(Date.now() / 1000);

// ---------- Store ----------

export const useAutomationStore = create<AutomationState & AutomationActions>((set, get) => {
  // Initial state (tentative lecture du localStorage côté client)
  let persistedIsActive = true;
  let persistedConfig: AutomationConfig | null = null;
  try {
    if (typeof window !== 'undefined') {
      const rawActive = localStorage.getItem('automation_active');
      if (rawActive !== null) persistedIsActive = JSON.parse(rawActive);
      const rawConfig = localStorage.getItem('automation_config');
      if (rawConfig) persistedConfig = JSON.parse(rawConfig);
    }
  } catch (err) {
    // ignore localStorage errors
    persistedIsActive = true;
    persistedConfig = null;
  }

  const defaultConfig: AutomationConfig = persistedConfig ?? {
    dailyLimit: 50,
    followUpDelay: 5,
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  };

  return {
    isActive: persistedIsActive,
    stats: null,
    config: defaultConfig,
    isLoading: false,
    error: null,

    // Toggle automation (start/stop workflows via API)
    toggleAutomation: async () => {
      set({ isLoading: true, error: null });
      try {
        const current = get().isActive;
        const newState = !current;
        const action = newState ? 'start_automation' : 'stop_automation';

        const payload = {
          action,
          data: { config: get().config },
          timestamp: nowTs()
        };

        // signature générée côté serveur pour ne pas exposer la clé
        const signature = await generateSignatureClient(payload, 8000);

        const resp = await fetchWithTimeout('/api/webhook-n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, signature })
        }, 12000);

        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new Error(`n8n API error: ${resp.status} ${text}`);
        }

        // Update local state
        set({ isActive: newState, error: null });
        try { localStorage.setItem('automation_active', JSON.stringify(newState)); } catch {}
      } catch (err: any) {
        set({ error: err?.message ?? 'Erreur inconnue' });
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    // Trigger single n8n workflow
    triggerN8nWorkflow: async (workflowId: string, data = {}, opts = { timeoutMs: 15000 }) => {
      set({ isLoading: true, error: null });
      try {
        const payload = {
          action: 'trigger_workflow',
          data: { workflowId, ...data },
          timestamp: nowTs()
        };
        // signature générée côté serveur pour ne pas exposer la clé
        const signature = await generateSignatureClient(payload, 8000);

        const resp = await fetchWithTimeout('/api/webhook-n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, signature })
        }, opts.timeoutMs);

        if (!resp.ok) {
          // Try parse JSON error if available
          const contentType = resp.headers.get('content-type') || '';
          const errText = contentType.includes('application/json') ? JSON.stringify(await resp.json().catch(() => ({}))) : await resp.text().catch(() => '');
          throw new Error(`n8n trigger failed: ${resp.status} ${errText}`);
        }

        const json = await resp.json().catch(() => null);
        return json;
      } catch (err) {
        set({ error: err instanceof Error ? err.message : String(err) });
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    // Batch trigger multiple workflows
    batchTriggerWorkflows: async (actions: BatchWorkflowAction[], opts: { timeoutMs?: number } = { timeoutMs: 30000 }) => {
      set({ isLoading: true, error: null });
      try {
        if (!Array.isArray(actions) || actions.length === 0) {
          throw new Error('Aucune action fournie pour batchTriggerWorkflows');
        }

        const payload = {
          action: 'batch_trigger',
          data: { items: actions },
          timestamp: nowTs()
        };

        // signature générée côté serveur pour ne pas exposer la clé
        const signature = await generateSignatureClient(payload, 8000);

        const resp = await fetchWithTimeout('/api/webhook-n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, signature })
        }, opts.timeoutMs);

        if (!resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          const errText = ct.includes('application/json') ? JSON.stringify(await resp.json().catch(() => ({}))) : await resp.text().catch(() => '');
          throw new Error(`Batch trigger failed: ${resp.status} ${errText}`);
        }

        const json = await resp.json().catch(() => null);
        return json; // { success: true, results: [...] }
      } catch (err: any) {
        set({ error: err?.message ?? 'Erreur batchTriggerWorkflows' });
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    // Update config locally & persist
    updateConfig: (newConfig) => {
      const current = get().config;
      const merged = { ...current, ...newConfig };
      set({ config: merged });
      try { localStorage.setItem('automation_config', JSON.stringify(merged)); } catch {}
    },

    // Fetch stats from backend (small timeout)
    fetchStats: async () => {
      set({ isLoading: true, error: null });
      try {
        const resp = await fetchWithTimeout('/api/automation/stats', {}, 12_000);
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new Error(`Stats fetch failed: ${resp.status} ${text}`);
        }
        const stats = await resp.json();
        set({ stats, error: null });
      } catch (err: any) {
        set({ error: err?.message ?? 'Erreur lors de la récupération des stats' });
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    // Synchronise l'état et récupère les stats
    syncWithN8n: async () => {
      set({ isLoading: true, error: null });
      try {
        const payload = {
          action: 'sync_automation_status',
          data: { config: get().config },
          timestamp: nowTs()
        };
        // signature générée côté serveur pour ne pas exposer la clé
        const signature = await generateSignatureClient(payload, 8000);
        const resp = await fetchWithTimeout('/api/webhook-n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, signature })
        }, 15000);

        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new Error(`Sync failed: ${resp.status} ${text}`);
        }

        const result = await resp.json().catch(() => null);
        if (result?.stats) set({ stats: result.stats });
        return result;
      } catch (err: any) {
        set({ error: err?.message ?? 'Erreur de synchronisation' });
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    // Exemple : lancer une campagne de prospection
    startProspectionCampaign: async () => {
      set({ isLoading: true, error: null });
      try {
        // On réutilise triggerN8nWorkflow pour centraliser signature & timeout
        const result = await get().triggerN8nWorkflow('prospect_enrichment', {
          campaignType: 'prospection',
          config: get().config
        }, { timeoutMs: 30_000 });
        return result;
      } catch (err: any) {
        set({ error: err?.message ?? 'Erreur lors du lancement de la campagne' });
        throw err;
      } finally {
        set({ isLoading: false });
      }
    }
  };
});
