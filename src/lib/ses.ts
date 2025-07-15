// First install the AWS SDK SES client:
// npm install @aws-sdk/client-ses
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

export const sendEmail = async ({
  to,
  subject,
  body,
  configurationSetName = 'email_tracking',
}: {
  to: string;
  subject: string;
  body: string;
  configurationSetName?: string;
}) => {
  // Validation des variables d'environnement
  if (!import.meta.env.VITE_AWS_REGION || 
      !import.meta.env.VITE_AWS_ACCESS_KEY_ID || 
      !import.meta.env.VITE_AWS_SECRET_ACCESS_KEY ||
      !import.meta.env.VITE_SES_SENDER_EMAIL) {
    console.error('Variables d\'environnement AWS manquantes');
    return { success: false, error: 'Configuration AWS incomplète' };
  }

  const params = {
    Source: import.meta.env.VITE_SES_SENDER_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: body } }, // Changé en HTML pour un meilleur rendu
    },
    ConfigurationSetName: configurationSetName,
  };

  try {
    const result = await ses.send(new SendEmailCommand(params));
    console.log('Email envoyé avec succès à:', to, 'MessageId:', result.MessageId);
    return { 
      success: true, 
      messageId: result.MessageId 
    };
  } catch (error) {
    console.error('Erreur envoi email à:', to, error);
    return { success: false, error };
  }
};