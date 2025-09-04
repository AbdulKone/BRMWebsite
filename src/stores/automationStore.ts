import { create } from 'zustand';
import { n8nService } from '../lib/n8nService';
import { supabaseService } from '../lib/supabaseService';
import { useErrorStore, errorUtils } from './errorStore';
import { AutomationStats, AutomationConfig } from '../components/admin/types/automation.types';

// ---------- Types locaux ----------
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
  isInitialized: boolean;
}

interface AutomationActions {
  initializeConfig: () => Promise<void>;
  toggleAutomation: () => Promise<void>;
  updateConfig: (config: Partial<AutomationConfig>) => Promise<void>;
  fetchStats: () => Promise<void>;
  triggerN8nWorkflow: (workflowId: string, data?: Record<string, any>, opts?: { timeoutMs?: number }) => Promise<any>;
  batchTriggerWorkflows: (actions: BatchWorkflowAction[], opts?: { timeoutMs?: number }) => Promise<any>;
  syncWithN8n: () => Promise<any>;
  startProspectionCampaign: () => Promise<any>;
}

// Type combiné pour le store
type AutomationStore = AutomationState & AutomationActions;

// ---------- Configuration par défaut ----------
const defaultConfig: AutomationConfig = {
  isActive: false,
  dailyLimit: 50,
  followUpDelay: 5,
  workingHours: { start: '09:00', end: '18:00' },
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  activityTimeoutMinutes: 60,
  statsTimeframeDays: 30,
  recentActivityHours: 24,
  performanceThresholds: {
    openRate: { excellent: 25, good: 15 },
    responseRate: { excellent: 5, good: 2 }
  }
};

