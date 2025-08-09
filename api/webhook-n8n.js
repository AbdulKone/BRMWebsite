import { supabase } from '../src/lib/supabase';

const crypto = require('crypto');

// Fonction pour journaliser les accès
async function logWebhookAccess(success, ip, action, error = null) {
  try {
    await supabase.from('webhook_logs').insert({
      success,
      ip_address: ip,
      action,
      error_message: error,
      timestamp: new Date().toISOString()
    });
  } catch (logError) {
    console.error('Erreur de journalisation:', logError);
  }
}

export default async function handler(req, res) {
  // Gérer les requêtes CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérification de l'adresse IP (optionnel)
  const allowedIPs = process.env.N8N_ALLOWED_IPS ? process.env.N8N_ALLOWED_IPS.split(',') : [];
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
    console.warn(`Tentative d'accès non autorisée depuis l'IP: ${clientIP}`);
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  try {
    const { action, data, timestamp, signature } = req.body;
    
    // Vérification de l'expiration du timestamp (15 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);
    
    if (isNaN(requestTime) || currentTime - requestTime > 900) { // 15 minutes
      return res.status(401).json({ success: false, error: 'Request expired' });
    }
    
    // Vérification de la signature HMAC
    const payload = JSON.stringify({ action, data, timestamp });
    const expectedSignature = crypto
      .createHmac('sha256', process.env.N8N_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    if (!signature || signature !== expectedSignature) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }
    
    // Traiter différentes actions
    switch (action) {
      case 'start_automation':
        return await handleStartAutomation(data, res);
      case 'stop_automation':
        return await handleStopAutomation(data, res);
      case 'trigger_workflow':
        return await handleTriggerWorkflow(data, res);
      case 'sync_automation_status':
        return await handleSyncAutomationStatus(data, res);
      case 'send_email':
        return await handleSendEmail(data, res);
      case 'update_prospect':
        return await handleUpdateProspect(data, res);
      case 'start_sequence':
        return await handleStartSequence(data, res);
      case 'track_engagement':
        return await handleTrackEngagement(data, res);
      default:
        return res.status(400).json({ success: false, error: 'Action non reconnue' });
    }
  } catch (error) {
    console.error('Erreur webhook n8n:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur'
    });
  }
}

