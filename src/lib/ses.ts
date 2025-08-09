// First install the AWS SDK SES client:
// npm install @aws-sdk/client-ses
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { useErrorStore } from '../stores/errorStore';

const { handleError } = useErrorStore.getState();

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
    const errorMsg = 'Variables d\'environnement AWS manquantes';
    handleError(new Error(errorMsg), 'Configuration AWS');
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
    // Remplacer console.log par un toast de succès si nécessaire
    // toast.success(`Email envoyé avec succès à ${to}`);
    return { 
      success: true, 
      messageId: result.MessageId 
    };
  } catch (error) {
    handleError(error, `Erreur lors de l'envoi de l'email à ${to}`);
    return { success: false, error };
  }
};