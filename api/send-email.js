import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Configuration du client SES
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

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

  try {
    // Ajoutez ces logs de debug
    console.log('Environment variables check:', {
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'MISSING',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
      senderEmail: process.env.SES_SENDER_EMAIL
    });
    
    const { to, subject, body, templateId, prospectId, campaignId } = req.body;

    // Validation des données
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, body' 
      });
    }

    // Paramètres pour SES
    const params = {
      Source: process.env.SES_SENDER_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: body,
            Charset: 'UTF-8',
          },
        },
      },
      // Retirez temporairement ConfigurationSetName si vous n'en avez pas
      // ConfigurationSetName: 'email_tracking',
    };

    // Envoi de l'email via SES
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    console.log('Email envoyé avec succès:', {
      messageId: result.MessageId,
      to: to,
      subject: subject
    });

    // Retourner le succès
    return res.status(200).json({
      success: true,
      messageId: result.MessageId,
      templateId,
      prospectId,
      campaignId
    });

  } catch (error) {
    console.error('Erreur détaillée:', {
      message: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Erreur interne du serveur',
      code: error.Code
    });
  }
}