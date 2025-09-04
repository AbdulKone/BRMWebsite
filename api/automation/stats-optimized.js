import { supabase } from '../../src/lib/supabase';

// Cache simple en mémoire pour les statistiques
const statsCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Périodes valides supportées
const VALID_PERIODS = ['7d', '30d', '90d'];

function getCachedStats(key) {
  const cached = statsCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    statsCache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCachedStats(key, data) {
  statsCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Calculer la date de début selon la période
function getStartDate(period) {
  const now = new Date();
  const days = parseInt(period.replace('d', ''));
  const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  return startDate.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { period = '30d', refresh = false } = req.query;
  
  // Validation de la période
  if (!VALID_PERIODS.includes(period)) {
    return res.status(400).json({ 
      error: 'Invalid period. Supported periods: 7d, 30d, 90d' 
    });
  }

  const cacheKey = `automation_stats_${period}`;

  // Vérifier le cache d'abord
  if (!refresh) {
    const cached = getCachedStats(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached, cached: true });
    }
  }

  try {
    // Essayer d'utiliser la vue matérialisée d'abord
    const { data: statsData, error: viewError } = await supabase
      .from('automation_stats_mv')
      .select('*')
      .single();

    if (viewError || !statsData) {
      // Fallback vers le calcul direct si la vue n'existe pas
      console.warn('Vue matérialisée non disponible, calcul direct:', viewError?.message);
      return await calculateStatsDirectly(period, res, cacheKey);
    }

    const stats = {
      prospectsAdded: statsData.prospects_added_30d || 0,
      emailsSent: statsData.emails_sent_30d || 0,
      openRate: statsData.emails_sent_30d > 0 
        ? Math.round((statsData.emails_opened_30d / statsData.emails_sent_30d) * 100 * 100) / 100
        : 0,
      responseRate: statsData.emails_sent_30d > 0 
        ? Math.round((statsData.emails_responded_30d / statsData.emails_sent_30d) * 100 * 100) / 100
        : 0,
      activeSequences: statsData.active_sequences || 0,
      scheduledEmails: statsData.scheduled_emails || 0,
      lastUpdate: statsData.last_updated || new Date().toISOString(),
      period
    };

    // Mettre en cache pour 2 minutes
    setCachedStats(cacheKey, stats);

    res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    
    // Essayer le fallback en cas d'erreur
    try {
      return await calculateStatsDirectly(period, res, cacheKey);
    } catch (fallbackError) {
      console.error('Erreur dans le fallback:', fallbackError);
      res.status(500).json({ 
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

async function calculateStatsDirectly(period, res, cacheKey) {
  const startDate = getStartDate(period);
  
  try {
    // Calculer les statistiques directement depuis les tables
    const [prospectsResult, emailsResult, sequencesResult] = await Promise.all([
      // Prospects ajoutés
      supabase
        .from('prospects')
        .select('id', { count: 'exact' })
        .gte('created_at', startDate),
      
      // Emails envoyés et statistiques
      supabase
        .from('email_tracking')
        .select('sent_at, opened_at, replied_at', { count: 'exact' })
        .gte('sent_at', startDate)
        .not('sent_at', 'is', null),
      
      // Séquences actives
      supabase
        .from('email_sequences')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
    ]);

    // Emails programmés (à envoyer dans les prochaines 24h)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { count: scheduledCount } = await supabase
      .from('email_tracking')
      .select('id', { count: 'exact' })
      .is('sent_at', null)
      .lte('scheduled_for', tomorrow.toISOString());

    const prospectsAdded = prospectsResult.count || 0;
    const emailsSent = emailsResult.count || 0;
    
    // Calculer les taux d'ouverture et de réponse
    let openRate = 0;
    let responseRate = 0;
    
    if (emailsSent > 0 && emailsResult.data) {
      const emailsOpened = emailsResult.data.filter(email => email.opened_at).length;
      const emailsReplied = emailsResult.data.filter(email => email.replied_at).length;
      
      openRate = Math.round((emailsOpened / emailsSent) * 100 * 100) / 100;
      responseRate = Math.round((emailsReplied / emailsSent) * 100 * 100) / 100;
    }

    const stats = {
      prospectsAdded,
      emailsSent,
      openRate,
      responseRate,
      activeSequences: sequencesResult.count || 0,
      scheduledEmails: scheduledCount || 0,
      lastUpdate: new Date().toISOString(),
      period,
      calculatedDirectly: true
    };

    // Mettre en cache
    setCachedStats(cacheKey, stats);

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur dans calculateStatsDirectly:', error);
    throw error;
  }
}