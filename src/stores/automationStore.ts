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
  toggleAutomation: () => void;
  updateConfig: (config: Partial<AutomationState['config']>) => void;
  fetchStats: () => Promise<void>;
  triggerN8nWorkflow: (workflowId: string, data?: any) => Promise<void>;
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

  toggleAutomation: () => {
    const { isActive } = get();
    set({ isActive: !isActive });
    
    // Sauvegarder dans localStorage
    localStorage.setItem('automation_active', JSON.stringify(!isActive));
  },

  updateConfig: (newConfig) => {
    const { config } = get();
    const updatedConfig = { ...config, ...newConfig };
    set({ config: updatedConfig });
    
    // Sauvegarder dans localStorage
    localStorage.setItem('automation_config', JSON.stringify(updatedConfig));
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Récupérer les statistiques
      const [prospectsResult, emailsResult, sequencesResult, scheduledResult] = await Promise.all([
        supabase.from('prospects').select('id').gte('created_at', thirtyDaysAgo),
        supabase.from('email_tracking').select('*').gte('sent_at', thirtyDaysAgo),
        supabase.from('automated_sequences').select('id').eq('status', 'active'),
        supabase.from('prospects').select('id').not('next_follow_up', 'is', null).gte('next_follow_up', new Date().toISOString())
      ]);

      const emailTracking = emailsResult.data || [];
      const totalSent = emailTracking.length;
      const opened = emailTracking.filter(e => e.opened_at).length;
      const responded = emailTracking.filter(e => e.responded_at).length;
      const converted = emailTracking.filter(e => e.email_status === 'converted').length;

      set({
        stats: {
          prospectsAdded: prospectsResult.data?.length || 0,
          emailsSent: totalSent,
          openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
          responseRate: totalSent > 0 ? (responded / totalSent) * 100 : 0,
          conversionRate: totalSent > 0 ? (converted / totalSent) * 100 : 0,
          activeSequences: sequencesResult.data?.length || 0,
          scheduledEmails: scheduledResult.data?.length || 0
        },
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        isLoading: false 
      });
    }
  },

  triggerN8nWorkflow: async (workflowId: string, data = {}) => {
    try {
      const response = await fetch('/api/webhook-n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_workflow',
          data: { workflowId, ...data },
          timestamp: Math.floor(Date.now() / 1000),
          signature: 'generated_signature' // À implémenter
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du déclenchement du workflow');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  }
}));