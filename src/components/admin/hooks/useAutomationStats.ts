import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { AutomationStats } from '../types/automationTypes';
import { useErrorStore } from '../../../stores/errorStore';

export function useAutomationStats() {
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Suppression de: const [error, setError] = useState<string | null>(null);
  const { handleError } = useErrorStore();

  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      // Suppression de: setError(null);
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Requêtes parallèles pour optimiser les performances
      const [prospectsResult, emailsResult, sequencesResult, scheduledResult] = await Promise.all([
        supabase
          .from('prospects')
          .select('id')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('email_tracking')
          .select('opened_at, responded_at, email_status')
          .gte('sent_at', thirtyDaysAgo),
        supabase
          .from('automated_sequences')
          .select('id')
          .eq('status', 'active'),
        supabase
          .from('prospects')
          .select('id')
          .not('next_follow_up', 'is', null)
          .gte('next_follow_up', new Date().toISOString())
      ]);

      const totalSent = emailsResult.data?.length || 0;
      const opened = emailsResult.data?.filter(e => e.opened_at).length || 0;
      const responded = emailsResult.data?.filter(e => e.responded_at).length || 0;
      const converted = emailsResult.data?.filter(e => e.email_status === 'converted').length || 0;

      setStats({
        prospectsAdded: prospectsResult.data?.length || 0,
        emailsSent: totalSent,
        openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
        responseRate: totalSent > 0 ? (responded / totalSent) * 100 : 0,
        conversionRate: totalSent > 0 ? (converted / totalSent) * 100 : 0,
        activeSequences: sequencesResult.data?.length || 0,
        scheduledEmails: scheduledResult.data?.length || 0,
        lastUpdate: new Date().toISOString()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      handleError('Erreur lors de la récupération des statistiques d\'automation', errorMessage);
      // Suppression de: setError('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Suppression du retour de error
  return { stats, isLoading, refreshStats };
}