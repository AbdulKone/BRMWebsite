import { supabase } from '../../../lib/supabase';
import { AutomationConfig, AutomationStats, RecentActivity, EmailTrackingData, SystemHealth } from '../types/automation.types';
import { errorUtils } from '../../../stores/errorStore';

export class AutomationService {
  static async fetchAutomationConfig(): Promise<AutomationConfig | null> {
    return await errorUtils.withErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('automation_config')
          .select('*')
          .eq('id', 'main')
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          const dbConfig = data.config as any;
          return {
            isActive: data.is_active,
            dailyLimit: dbConfig.dailyLimit || 50,
            followUpDelay: dbConfig.followUpDelay || 5,
            workingHours: dbConfig.workingHours || { start: '09:00', end: '18:00' },
            workingDays: dbConfig.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            activityTimeoutMinutes: dbConfig.activityTimeoutMinutes || 60,
            statsTimeframeDays: dbConfig.statsTimeframeDays || 30,
            recentActivityHours: dbConfig.recentActivityHours || 24,
            performanceThresholds: dbConfig.performanceThresholds || {
              openRate: { excellent: 25, good: 15 },
              responseRate: { excellent: 5, good: 2 }
            }
          };
        }

        return await this.createDefaultConfig();
      },
      'Erreur lors de la récupération de la configuration'
    );
  }

  private static async createDefaultConfig(): Promise<AutomationConfig> {
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
    
    await supabase.from('automation_config').insert({
      id: 'main',
      is_active: false,
      config: defaultConfig
    });
    
    return defaultConfig;
  }

  static async updateConfig(config: AutomationConfig): Promise<void> {
    try {
      await supabase
        .from('automation_config')
        .upsert({
          id: 'main',
          is_active: config.isActive,
          config: config,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
      throw error;
    }
  }

  static async fetchAutomationStats(config: AutomationConfig): Promise<AutomationStats | null> {
    try {
      const timeframeDays = config.statsTimeframeDays;
      const currentPeriodStart = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000).toISOString();
      const previousPeriodStart = new Date(Date.now() - timeframeDays * 2 * 24 * 60 * 60 * 1000).toISOString();
      const previousPeriodEnd = currentPeriodStart;
      
      // Requêtes parallèles pour la période actuelle
      const [prospectsResult, emailsResult, sequencesResult, scheduledResult] = await Promise.all([
        supabase.from('prospects').select('id').gte('created_at', currentPeriodStart),
        supabase.from('email_tracking').select('opened_at, responded_at, email_status').gte('sent_at', currentPeriodStart),
        supabase.from('automated_sequences').select('id').eq('is_active', true),
        supabase.from('prospects').select('id').not('next_follow_up', 'is', null).gte('next_follow_up', new Date().toISOString())
      ]);

      // Requêtes pour la période précédente
      const [prevProspectsResult, prevEmailsResult] = await Promise.all([
        supabase.from('prospects').select('id').gte('created_at', previousPeriodStart).lt('created_at', previousPeriodEnd),
        supabase.from('email_tracking').select('opened_at, responded_at, email_status').gte('sent_at', previousPeriodStart).lt('sent_at', previousPeriodEnd)
      ]);

      // Calculs
      const totalSent = emailsResult.data?.length || 0;
      const opened = emailsResult.data?.filter(e => e.opened_at).length || 0;
      const responded = emailsResult.data?.filter(e => e.responded_at).length || 0;
      const converted = emailsResult.data?.filter(e => e.email_status === 'converted').length || 0;
      const prospectsAdded = prospectsResult.data?.length || 0;

      const prevTotalSent = prevEmailsResult.data?.length || 0;
      const prevOpened = prevEmailsResult.data?.filter(e => e.opened_at).length || 0;
      const prevResponded = prevEmailsResult.data?.filter(e => e.responded_at).length || 0;
      const prevProspectsAdded = prevProspectsResult.data?.length || 0;

      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const currentOpenRate = totalSent > 0 ? (opened / totalSent) * 100 : 0;
      const prevOpenRate = prevTotalSent > 0 ? (prevOpened / prevTotalSent) * 100 : 0;
      const currentResponseRate = totalSent > 0 ? (responded / totalSent) * 100 : 0;
      const prevResponseRate = prevTotalSent > 0 ? (prevResponded / prevTotalSent) * 100 : 0;

      return {
        prospectsAdded,
        emailsSent: totalSent,
        openRate: currentOpenRate,
        responseRate: currentResponseRate,
        conversionRate: totalSent > 0 ? (converted / totalSent) * 100 : 0,
        activeSequences: sequencesResult.data?.length || 0,
        scheduledEmails: scheduledResult.data?.length || 0,
        lastUpdate: new Date().toISOString(),
        prospectsAddedTrend: calculateTrend(prospectsAdded, prevProspectsAdded),
        emailsSentTrend: calculateTrend(totalSent, prevTotalSent),
        openRateTrend: calculateTrend(currentOpenRate, prevOpenRate),
        responseRateTrend: calculateTrend(currentResponseRate, prevResponseRate)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
      return null;
    }
  }

  static async fetchRecentActivity(config: AutomationConfig): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];
      const recentHours = config.recentActivityHours;
      const timeThreshold = new Date(Date.now() - recentHours * 60 * 60 * 1000).toISOString();

      // Prospects récents
      const { data: recentProspects } = await supabase
        .from('prospects')
        .select('id, company_name, created_at')
        .gte('created_at', timeThreshold)
        .order('created_at', { ascending: false })
        .limit(5);

      recentProspects?.forEach(prospect => {
        activities.push({
          id: `prospect-${prospect.id}`,
          type: 'prospect_added',
          description: `Nouveau prospect ajouté: ${prospect.company_name}`,
          timestamp: prospect.created_at,
          status: 'success'
        });
      });

      // Emails récents
      const { data: recentEmails } = await supabase
        .from('email_tracking')
        .select(`
          id, 
          subject, 
          sent_at, 
          opened_at, 
          responded_at,
          prospects!inner(
            company_name
          )
        `)
        .gte('sent_at', timeThreshold)
        .order('sent_at', { ascending: false })
        .limit(10) as { data: EmailTrackingData[] | null };

      recentEmails?.forEach(email => {
        const companyName = email.prospects?.company_name || 'prospect';
        
        activities.push({
          id: `email-sent-${email.id}`,
          type: 'email_sent',
          description: `Email envoyé à ${companyName}: ${email.subject}`,
          timestamp: email.sent_at,
          status: 'success'
        });
        
        if (email.opened_at) {
          activities.push({
            id: `email-opened-${email.id}`,
            type: 'email_opened',
            description: `Email ouvert par ${companyName}`,
            timestamp: email.opened_at,
            status: 'success'
          });
        }
        
        if (email.responded_at) {
          activities.push({
            id: `email-replied-${email.id}`,
            type: 'email_replied',
            description: `Réponse reçue de ${companyName}`,
            timestamp: email.responded_at,
            status: 'success'
          });
        }
      });

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return activities.slice(0, 10);
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      return [];
    }
  }

  static async checkSystemHealth(config: AutomationConfig | null, isActive: boolean, error: string | null): Promise<SystemHealth> {
    try {
      // Vérifier la connexion à la base de données
      const { error: dbError } = await supabase.from('automation_config').select('id').limit(1);
      const databaseConnected = !dbError;

      // Vérifier la connexion n8n
      let n8nConnected = false;
      try {
        const response = await fetch('/api/webhook-n8n', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'health_check',
            timestamp: Math.floor(Date.now() / 1000)
          })
        });
        n8nConnected = response.ok;
      } catch {
        n8nConnected = false;
      }

      // Récupérer la dernière activité réelle
      const { data: lastActivityData } = await supabase
        .from('email_tracking')
        .select('sent_at')
        .order('sent_at', { ascending: false })
        .limit(1);

      const lastActivity = lastActivityData?.[0]?.sent_at 
        ? new Date(lastActivityData[0].sent_at) 
        : null;

      // Déterminer le statut du système
      if (!databaseConnected || !n8nConnected) {
        return {
          status: 'disconnected',
          color: 'red',
          label: 'Déconnecté',
          lastActivity,
          n8nConnected,
          databaseConnected
        };
      }

      if (error) {
        return {
          status: 'error',
          color: 'red',
          label: 'Erreur',
          lastActivity,
          n8nConnected,
          databaseConnected
        };
      }

      if (!isActive) {
        return {
          status: 'paused',
          color: 'yellow',
          label: 'En pause',
          lastActivity,
          n8nConnected,
          databaseConnected
        };
      }

      // Vérifier si le système est actif basé sur la configuration réelle
      const activityTimeoutMs = (config?.activityTimeoutMinutes || 60) * 60 * 1000;
      if (lastActivity && Date.now() - lastActivity.getTime() < activityTimeoutMs) {
        return {
          status: 'active',
          color: 'green',
          label: 'Actif',
          lastActivity,
          n8nConnected,
          databaseConnected
        };
      }

      return {
        status: 'idle',
        color: 'blue',
        label: 'Inactif',
        lastActivity,
        n8nConnected,
        databaseConnected
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de la santé du système:', error);
      return {
        status: 'error',
        color: 'red',
        label: 'Erreur de vérification',
        lastActivity: null,
        n8nConnected: false,
        databaseConnected: false
      };
    }
  }
}

export const automationService = {
  async getConfiguration() {
    return await errorUtils.withErrorHandling(
      async () => {
        const response = await fetch('/api/automation/config');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
      'Erreur lors de la récupération de la configuration'
    );
  },

  async updateConfiguration(config: any) {
    return await errorUtils.withErrorHandling(
      async () => {
        const response = await fetch('/api/automation/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
      'Erreur lors de la mise à jour de la configuration'
    );
  },

  async getStats() {
    return await errorUtils.withErrorHandling(
      async () => {
        const response = await fetch('/api/automation/stats');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
      'Erreur lors de la récupération des stats'
    );
  },

  async getRecentActivity() {
    return await errorUtils.withErrorHandling(
      async () => {
        const response = await fetch('/api/automation/activity');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
      'Erreur lors de la récupération des activités'
    );
  },

  async checkSystemHealth() {
    return await errorUtils.withErrorHandling(
      async () => {
        const response = await fetch('/api/automation/health');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      },
      'Erreur lors de la vérification de la santé du système'
    );
  }
};