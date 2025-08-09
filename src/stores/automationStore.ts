import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AutomationState {
  isActive: boolean;
  stats: {
    prospectsAdded: number;
    emailsSent: number;
    openRate: number;
    responseRate: number;
    conversionRate: number;
    activeSequences: number;
    scheduledEmails: number;
  } | null;
  config: {
    dailyLimit: number;
    followUpDelay: number;
    workingHours: { start: string; end: string };
    workingDays: string[];
  };
  isLoading: boolean;
  error: string | null;
}

interface AutomationActions {
  toggleAutomation: () => Promise<void>;
  updateConfig: (config: Partial<AutomationState['config']>) => void;
  fetchStats: () => Promise<void>;
  triggerN8nWorkflow: (workflowId: string, data?: any) => Promise<any>;
  syncWithN8n: () => Promise<void>;
  startProspectionCampaign: () => Promise<void>;
}

export const useAutomationStore = create<AutomationState & AutomationActions>((set, get) => ({
  isActive: true,
  stats: null,
  config: {
    dailyLimit: 50,
    followUpDelay: 5,
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  isLoading: false,
  error: null,

  toggleAutomation: async () => {
    const { isActive } = get();
    const newState = !isActive;
    
    try {
      // Appeler l'API n8n pour activer/désactiver les workflows
      const response = await fetch('/api/webhook-n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newState ? 'start_automation' : 'stop_automation',
          data: { 
            config: get().config,
            timestamp: Math.floor(Date.now() / 1000)
          },
          timestamp: Math.floor(Date.now() / 1000),
          signature: await generateSignature({
            action: newState ? 'start_automation' : 'stop_automation',
            data: { config: get().config },
            timestamp: Math.floor(Date.now() / 1000)
          })
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la communication avec n8n');
      }

      set({ isActive: newState, error: null });
      localStorage.setItem('automation_active', JSON.stringify(newState));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  },

  triggerN8nWorkflow: async (workflowId: string, data = {}) => {
    try {
      const payload = {
        action: 'trigger_workflow',
        data: { workflowId, ...data },
        timestamp: Math.floor(Date.now() / 1000)
      };

      const response = await fetch('/api/webhook-n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          signature: await generateSignature(payload)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du déclenchement du workflow');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
      throw error;
    }
  },

  updateConfig: (newConfig) => {
    const currentConfig = get().config;
    const updatedConfig = { ...currentConfig, ...newConfig };
    set({ config: updatedConfig });
    localStorage.setItem('automation_config', JSON.stringify(updatedConfig));
  },

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/automation/stats');
      if (response.ok) {
        const stats = await response.json();
        set({ stats, error: null });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de la récupération des stats' });
    } finally {
      set({ isLoading: false });
    }
  },

  syncWithN8n: async () => {
    try {
      const response = await fetch('/api/webhook-n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_automation_status',
          data: { config: get().config },
          timestamp: Math.floor(Date.now() / 1000),
          signature: await generateSignature({
            action: 'sync_automation_status',
            data: { config: get().config },
            timestamp: Math.floor(Date.now() / 1000)
          })
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la synchronisation avec n8n');
      }

      const result = await response.json();
      if (result.stats) {
        set({ stats: result.stats });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur de synchronisation' });
      throw error;
    }
  },

  startProspectionCampaign: async () => {
    try {
      await get().triggerN8nWorkflow('prospect_enrichment', {
        campaignType: 'prospection',
        config: get().config
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors du lancement de la campagne' });
      throw error;
    }
  },
}));

// Fonction utilitaire pour générer la signature HMAC
async function generateSignature(payload: any): Promise<string> {
  const payloadString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(payloadString);
  const key = encoder.encode(process.env.VITE_N8N_WEBHOOK_SECRET || 'default-secret');
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}