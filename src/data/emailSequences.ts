import { supabase } from '../lib/supabase';
import { getTemplate, compileTemplate } from './emailTemplates';
// Import des fonctions nécessaires
import { generateBookingLink, generateUnsubscribeLink } from './emailTemplates';
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
        templateId: 'visual_project_intro',
        delayDays: 0,
        condition: 'always',
        priority: 'high'
      },
      {
        id: 'step_2',
        templateId: 'portfolio_showcase',
        delayDays: 3,
        condition: 'no_response',
        priority: 'medium'
      },
      {
        id: 'step_3',
        templateId: 'follow_up_visual',
        delayDays: 7,
        condition: 'no_response',
        priority: 'medium'
      },
      {
        id: 'step_4',
        templateId: 'newsletter_trends',
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
        templateId: 'commercial_proposal',
        delayDays: 0,
        condition: 'always',
        priority: 'high'
      },
      {
        id: 'step_2',
        templateId: 'follow_up_visual',
        delayDays: 5,
        condition: 'no_response',
        priority: 'high'
      },
      {
        id: 'step_3',
        templateId: 'portfolio_showcase',
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

// Fonctions utilitaires
export const startEmailSequence = async (
  prospectId: string,
  sequenceId: string
): Promise<void> => {
  const sequence = emailSequences.find(s => s.id === sequenceId);
  if (!sequence) throw new Error('Séquence introuvable');

  const now = new Date();
  const scheduledEmails: Omit<ScheduledEmail, 'id'>[] = sequence.steps.map(step => {
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + step.delayDays);
    
    return {
      prospectId,
      sequenceId,
      stepId: step.id,
      templateId: step.templateId,
      scheduledFor: scheduledDate.toISOString(),
      status: 'pending',
      createdAt: now.toISOString()
    };
  });

  // Sauvegarder en base de données
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
  const now = new Date().toISOString();
  
  const { data: scheduledEmails, error } = await supabase
    .from('scheduled_emails')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduledFor', now)
    .order('scheduledFor', { ascending: true });

  if (error) throw error;

  for (const email of scheduledEmails || []) {
    try {
      await sendScheduledEmail(email);
    } catch (error) {
      console.error(`Erreur envoi email ${email.id}:`, error);
      await supabase
        .from('scheduled_emails')
        .update({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
        })
        .eq('id', email.id);
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

  // Récupérer le template
  const template = getTemplate(scheduledEmail.templateId);
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
  //   html: compiledEmail.body
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

