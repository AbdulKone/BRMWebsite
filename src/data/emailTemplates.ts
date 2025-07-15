export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category?: 'prospection' | 'follow_up' | 'commercial' | 'newsletter';
  isActive?: boolean;
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'first_contact',
    name: 'Premier contact',
    subject: 'Collaboration musicale - {{contact_name}}',
    category: 'prospection',
    isActive: true,
    body: `Bonjour {{contact_name}},

J'espère que ce message vous trouve en bonne santé.

Je me permets de vous contacter car je pense que nous pourrions collaborer sur des projets musicaux intéressants.

Notre studio propose des services de production, mixage et mastering de haute qualité. Nous avons travaillé avec de nombreux artistes et labels reconnus.

Seriez-vous disponible pour un appel de 15 minutes cette semaine pour discuter de vos besoins ?

Cordialement,
{{sender_name}}
Black Road Music

---
Si vous ne souhaitez plus recevoir nos emails, cliquez ici : {{unsubscribe_link}}
Ou répondez STOP à cet email.`,
    variables: ['contact_name', 'sender_name', 'unsubscribe_link']
  },
  {
    id: 'follow_up',
    name: 'Relance',
    subject: 'Suivi - Collaboration {{contact_name}}',
    category: 'follow_up',
    isActive: true,
    body: `Bonjour {{contact_name}},

Je reviens vers vous concernant ma proposition de collaboration.

Avez-vous eu l'occasion de réfléchir à nos services de production musicale ?

Je serais ravi de vous présenter notre portfolio et discuter de vos projets en cours.

N'hésitez pas à me faire savoir si vous avez des questions.

Cordialement,
{{sender_name}}
Black Road Music

---
Si vous ne souhaitez plus recevoir nos emails, cliquez ici : {{unsubscribe_link}}
Ou répondez STOP à cet email.`,
    variables: ['contact_name', 'sender_name', 'unsubscribe_link']
  },
  {
    id: 'proposal_sent',
    name: 'Proposition envoyée',
    subject: 'Votre devis personnalisé - {{contact_name}}',
    category: 'commercial',
    isActive: true,
    body: `Bonjour {{contact_name}},

Comme convenu lors de notre échange, vous trouverez ci-joint votre devis personnalisé pour votre projet "{{project_name}}".

Ce devis inclut :
- Production complète
- Mixage professionnel
- Mastering
- Révisions incluses

Je reste à votre disposition pour toute question ou ajustement.

Cordialement,
{{sender_name}}
Black Road Music

---
Si vous ne souhaitez plus recevoir nos emails, cliquez ici : {{unsubscribe_link}}`,
    variables: ['contact_name', 'sender_name', 'project_name', 'unsubscribe_link']
  },
  {
    id: 'thank_you',
    name: 'Remerciement',
    subject: 'Merci pour votre confiance - {{contact_name}}',
    category: 'commercial',
    isActive: true,
    body: `Bonjour {{contact_name}},

Merci d'avoir choisi Black Road Music pour votre projet "{{project_name}}".

Nous sommes ravis de travailler avec vous et nous engageons à vous livrer un résultat exceptionnel.

Voici les prochaines étapes :
1. Envoi des stems et références
2. Début de la production
3. Livraison des premières versions

Je vous recontacterai très prochainement pour organiser le démarrage.

Cordialement,
{{sender_name}}
Black Road Music

---
Si vous ne souhaitez plus recevoir nos emails, cliquez ici : {{unsubscribe_link}}`,
    variables: ['contact_name', 'sender_name', 'project_name', 'unsubscribe_link']
  }
];

export const getTemplate = (templateId: string): EmailTemplate | undefined => {
  return emailTemplates.find(template => template.id === templateId && template.isActive);
};

export const getTemplatesByCategory = (category: string): EmailTemplate[] => {
  return emailTemplates.filter(template => template.category === category && template.isActive);
};

export const compileTemplate = (template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } => {
  let compiledSubject = template.subject;
  let compiledBody = template.body;
  
  // Remplacer les variables dans le sujet et le corps
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiledSubject = compiledSubject.replace(regex, value);
    compiledBody = compiledBody.replace(regex, value);
  });
  
  return {
    subject: compiledSubject,
    body: compiledBody
  };
};

// Fonction pour générer le lien de désabonnement
export const generateUnsubscribeLink = (prospectId: string, campaignId?: string): string => {
  const baseUrl = import.meta.env.VITE_APP_URL || 'https://blackroadmusic.com';
  const params = new URLSearchParams({
    prospect: prospectId,
    ...(campaignId && { campaign: campaignId })
  });
  return `${baseUrl}/unsubscribe?${params.toString()}`;
};