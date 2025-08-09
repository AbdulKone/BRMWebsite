import crypto from 'crypto';
import { supabase } from '@/lib/supabaseClient';

async function logWebhookAccess(success, ip, action, error = null) {
  try {
    await supabase.from('webhook_logs').insert({
      success,
      ip_address: ip,
      action,
      error_message: error
    });
  } catch (err) {
    console.error('Erreur lors du log webhook:', err);
  }
}

async function triggerN8nWorkflow(workflowId, data) {
  const n8nUrl = process.env.N8N_BASE_URL;
  const n8nApiKey = process.env.N8N_API_KEY;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${n8nUrl}/webhook/${workflowId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${n8nApiKey}`
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erreur n8n: ${response.status} ${errText}`);
    }
    return await response.json();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

export default async function handler(req, res) {
  const clientIP =
    (req.headers['x-forwarded-for'] || '').split(',')[0] ||
    req.socket?.remoteAddress;

  try {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const allowedIPs = process.env.N8N_ALLOWED_IPS?.split(',') || [];
    if (allowedIPs.length && !allowedIPs.includes(clientIP)) {
      await logWebhookAccess(false, clientIP, null, 'IP non autorisée');
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { action, data, timestamp, signature } = req.body;
    const now = Math.floor(Date.now() / 1000);
    if (!timestamp || now - parseInt(timestamp, 10) > 900) {
      await logWebhookAccess(false, clientIP, action, 'Request expired');
      return res.status(401).json({ success: false, error: 'Request expired' });
    }

    const payload = JSON.stringify({ action, data, timestamp });
    const expectedSignature = crypto
      .createHmac('sha256', process.env.N8N_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      await logWebhookAccess(false, clientIP, action, 'Invalid signature');
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }

    let result;
    switch (action) {
      case 'send_email':
        result = await handleSendEmail(data, res);
        break;
      case 'update_prospect':
        result = await handleUpdateProspect(data, res);
        break;
      case 'track_engagement':
        result = await handleTrackEngagement(data, res);
        break;
      case 'start_automation':
        result = await Promise.all(data.workflows.map(id =>
          triggerN8nWorkflow(id, { action: 'start', config: data.config })
        ));
        break;
      case 'stop_automation':
        result = await Promise.all(data.workflows.map(id =>
          triggerN8nWorkflow(id, { action: 'stop' })
        ));
        break;
      case 'update_prospect_scores':
        result = await updateScores();
        break;
      default:
        return res.status(400).json({ success: false, error: 'Unknown action' });
    }

    await logWebhookAccess(true, clientIP, action);
    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    await logWebhookAccess(false, clientIP, null, error.message);
    console.error('Erreur webhook:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Exemple handler
async function handleSendEmail({ to, subject, body }, res) {
  if (!to || !subject || !body) {
    return res.status(400).json({ success: false, error: 'Missing email parameters' });
  }
  const response = await fetch(`${process.env.APP_URL}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, body })
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur envoi email: ${errText}`);
  }
  return await response.json();
}
