import { useErrorStore } from '../stores/errorStore';

const { handleError } = useErrorStore.getState();

export const sendEmailViaBackend = async ({
  to,
  subject,
  body,
  templateId,
  prospectId,
  campaignId
}: {
  to: string;
  subject: string;
  body: string;
  templateId: string;
  prospectId: string;
  campaignId: string;
}) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        templateId,
        prospectId,
        campaignId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    handleError(error, 'Erreur lors de l\'envoi de l\'email via le backend');
    return { success: false, error };
  }
};