// ---------- Store Zustand ----------
export const useAutomationStore = create<AutomationStore>()((set, get) => ({
  // État initial
  isActive: false,
  stats: null,
  config: defaultConfig,
  isLoading: false,
  isInitialized: false,

  // Initialisation de la configuration
  initializeConfig: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    
    await errorUtils.withErrorHandling(
      async () => {
        // Essayer de charger depuis Supabase
        const supabaseConfig = await supabaseService.getAutomationConfig();
        
        if (supabaseConfig) {
          // Utiliser la config de Supabase MAIS forcer isActive à false
          const mergedConfig: AutomationConfig = {
            ...defaultConfig,
            ...supabaseConfig.config,
            isActive: false // Toujours démarrer inactif
          };
          
          set({
            isActive: false,
            config: mergedConfig,
            isInitialized: true
          });
          
          // Synchroniser avec localStorage (forcer false)
          try {
            localStorage.setItem('automation_active', JSON.stringify(false));
            localStorage.setItem('automation_config', JSON.stringify(mergedConfig));
          } catch (error) {
            console.warn('Erreur localStorage:', error);
          }
        } else {
          // Fallback sur localStorage puis défaut
          let persistedConfig: Partial<AutomationConfig> | null = null;
          
          try {
            if (typeof window !== 'undefined') {
              const rawConfig = localStorage.getItem('automation_config');
              if (rawConfig) persistedConfig = JSON.parse(rawConfig);
            }
          } catch (error) {
            console.warn('Erreur lecture localStorage:', error);
          }
          
          const finalConfig: AutomationConfig = {
            ...defaultConfig,
            ...persistedConfig,
            isActive: false // Toujours démarrer inactif
          };
          
          set({
            isActive: false,
            config: finalConfig,
            isInitialized: true
          });
          
          // Sauvegarder dans Supabase pour la prochaine fois
          try {
            await supabaseService.saveAutomationConfig(false, finalConfig);
          } catch (err) {
            useErrorStore.getState().handleWarning('Impossible de sauvegarder la config initiale dans Supabase');
          }
        }
      },
      'Erreur lors de l\'initialisation de la configuration'
    );
    
    set({ isLoading: false });
  },

  // Mise à jour de la configuration
  updateConfig: async (configUpdate: Partial<AutomationConfig>) => {
    const currentConfig = get().config;
    const newConfig: AutomationConfig = { ...currentConfig, ...configUpdate };
    
    set({ config: newConfig });
    
    // Sauvegarder dans localStorage
    try { 
      localStorage.setItem('automation_config', JSON.stringify(newConfig)); 
    } catch (error) {
      console.warn('Erreur sauvegarde localStorage:', error);
    }
    
    // Sauvegarder dans Supabase
    await errorUtils.withErrorHandling(
      () => supabaseService.saveAutomationConfig(get().isActive, newConfig),
      'Erreur sauvegarde config dans Supabase'
    );
  },

  // Basculer l'état de l'automation
  toggleAutomation: async () => {
    set({ isLoading: true });
    
    await errorUtils.withErrorHandling(
      async () => {
        const current = get().isActive;
        const newState = !current;
        const config = get().config;
        
        // Créer la config compatible avec n8nService
        const n8nConfig = {
          workflowId: 'automation-main', // ID par défaut
          isActive: newState,
          settings: {
            dailyLimit: config.dailyLimit,
            followUpDelay: config.followUpDelay,
            workingHours: config.workingHours,
            workingDays: config.workingDays
          }
        };
        
        await n8nService.toggleAutomation(newState, n8nConfig);
        set({ isActive: newState });
        
        // Sauvegarder dans localStorage
        try { 
          localStorage.setItem('automation_active', JSON.stringify(newState)); 
        } catch (error) {
          console.warn('Erreur sauvegarde localStorage:', error);
        }
        
        // Sauvegarder dans Supabase
        await supabaseService.saveAutomationConfig(newState, config);
        
        useErrorStore.getState().handleSuccess(
          `Automation ${newState ? 'activée' : 'désactivée'}`
        );
      },
      'Erreur lors du basculement de l\'automation'
    );
    
    set({ isLoading: false });
  },

  // Déclencher un workflow n8n
  triggerN8nWorkflow: async (
    workflowId: string, 
    data = {}, 
    opts = { timeoutMs: 15000 }
  ) => {
    set({ isLoading: true });
    
    const result = await errorUtils.withErrorHandling(
      async () => {
        return await n8nService.triggerWorkflow(workflowId, data, { 
          timeoutMs: opts.timeoutMs || 15000 
        });
      },
      'Erreur lors du déclenchement du workflow'
    );
    
    set({ isLoading: false });
    return result;
  },

  // Déclencher plusieurs workflows en lot
  batchTriggerWorkflows: async (
    actions: BatchWorkflowAction[], 
    opts = { timeoutMs: 30000 }
  ) => {
    set({ isLoading: true });
    
    const result = await errorUtils.withErrorHandling(
      async () => {
        return await n8nService.batchTriggerWorkflows(actions, { 
          timeoutMs: opts.timeoutMs || 30000 
        });
      },
      'Erreur lors du déclenchement des workflows en lot'
    );
    
    set({ isLoading: false });
    return result;
  },

  // Récupérer les statistiques
  fetchStats: async () => {
    set({ isLoading: true });
    
    await errorUtils.withErrorHandling(
      async () => {
        const rawStats = await n8nService.fetchStats();
        
        // Convertir les stats brutes en AutomationStats typées
        const stats: AutomationStats = {
          prospectsAdded: Number(rawStats.prospectsAdded) || 0,
          emailsSent: Number(rawStats.emailsSent) || 0,
          openRate: Number(rawStats.openRate) || 0,
          responseRate: Number(rawStats.responseRate) || 0,
          conversionRate: Number(rawStats.conversionRate) || 0,
          activeSequences: Number(rawStats.activeSequences) || 0,
          scheduledEmails: Number(rawStats.scheduledEmails) || 0,
          lastUpdate: new Date().toISOString(),
          prospectsAddedTrend: Number(rawStats.prospectsAddedTrend) || 0,
          emailsSentTrend: Number(rawStats.emailsSentTrend) || 0,
          openRateTrend: Number(rawStats.openRateTrend) || 0,
          responseRateTrend: Number(rawStats.responseRateTrend) || 0
        };
        
        set({ stats });
      },
      'Erreur lors de la récupération des statistiques'
    );
    
    set({ isLoading: false });
  },

  // Synchroniser avec n8n
  syncWithN8n: async () => {
    set({ isLoading: true });
    
    const result = await errorUtils.withErrorHandling(
      async () => {
        const config = get().config;
        
        // Créer la config compatible avec n8nService
        const n8nConfig = {
          workflowId: 'automation-main',
          isActive: get().isActive,
          settings: {
            dailyLimit: config.dailyLimit,
            followUpDelay: config.followUpDelay,
            workingHours: config.workingHours,
            workingDays: config.workingDays
          }
        };
        
        const syncResult = await n8nService.syncAutomationStatus(n8nConfig);
        
        // Mettre à jour les stats si disponibles
        if (syncResult?.data?.stats) {
          const rawStats = syncResult.data.stats as Record<string, unknown>;
          const stats: AutomationStats = {
            prospectsAdded: Number(rawStats.prospectsAdded) || 0,
            emailsSent: Number(rawStats.emailsSent) || 0,
            openRate: Number(rawStats.openRate) || 0,
            responseRate: Number(rawStats.responseRate) || 0,
            conversionRate: Number(rawStats.conversionRate) || 0,
            activeSequences: Number(rawStats.activeSequences) || 0,
            scheduledEmails: Number(rawStats.scheduledEmails) || 0,
            lastUpdate: new Date().toISOString(),
            prospectsAddedTrend: Number(rawStats.prospectsAddedTrend) || 0,
            emailsSentTrend: Number(rawStats.emailsSentTrend) || 0,
            openRateTrend: Number(rawStats.openRateTrend) || 0,
            responseRateTrend: Number(rawStats.responseRateTrend) || 0
          };
          set({ stats });
        }
        
        return syncResult;
      },
      'Erreur de synchronisation avec N8N'
    );
    
    set({ isLoading: false });
    return result;
  },

  // Démarrer une campagne de prospection
  startProspectionCampaign: async () => {
    set({ isLoading: true });
    
    const result = await errorUtils.withErrorHandling(
      async () => {
        const config = get().config;
        
        return await n8nService.triggerWorkflow('prospect_enrichment', {
          campaignType: 'prospection',
          config: {
            dailyLimit: config.dailyLimit,
            followUpDelay: config.followUpDelay,
            workingHours: config.workingHours,
            workingDays: config.workingDays
          }
        }, { timeoutMs: 30000 });
      },
      'Erreur lors du lancement de la campagne de prospection'
    );
    
    set({ isLoading: false });
    return result;
  }
}));
