import { supabase } from '../lib/supabase';

// Interface pour les templates de la base de données
interface DatabaseEmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  priority: string;
  segment_targeting: string[];
  ab_test_variant: string;
  performance_metrics: {
    open_rate: number;
    click_rate: number;
    response_rate: number;
    conversion_rate: number;
    last_updated: string;
  };
}

// Fonction pour récupérer un template depuis la base de données
const getTemplate = async (templateKey: string): Promise<DatabaseEmailTemplate | null> => {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du template:', error);
    return null;
  }

  return data;
};

// Fonction pour compiler un template avec les variables
const compileTemplate = (template: DatabaseEmailTemplate, variables: Record<string, string>): { subject: string; content: string } => {
  let compiledSubject = template.subject;
  let compiledContent = template.content;

  // Remplacer les variables dans le sujet et le contenu
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    compiledSubject = compiledSubject.replace(regex, value);
    compiledContent = compiledContent.replace(regex, value);
  });

  return {
    subject: compiledSubject,
    content: compiledContent
  };
};

// Fonction pour générer le lien de désinscription
const generateUnsubscribeLink = (prospectId: string): string => {
  return `${window.location.origin}/unsubscribe?id=${prospectId}`;
};

// Fonction pour générer le lien de réservation
const generateBookingLink = (prospectId: string): string => {
  return `${window.location.origin}/booking?prospect=${prospectId}`;
};

export interface SequenceStep {
  id: string;
  templateId: string;
  delayDays: number;
  condition?: 'no_response' | 'not_opened' | 'not_clicked' | 'always';
  priority: 'high' | 'medium' | 'low';
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  targetSegment: string[];
  steps: SequenceStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Séquences prédéfinies
export const emailSequences: EmailSequence[] = [
  {
    id: 'new_prospect_sequence',
    name: 'Séquence Nouveau Prospect - Projets Visuels',
    description: 'Séquence d\'introduction pour nouveaux prospects dans l\'audiovisuel',
    targetSegment: ['visual_projects', 'advertising', 'film'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step_1',
        templateId: 'visual_intro_advertising',
        delayDays: 0,
        condition: 'always',
        priority: 'high'
      },
      {
        id: 'step_2',
        templateId: 'portfolio_presentation_demo',
        delayDays: 3,
        condition: 'no_response',
        priority: 'medium'
      },
      {
        id: 'step_3',
        templateId: 'advanced_follow_up_sequence_1',
        delayDays: 7,
        condition: 'no_response',
        priority: 'medium'
      },
      {
        id: 'step_4',
        templateId: 'advanced_follow_up_sequence_2',
        delayDays: 14,
        condition: 'no_response',
        priority: 'low'
      }
    ]
  },
  {
    id: 'interested_prospect_sequence',
    name: 'Séquence Prospect Intéressé',
    description: 'Séquence pour prospects ayant montré de l\'intérêt',
    targetSegment: ['interested', 'warm_lead'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step_1',
        templateId: 'detailed_commercial_proposal',
        delayDays: 0,
        condition: 'always',
        priority: 'high'
      },
      {
        id: 'step_2',
        templateId: 'advanced_follow_up_sequence_1',
        delayDays: 5,
        condition: 'no_response',
        priority: 'high'
      },
      {
        id: 'step_3',
        templateId: 'portfolio_presentation_demo',
        delayDays: 10,
        condition: 'no_response',
        priority: 'medium'
      }
    ]
  }
];

// Interface pour les emails programmés
export interface ScheduledEmail {
  id: string;
  prospectId: string;
  sequenceId: string;
  stepId: string;
  templateId: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  sentAt?: string;
  errorMessage?: string;
}

export const startEmailSequence = async (
  prospectId: string,
  sequenceId: string
): Promise<void> => {
  const sequence = emailSequences.find(s => s.id === sequenceId);
  if (!sequence) throw new Error('Séquence introuvable');

  const now = new Date();
  const scheduledEmails = sequence.steps.map(step => ({
    prospectId,
    sequenceId,
    stepId: step.id,
    templateId: step.templateId,
    scheduledFor: new Date(now.getTime() + step.delayDays * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending' as const,
    createdAt: now.toISOString()
  }));

  const { error } = await supabase
    .from('scheduled_emails')
    .insert(scheduledEmails);

  if (error) throw error;
};

export const scheduleSequenceEmails = async (
  prospectIds: string[],
  sequenceId: string
): Promise<void> => {
  for (const prospectId of prospectIds) {
    await startEmailSequence(prospectId, sequenceId);
  }
};

export const processScheduledEmails = async (): Promise<void> => {
  const { data: scheduledEmails, error } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduledFor', new Date().toISOString());

  if (error) throw error;

  for (const scheduledEmail of scheduledEmails || []) {
    try {
      await sendScheduledEmail(scheduledEmail);
    } catch (error) {
      console.error('Erreur envoi email programmé:', error);
      await supabase
        .from('scheduled_emails')
        .update({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
        })
        .eq('id', scheduledEmail.id);
    }
  }
};

const sendScheduledEmail = async (scheduledEmail: ScheduledEmail): Promise<void> => {
  // Récupérer les données du prospect
  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', scheduledEmail.prospectId)
    .single();

  if (prospectError) throw prospectError;

  // Récupérer le template depuis la base de données
  const template = await getTemplate(scheduledEmail.templateId);
  if (!template) throw new Error('Template introuvable');

  // Compiler le template avec les variables du prospect
  const variables = {
    contact_name: prospect.contact_name,
    company_name: prospect.company_name,
    sender_name: 'Black Road Music',
    sender_email: 'contact@blackroadmusic.com',
    sender_phone: '+33 1 23 45 67 89',
    portfolio_link: 'https://blackroadmusic.com/portfolio',
    booking_link: generateBookingLink(prospect.id),
    unsubscribe_link: generateUnsubscribeLink(prospect.id)
  };

  const compiledEmail = compileTemplate(template, variables);

  // Envoyer l'email (intégration avec votre service d'email)
  // await emailService.send({
  //   to: prospect.email,
  //   subject: compiledEmail.subject,
  //   html: compiledEmail.content
  // });

  // Marquer comme envoyé
  await supabase
    .from('scheduled_emails')
    .update({
      status: 'sent',
      sentAt: new Date().toISOString()
    })
    .eq('id', scheduledEmail.id);

  // Enregistrer dans l'historique
  await supabase
    .from('email_tracking')
    .insert({
      prospect_id: prospect.id,
      template_id: scheduledEmail.templateId,
      subject: compiledEmail.subject,
      sent_at: new Date().toISOString(),
      status: 'sent',
      sequence_id: scheduledEmail.sequenceId,
      step_id: scheduledEmail.stepId
    });
};

export const stopEmailSequence = async (
  prospectId: string,
  sequenceId: string
): Promise<void> => {
  await supabase
    .from('scheduled_emails')
    .update({ status: 'cancelled' })
    .eq('prospectId', prospectId)
    .eq('sequenceId', sequenceId)
    .eq('status', 'pending');
};

