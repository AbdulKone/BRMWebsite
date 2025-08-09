import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { RecentActivity, EmailTrackingData } from '../types/automationTypes';

export function useRecentActivity() {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const activities: RecentActivity[] = [];
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Prospects récents
      const { data: recentProspects } = await supabase
        .from('prospects')
        .select('id, company_name, created_at')
        .gte('created_at', last24Hours)
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

      // Emails récents - CORRECTION de l'erreur TypeScript
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
        .gte('sent_at', last24Hours)
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

      // Trier et limiter
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { activities, isLoading, refreshActivities };
}