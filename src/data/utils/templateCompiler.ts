import { EmailTemplate } from '../types/emailTypes';

/**
 * Compile un template avec les variables fournies
 */
export const compileTemplate = (
  template: EmailTemplate, 
  variables: Record<string, string>
): { subject: string; content: string } => {
  const replaceVariables = (text: string): string => {
    return Object.entries(variables).reduce((result, [key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      return result.replace(regex, value || `[${key}]`);
    }, text);
  };

  return {
    subject: replaceVariables(template.subject),
    content: replaceVariables(template.content)
  };
};

/**
 * Valide que toutes les variables requises sont fournies
 */
export const validateTemplateVariables = (
  template: EmailTemplate, 
  variables: Record<string, string>
): string[] => {
  return template.variables.filter(variable => 
    !variables[variable] || variables[variable].trim() === ''
  );
};

/**
 * Génère un lien de désabonnement sécurisé
 */
export const generateUnsubscribeLink = (prospectId: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/unsubscribe?id=${encodeURIComponent(prospectId)}`;
};

/**
 * Génère un lien de réservation personnalisé
 */
export const generateBookingLink = (prospectId: string): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/book-meeting?prospect=${encodeURIComponent(prospectId)}`;
};