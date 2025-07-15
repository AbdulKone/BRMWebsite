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
  const params = {
    Source: import.meta.env.VITE_SES_SENDER_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: body } },
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
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};