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
// Dans votre fonction handleTrackEngagement
async function handleTrackEngagement(data, res) {
  const { prospectId, action, emailId } = data;
  
  // Envoyer à n8n avec le contexte approprié
  const webhookData = {
    prospect_id: prospectId,
    action: action, // 'email_opened', 'email_clicked', etc.
    email_id: emailId,
    timestamp: new Date().toISOString(),
    // Récupérer les données actuelles du prospect
    current_engagement_score: prospect.engagement_score,
    current_lead_score: prospect.lead_score,
    current_conversion_probability: prospect.conversion_probability
  };
  
  // Déclencher le workflow n8n approprié
  await triggerN8nWorkflow('update-prospect-context', webhookData);
}

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
  
  return res.status(200).json({ success: true });
} catch (error) {
  await logWebhookAccess(false, clientIP, req.body?.action, error.message);
  return res.status(500).json({ success: false, error: error.message });
}