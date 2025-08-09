import { supabase } from '../lib/supabase';
import { EmailTemplate } from './types/emailTypes';
import { useErrorStore } from '../stores/errorStore';

// Fonctions utilitaires
const generateUnsubscribeLink = (prospectId: string): string => 
  `${window.location.origin}/unsubscribe?id=${prospectId}`;

const generateBookingLink = (prospectId: string): string => 
  `${window.location.origin}/booking?prospect=${prospectId}`;

const getTemplate = async (templateKey: string): Promise<EmailTemplate | null> => {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single();

  if (error) {
    const { handleError } = useErrorStore.getState();
    handleError('Erreur lors de la récupération du template', error.message);
    return null;
  }
  return data;
};

const compileTemplate = (template: EmailTemplate, variables: Record<string, string>): { subject: string; content: string } => {
  let { subject, content } = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    content = content.replace(regex, value);
  });

  return { subject, content };
};

// Interfaces
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

// Séquences prédéfinies
export const emailSequences: EmailSequence[] = [
  {
    id: 'new_prospect_sequence',
    name: 'Séquence Nouveau Prospect - Projets Visuels',
    description: 'Séquence d\'introduction pour nouveaux prospects dans l\'audiovisuel',
    targetSegment: ['advertising', 'music', 'luxury', 'sports'], // Segments mis à jour
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      { id: 'step_1', templateId: 'visual_intro_advertising', delayDays: 0, condition: 'always', priority: 'high' },
      { id: 'step_2', templateId: 'portfolio_presentation_demo', delayDays: 3, condition: 'no_response', priority: 'medium' },
      { id: 'step_3', templateId: 'advanced_follow_up_sequence_1', delayDays: 7, condition: 'no_response', priority: 'medium' },
      { id: 'step_4', templateId: 'advanced_follow_up_sequence_2', delayDays: 14, condition: 'no_response', priority: 'low' }
    ]
  },
  {
    id: 'interested_prospect_sequence', 
    name: 'Séquence Prospect Intéressé',
    description: 'Séquence pour prospects ayant montré de l\'intérêt',
    targetSegment: ['advertising', 'music', 'luxury', 'sports'], // Segments mis à jour
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      { id: 'step_1', templateId: 'detailed_commercial_proposal', delayDays: 0, condition: 'always', priority: 'high' },
      { id: 'step_2', templateId: 'advanced_follow_up_sequence_1', delayDays: 5, condition: 'no_response', priority: 'high' },
      { id: 'step_3', templateId: 'portfolio_presentation_demo', delayDays: 10, condition: 'no_response', priority: 'medium' }
    ]
  }
];

// Fonctions principales
export const startEmailSequence = async (prospectId: string, sequenceId: string): Promise<void> => {
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

  const { error } = await supabase.from('scheduled_emails').insert(scheduledEmails);
  if (error) throw error;
};

export const scheduleSequenceEmails = async (prospectIds: string[], sequenceId: string): Promise<void> => {
  await Promise.all(prospectIds.map(prospectId => startEmailSequence(prospectId, sequenceId)));
};

export const processScheduledEmails = async (): Promise<void> => {
  const { data: scheduledEmails, error } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduledFor', new Date().toISOString());

  if (error) throw error;

  await Promise.allSettled(
    (scheduledEmails || []).map(async (scheduledEmail) => {
      try {
        await sendScheduledEmail(scheduledEmail);
      } catch (error) {
        const { handleError } = useErrorStore.getState();
        handleError('Erreur lors de l\'envoi d\'email programmé', error instanceof Error ? error.message : 'Erreur inconnue');
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
          })
          .eq('id', scheduledEmail.id);
      }
    })
  );
};

const sendScheduledEmail = async (scheduledEmail: ScheduledEmail): Promise<void> => {
  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', scheduledEmail.prospectId)
    .single();

  if (prospectError) throw prospectError;

  const template = await getTemplate(scheduledEmail.templateId);
  if (!template) throw new Error('Template introuvable');

  const variables = {
    contact_name: `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim() || prospect.company_name,
    company_name: prospect.company_name,
    sender_name: 'Black Road Music',
    sender_email: 'contact@blackroadmusic.com',
    sender_phone: '+33 1 23 45 67 89',
    portfolio_link: 'https://blackroadmusic.com/portfolio',
    booking_link: generateBookingLink(prospect.id),
    unsubscribe_link: generateUnsubscribeLink(prospect.id)
  };

  const compiledEmail = compileTemplate(template, variables);

  // TODO: Intégrer avec le service d'email
  // await emailService.send({
  //   to: prospect.email,
  //   subject: compiledEmail.subject,
  //   html: compiledEmail.content
  // });

  const now = new Date().toISOString();
  
  await Promise.all([
    supabase
      .from('scheduled_emails')
      .update({ status: 'sent', sentAt: now })
      .eq('id', scheduledEmail.id),
    supabase
      .from('email_tracking')
      .insert({
        prospect_id: prospect.id,
        template_id: scheduledEmail.templateId,
        subject: compiledEmail.subject,
        sent_at: now,
        status: 'sent',
        sequence_id: scheduledEmail.sequenceId,
        step_id: scheduledEmail.stepId
      })
  ]);
};

export const stopEmailSequence = async (prospectId: string, sequenceId: string): Promise<void> => {
  await supabase
    .from('scheduled_emails')
    .update({ status: 'cancelled' })
    .eq('prospectId', prospectId)
    .eq('sequenceId', sequenceId)
    .eq('status', 'pending');
};

