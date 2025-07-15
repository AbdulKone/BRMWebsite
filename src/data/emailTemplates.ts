export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'initial_contact',
    name: 'Premier Contact',
    subject: 'Découvrez nos services de production musicale',
    content: `Bonjour {{contact_name}},

Je suis {{sender_name}} de Black Road Music. Nous sommes un studio de production musicale spécialisé dans le Stoner Doom Metal.

Je vous contacte car nous pensons que nos services pourraient vous intéresser.

Seriez-vous disponible pour un court appel cette semaine ?

Cordialement,
{{sender_name}}
Black Road Music`,
    variables: ['contact_name', 'sender_name']
  },
  {
    id: 'follow_up',
    name: 'Relance',
    subject: 'Re: Nos services de production musicale',
    content: `Bonjour {{contact_name}},

Je me permets de revenir vers vous concernant ma précédente proposition.

Avez-vous eu l'occasion d'y réfléchir ?

Cordialement,
{{sender_name}}
Black Road Music`,
    variables: ['contact_name', 'sender_name']
  }
];

export const getTemplate = (templateId: string): EmailTemplate | undefined => {
  return emailTemplates.find(template => template.id === templateId);
};

export const compileTemplate = (template: EmailTemplate, variables: Record<string, string>): string => {
  let compiledContent = template.content;
  template.variables.forEach(variable => {
    compiledContent = compiledContent.replace(
      new RegExp(`{{${variable}}}`, 'g'),
      variables[variable] || `{{${variable}}}`
    );
  });
  return compiledContent;
};