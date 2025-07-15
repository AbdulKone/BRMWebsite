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
    console.error('Erreur envoi email via backend:', error);
    return { success: false, error };
  }
};