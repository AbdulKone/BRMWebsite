import { create } from 'zustand';
import { n8nService } from '../lib/n8nService';
import { supabaseService } from '../lib/supabaseService';
import { useErrorStore, errorUtils } from './errorStore';

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
  // Suppression de: error: string | null;
  isInitialized: boolean;
}

interface AutomationActions {
  initializeConfig: () => Promise<void>;
  toggleAutomation: () => Promise<void>;
  updateConfig: (config: Partial<AutomationConfig>) => Promise<void>;
  fetchStats: () => Promise<void>;
  triggerN8nWorkflow: (workflowId: string, data?: Record<string, any>, opts?: { timeoutMs?: number }) => Promise<any>;
  batchTriggerWorkflows: (actions: BatchWorkflowAction[], opts?: { timeoutMs?: number }) => Promise<any>;
  syncWithN8n: () => Promise<void>;
  startProspectionCampaign: () => Promise<void>;
}

// Type combiné pour le store
type AutomationStore = AutomationState & AutomationActions;

// ---------- Store ----------

const defaultConfig: AutomationConfig = {
  dailyLimit: 50,
  followUpDelay: 5,
  workingHours: { start: '09:00', end: '18:00' },
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
};

export const useAutomationStore = create<AutomationStore>()((set, get) => ({
  isActive: false,
  stats: null,
  config: defaultConfig,
  isLoading: false,
  // Suppression de: error: null,
  isInitialized: false,

  initializeConfig: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true }); // Suppression de: error: null
    
    await errorUtils.withErrorHandling(
      async () => {
        // Essayer de charger depuis Supabase
        const supabaseConfig = await supabaseService.getAutomationConfig();
        
        if (supabaseConfig) {
          // Utiliser la config de Supabase
          set({
            isActive: supabaseConfig.is_active,
            config: {
              dailyLimit: supabaseConfig.config.dailyLimit || defaultConfig.dailyLimit,
              followUpDelay: supabaseConfig.config.followUpDelay || defaultConfig.followUpDelay,
              workingHours: supabaseConfig.config.workingHours || defaultConfig.workingHours,
              workingDays: supabaseConfig.config.workingDays || defaultConfig.workingDays
            },
            isInitialized: true
          });
          
          // Synchroniser avec localStorage
          try {
            localStorage.setItem('automation_active', JSON.stringify(supabaseConfig.is_active));
            localStorage.setItem('automation_config', JSON.stringify(supabaseConfig.config));
          } catch {}
        } else {
          // Fallback sur localStorage puis défaut
          let persistedIsActive = false;
          let persistedConfig: AutomationConfig | null = null;
          
          try {
            if (typeof window !== 'undefined') {
              const rawActive = localStorage.getItem('automation_active');
              if (rawActive !== null) persistedIsActive = JSON.parse(rawActive);
              const rawConfig = localStorage.getItem('automation_config');
              if (rawConfig) persistedConfig = JSON.parse(rawConfig);
            }
          } catch {}
          
          const finalConfig = persistedConfig || defaultConfig;
          
          set({
            isActive: persistedIsActive,
            config: finalConfig,
            isInitialized: true
          });
          
          // Sauvegarder dans Supabase pour la prochaine fois
          try {
            await supabaseService.saveAutomationConfig(persistedIsActive, finalConfig);
          } catch (err) {
            // Remplacer console.warn par handleWarning
            useErrorStore.getState().handleWarning('Impossible de sauvegarder la config initiale dans Supabase');
          }
        }
      },
      'Erreur lors de l\'initialisation de la config'
    );
    
    set({ isLoading: false });
  },

  updateConfig: async (config: Partial<AutomationConfig>) => {
    const newConfig = { ...get().config, ...config };
    set({ config: newConfig });
    
    try { 
      localStorage.setItem('automation_config', JSON.stringify(newConfig)); 
    } catch {}
    
    await errorUtils.withErrorHandling(
      () => supabaseService.saveAutomationConfig(get().isActive, newConfig),
      'Erreur sauvegarde config dans Supabase'
    );
  },

  toggleAutomation: async () => {
    set({ isLoading: true }); // Suppression de: error: null
    
    await errorUtils.withErrorHandling(
      async () => {
        const current = get().isActive;
        const newState = !current;
        
        await n8nService.toggleAutomation(newState, get().config);
        set({ isActive: newState }); // Suppression de: error: null
        
        try { 
          localStorage.setItem('automation_active', JSON.stringify(newState)); 
        } catch {}
        
        await supabaseService.saveAutomationConfig(newState, get().config);
        useErrorStore.getState().handleSuccess(`Automation ${newState ? 'activée' : 'désactivée'}`);
      },
      'Erreur lors du basculement de l\'automation'
    );
    
    set({ isLoading: false });
  },

  triggerN8nWorkflow: async (workflowId: string, data = {}, opts = { timeoutMs: 15000 }) => {
    set({ isLoading: true }); // Suppression de: error: null
    
    const result = await errorUtils.withErrorHandling(
      async () => {
        return await n8nService.triggerWorkflow(workflowId, data, { timeoutMs: opts.timeoutMs || 15000 });
      },
      'Erreur lors du déclenchement du workflow'
    );
    
    set({ isLoading: false });
    return result;
  },

  batchTriggerWorkflows: async (actions: BatchWorkflowAction[], opts = { timeoutMs: 30000 }) => {
    set({ isLoading: true }); // Suppression de: error: null
    
    const result = await errorUtils.withErrorHandling(
      async () => {
        return await n8nService.batchTriggerWorkflows(actions, { timeoutMs: opts.timeoutMs || 30000 });
      },
      'Erreur lors du déclenchement des workflows en lot'
    );
    
    set({ isLoading: false });
    return result;
  },

  fetchStats: async () => {
    set({ isLoading: true }); // Suppression de: error: null
    
    await errorUtils.withErrorHandling(
      async () => {
        const stats = await n8nService.fetchStats();
        set({ stats }); // Suppression de: error: null
      },
      'Erreur lors de la récupération des stats'
    );
    
    set({ isLoading: false });
  },

  syncWithN8n: async () => {
    set({ isLoading: true }); // Suppression de: error: null
    
    const result = await errorUtils.withErrorHandling(
      async () => {
        const result = await n8nService.syncAutomationStatus(get().config);
        if (result?.stats) set({ stats: result.stats });
        return result;
      },
      'Erreur de synchronisation avec N8N'
    );
    
    set({ isLoading: false });
    return result;
  },

  startProspectionCampaign: async () => {
    set({ isLoading: true }); // Suppression de: error: null
    
    const result = await errorUtils.withErrorHandling(
      async () => {
        return await n8nService.triggerWorkflow('prospect_enrichment', {
          campaignType: 'prospection',
          config: get().config
        }, { timeoutMs: 30000 });
      },
      'Erreur lors du lancement de la campagne de prospection'
    );
    
    set({ isLoading: false });
    return result;
  }
}));