// Fonction pour envoyer un email
async function handleSendEmail(data, res) {
  const { to, subject, body, templateId, prospectId, campaignId } = data;
  
  // Validation des données
  if (!to || !subject || !body) {
    return res.status(400).json({ 
      success: false, 
      error: 'Données manquantes: to, subject, body' 
    });
  }

  try {
    // Utiliser le service d'envoi d'email existant
    const emailResult = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, templateId, prospectId, campaignId })
    });
    
    const result = await emailResult.json();
    
    // Enregistrer le tracking dans Supabase
    if (result.success) {
      await supabase.from('email_tracking').insert({
        prospect_id: prospectId,
        template_id: templateId,
        campaign_id: campaignId,
        email_status: 'sent',
        sent_at: new Date().toISOString(),
        subject: subject
      });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Fonction pour mettre à jour un prospect
async function handleUpdateProspect(data, res) {
  const { prospectId, updates } = data;
  
  if (!prospectId || !updates) {
    return res.status(400).json({ 
      success: false, 
      error: 'Données manquantes: prospectId, updates' 
    });
  }

  try {
    const { error } = await supabase
      .from('prospects')
      .update(updates)
      .eq('id', prospectId);
    
    if (error) throw error;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Fonction pour démarrer une séquence d'emails
async function handleStartSequence(data, res) {
  const { prospectId, sequenceId } = data;
  
  if (!prospectId || !sequenceId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Données manquantes: prospectId, sequenceId' 
    });
  }

  try {
    // Importer la fonction depuis le module existant
    const { startEmailSequence } = await import('../src/data/emailSequences');
    await startEmailSequence(prospectId, sequenceId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Fonction pour suivre l'engagement (ouvertures, clics)
async function handleTrackEngagement(data, res) {
  const { prospectId, action, emailId } = data;
  
  if (!prospectId || !action) {
    return res.status(400).json({ 
      success: false, 
      error: 'Données manquantes: prospectId, action' 
    });
  }

  try {
    const prospect = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();
    
    if (!prospect.data) {
      return res.status(404).json({ success: false, error: 'Prospect non trouvé' });
    }
    
    const updates = {};
    
    if (action === 'open') {
      updates.email_opens = (prospect.data.email_opens || 0) + 1;
      
      // Mettre à jour le statut de l'email si un ID est fourni
      if (emailId) {
        await supabase
          .from('email_tracking')
          .update({ 
            email_status: 'opened',
            opened_at: new Date().toISOString() 
          })
          .eq('id', emailId);
      }
    } else if (action === 'click') {
      updates.email_clicks = (prospect.data.email_clicks || 0) + 1;
      
      if (emailId) {
        await supabase
          .from('email_tracking')
          .update({ 
            email_status: 'clicked',
            clicked_at: new Date().toISOString() 
          })
          .eq('id', emailId);
      }
    } else if (action === 'reply') {
      if (emailId) {
        await supabase
          .from('email_tracking')
          .update({ 
            email_status: 'replied',
            responded_at: new Date().toISOString() 
          })
          .eq('id', emailId);
      }
    }
    
    // Mettre à jour le prospect
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('prospects')
        .update(updates)
        .eq('id', prospectId);
    }

    // Envoyer à n8n avec le contexte approprié
    const webhookData = {
      prospect_id: prospectId,
      action: action,
      email_id: emailId,
      timestamp: new Date().toISOString(),
      current_engagement_score: prospect.data.engagement_score,
      current_lead_score: prospect.data.lead_score,
      current_conversion_probability: prospect.data.conversion_probability
    };
    
    // Déclencher le workflow n8n approprié
    await triggerN8nWorkflow('update-prospect-context', webhookData);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logWebhookAccess(false, clientIP, action, error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Nouvelles fonctions pour gérer l'automatisation
async function handleStartAutomation(data, res) {
  try {
    const { config } = data;
    
    // Déclencher les workflows n8n appropriés
    const workflows = [
      'prospect-enrichment-workflow',
      'email-sequence-workflow', 
      'lead-scoring-workflow'
    ];
    
    for (const workflowId of workflows) {
      await triggerN8nWorkflow(workflowId, { 
        action: 'start',
        config 
      });
    }
    
    // Enregistrer l'état dans la base de données
    await supabase.from('automation_config').upsert({
      id: 'main',
      is_active: true,
      config,
      updated_at: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Automatisation démarrée avec succès' 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleStopAutomation(data, res) {
  try {
    // Arrêter les workflows n8n
    const workflows = [
      'prospect-enrichment-workflow',
      'email-sequence-workflow',
      'lead-scoring-workflow'
    ];
    
    for (const workflowId of workflows) {
      await triggerN8nWorkflow(workflowId, { action: 'stop' });
    }
    
    // Mettre à jour l'état dans la base de données
    await supabase.from('automation_config').upsert({
      id: 'main',
      is_active: false,
      updated_at: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Automatisation arrêtée avec succès' 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleTriggerWorkflow(data, res) {
  try {
    const { workflowId, ...workflowData } = data;
    
    const result = await triggerN8nWorkflow(workflowId, workflowData);
    
    return res.status(200).json({ 
      success: true, 
      result,
      message: `Workflow ${workflowId} déclenché avec succès` 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function handleSyncAutomationStatus(data, res) {
  try {
    const { currentConfig, isActive } = data;
    
    // Synchroniser avec n8n
    await triggerN8nWorkflow('sync-status-workflow', {
      config: currentConfig,
      isActive
    });
    
    // Récupérer les statistiques mises à jour
    const stats = await getAutomationStats();
    
    return res.status(200).json({ 
      success: true, 
      stats,
      message: 'Synchronisation réussie' 
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Fonction utilitaire pour déclencher un workflow n8n
async function triggerN8nWorkflow(workflowId, data) {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  const n8nApiKey = process.env.N8N_API_KEY;
  
  if (!n8nUrl || !n8nApiKey) {
    throw new Error('Configuration n8n manquante');
  }
  
  const response = await fetch(`${n8nUrl}/webhook/${workflowId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${n8nApiKey}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Erreur n8n: ${response.statusText}`);
  }
  
  return await response.json();
}

// Fonction pour récupérer les statistiques d'automatisation
async function getAutomationStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const [prospectsResult, emailsResult, sequencesResult, scheduledResult] = await Promise.all([
    supabase.from('prospects').select('id').gte('created_at', thirtyDaysAgo),
    supabase.from('email_tracking').select('*').gte('sent_at', thirtyDaysAgo),
    supabase.from('campaigns').select('id').eq('status', 'active'),
    supabase.from('prospects').select('id').not('next_follow_up', 'is', null).gte('next_follow_up', new Date().toISOString())
  ]);

  const emailTracking = emailsResult.data || [];
  const totalSent = emailTracking.length;
  const opened = emailTracking.filter(e => e.opened_at).length;
  const responded = emailTracking.filter(e => e.responded_at).length;
  const converted = emailTracking.filter(e => e.email_status === 'converted').length;

  return {
    prospectsAdded: prospectsResult.data?.length || 0,
    emailsSent: totalSent,
    openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
    responseRate: totalSent > 0 ? (responded / totalSent) * 100 : 0,
    conversionRate: totalSent > 0 ? (converted / totalSent) * 100 : 0,
    activeSequences: sequencesResult.data?.length || 0,
    scheduledEmails: scheduledResult.data?.length || 0
  };
}