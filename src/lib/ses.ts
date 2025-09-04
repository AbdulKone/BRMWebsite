// First install the AWS SDK SES client:
// npm install @aws-sdk/client-ses
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { useErrorStore } from '../stores/errorStore';

const { handleError } = useErrorStore.getState();

interface EmailParams {
  to: string;
  subject: string;
  body: string;
  configurationSetName?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: unknown;
}

// Validation des variables d'environnement au niveau du module
const validateEnvironmentVariables = (): boolean => {
  const requiredVars = [
    'VITE_AWS_REGION',
    'VITE_AWS_ACCESS_KEY_ID', 
    'VITE_AWS_SECRET_ACCESS_KEY',
    'VITE_SES_SENDER_EMAIL'
  ];
  
  return requiredVars.every(varName => {
    const value = import.meta.env[varName];
    return value && value.trim() !== '';
  });
};

// Initialisation du client SES avec validation
const createSESClient = (): SESClient | null => {
  if (!validateEnvironmentVariables()) {
    const errorMsg = 'Variables d\'environnement AWS manquantes';
    handleError(new Error(errorMsg), 'Configuration AWS');
    return null;
  }

  return new SESClient({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    },
  });
};

const ses = createSESClient();

export const sendEmail = async ({
  to,
  subject,
  body,
  configurationSetName = 'email_tracking',
}: EmailParams): Promise<EmailResult> => {
  // Vérification de l'initialisation du client SES
  if (!ses) {
    return { 
      success: false, 
      error: 'Configuration AWS incomplète' 
    };
  }

  // Validation des paramètres d'entrée
  if (!to || !subject || !body) {
    const errorMsg = 'Paramètres d\'email manquants (to, subject, body)';
    handleError(new Error(errorMsg), 'Validation Email');
    return { 
      success: false, 
      error: 'Paramètres d\'email invalides' 
    };
  }

  // Validation de l'adresse email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    const errorMsg = `Adresse email invalide: ${to}`;
    handleError(new Error(errorMsg), 'Validation Email');
    return { 
      success: false, 
      error: 'Adresse email invalide' 
    };
  }

  const params = {
    Source: import.meta.env.VITE_SES_SENDER_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: body } },
    },
    ConfigurationSetName: configurationSetName,
  };

  try {
    const result = await ses.send(new SendEmailCommand(params));
    return { 
      success: true, 
      messageId: result.MessageId 
    };
  } catch (error) {
    handleError(error, `Erreur lors de l'envoi de l'email à ${to}`);
    return { 
      success: false, 
      error 
    };
  }
};