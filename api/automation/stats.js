import { supabase } from '../../src/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Prospects ajoutés
    const { data: newProspects } = await supabase
      .from('prospects')
      .select('id')
      .gte('created_at', thirtyDaysAgo);

    // Emails envoyés
    const { data: emailTracking } = await supabase
      .from('email_tracking')
      .select('*')
      .gte('sent_at', thirtyDaysAgo);

    // Séquences actives
    const { data: activeSequences } = await supabase
      .from('prospect_sequences')
      .select('id')
      .eq('status', 'active');

    // Emails programmés
    const { data: scheduledEmails } = await supabase
      .from('scheduled_emails')
      .select('id')
      .gte('scheduled_for', new Date().toISOString())
      .eq('status', 'pending');

    const totalSent = emailTracking?.length || 0;
    const opened = emailTracking?.filter(e => e.opened_at).length || 0;
    const responded = emailTracking?.filter(e => e.responded_at).length || 0;
    const converted = emailTracking?.filter(e => e.email_status === 'converted').length || 0;

    const stats = {
      prospectsAdded: newProspects?.length || 0,
      emailsSent: totalSent,
      openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
      responseRate: totalSent > 0 ? (responded / totalSent) * 100 : 0,
      conversionRate: totalSent > 0 ? (converted / totalSent) * 100 : 0,
      activeSequences: activeSequences?.length || 0,
      scheduledEmails: scheduledEmails?.length || 0,
      lastUpdate: new Date().toISOString()
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}