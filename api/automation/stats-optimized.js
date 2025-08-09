import { supabase } from '../../src/lib/supabase';
import { automationCache } from '../../src/lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { period = '30d', refresh = false } = req.query;
  const cacheKey = `automation_stats_${period}`;

  // Vérifier le cache d'abord
  if (!refresh) {
    const cached = automationCache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, cached: true });
    }
  }

  try {
    // Utiliser la vue matérialisée pour de meilleures performances
    const { data: statsData } = await supabase
      .from('automation_stats_mv')
      .select('*')
      .single();

    if (!statsData) {
      // Fallback vers le calcul direct si la vue n'existe pas
      return await calculateStatsDirectly(period, res);
    }

    const stats = {
      prospectsAdded: statsData.prospects_added_30d || 0,
      emailsSent: statsData.emails_sent_30d || 0,
      openRate: statsData.emails_sent_30d > 0 
        ? (statsData.emails_opened_30d / statsData.emails_sent_30d) * 100 
        : 0,
      responseRate: statsData.emails_sent_30d > 0 
        ? (statsData.emails_responded_30d / statsData.emails_sent_30d) * 100 
        : 0,
      activeSequences: statsData.active_sequences || 0,
      scheduledEmails: statsData.scheduled_emails || 0,
      lastUpdate: statsData.last_updated
    };

    // Mettre en cache pour 2 minutes
    automationCache.set(cacheKey, stats, 2 * 60 * 1000);

    res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function calculateStatsDirectly(period, res) {
  // Implémentation de fallback...
}