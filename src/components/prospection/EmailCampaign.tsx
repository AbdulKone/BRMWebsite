import { useState, useEffect } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import { supabase } from '../../lib/supabase';
import { EmailTemplate } from '../../data/types/emailTypes';
import { useErrorStore, errorUtils } from '../../stores/errorStore';

// Types
interface SendResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

interface EmailVariables {
  contact_name: string;
  sender_name: string;
  company_name: string;
  project_name: string;
  unsubscribe_link: string;
}

interface CompiledEmail {
  subject: string;
  content: string;
}

// Utilitaires
const getContactName = (prospect: any): string => {
  const fullName = `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim();
  return fullName || prospect.company_name;
};

const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return email.includes('@') && email.includes('.');
};

const compileTemplate = (template: EmailTemplate, variables: EmailVariables): CompiledEmail => {
  let compiledSubject = template.subject;
  let compiledContent = template.content;

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

const generateUnsubscribeLink = (prospectId: string): string => {
  return `${window.location.origin}/unsubscribe?id=${prospectId}`;
};

const generateEmailVariables = (prospect: any): EmailVariables => ({
  contact_name: getContactName(prospect),
  sender_name: 'Black Road Music',
  company_name: prospect.company_name || '',
  project_name: 'Votre Projet',
  unsubscribe_link: generateUnsubscribeLink(prospect.id)
});

// Service d'envoi d'email
class EmailService {
  static async sendEmail({
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
  }): Promise<SendResult> {
    return await errorUtils.withErrorHandling(
      async () => {
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
        
        if (result.success) {
          // Enregistrer le tracking
          await this.saveEmailTracking({
            prospectId,
            templateId,
            campaignId,
            subject,
            messageId: result.messageId
          });

          // Mettre à jour le prospect
          await this.updateProspectStatus(prospectId);
        }
        
        return result;
      },
      `Erreur lors de l'envoi de l'email`
    ) || { success: false, error: 'Erreur inconnue' };
  }

  private static async saveEmailTracking({
    prospectId,
    templateId,
    campaignId,
    subject,
    messageId
  }: {
    prospectId: string;
    templateId: string;
    campaignId: string;
    subject: string;
    messageId: string;
  }): Promise<void> {
    await supabase.from('email_tracking').insert({
      prospect_id: prospectId,
      template_id: templateId,
      campaign_id: campaignId,
      email_status: 'sent',
      sent_at: new Date().toISOString(),
      subject: subject,
      message_id: messageId
    });
  }

  private static async updateProspectStatus(prospectId: string): Promise<void> {
    await supabase.from('prospects')
      .update({ 
        last_email_sent: new Date().toISOString(),
        status: 'contacted'
      })
      .eq('id', prospectId);
  }
}

// Hook personnalisé pour la gestion des templates
const useEmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    const result = await errorUtils.withErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .order('name');
  
        if (error) throw error;
        // Ensure is_active is properly typed as boolean
        return (data || []).map(template => ({
          ...template,
          is_active: Boolean(template.is_active)
        })) as EmailTemplate[];
      },
      'Erreur lors du chargement des templates'
    );
  
    if (result) {
      setTemplates(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const getTemplate = (templateKey: string): EmailTemplate | undefined => {
    return templates.find(t => t.template_key === templateKey && t.is_active);
  };

  return { templates, loading, getTemplate };
};

// Hook pour la gestion de l'envoi d'emails
const useEmailSender = () => {
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const { handleSuccess, handleError } = useErrorStore.getState();

  const sendEmailToProspect = async (
    prospect: any,
    template: EmailTemplate,
    campaignId: string
  ): Promise<boolean> => {
    if (!isValidEmail(prospect.email)) {
      handleError(
        new Error('Email invalide'),
        `Email invalide pour ${getContactName(prospect)}`
      );
      return false;
    }

    const variables = generateEmailVariables(prospect);
    const compiledEmail = compileTemplate(template, variables);

    const result = await EmailService.sendEmail({
      to: prospect.email,
      subject: compiledEmail.subject,
      body: compiledEmail.content,
      templateId: template.template_key,
      prospectId: prospect.id,
      campaignId
    });

    if (result.success) {
      handleSuccess(`Email envoyé avec succès à ${getContactName(prospect)}`);
      return true;
    } else {
      handleError(
        new Error(result.error || 'Erreur inconnue'),
        `Échec envoi email pour ${getContactName(prospect)}`
      );
      return false;
    }
  };

  const sendBulkEmails = async (
    prospects: any[],
    template: EmailTemplate
  ): Promise<void> => {
    setSending(true);
    setSendResults({ success: 0, failed: 0 });
    
    const campaignId = `campaign_${Date.now()}`;

    for (const prospect of prospects) {
      const success = await sendEmailToProspect(prospect, template, campaignId);
      
      setSendResults(prev => ({
        success: prev.success + (success ? 1 : 0),
        failed: prev.failed + (success ? 0 : 1)
      }));
    }

    setSending(false);
  };

  return {
    sending,
    sendResults,
    sendBulkEmails
  };
};

// Composant principal
const EmailCampaign = () => {
  const { prospects } = useProspectionStore();
  const { templates, loading, getTemplate } = useEmailTemplates();
  const { sending, sendResults, sendBulkEmails } = useEmailSender();
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [previewEmail, setPreviewEmail] = useState<CompiledEmail | null>(null);

  const availableProspects = prospects.filter(p => 
    p.status === 'new' || p.status === 'contacted' || p.status === 'interested'
  );

  const handlePreview = () => {
    const template = getTemplate(selectedTemplate);
    if (!template) return;

    const prospect = prospects.find(p => p.id === selectedProspects[0]);
    if (!prospect) return;

    const variables = generateEmailVariables(prospect);
    const compiledEmail = compileTemplate(template, variables);
    setPreviewEmail(compiledEmail);
  };

  const handleSend = async () => {
    const template = getTemplate(selectedTemplate);
    if (!template) return;

    const selectedProspectObjects = prospects.filter(p => 
      selectedProspects.includes(p.id)
    );

    await sendBulkEmails(selectedProspectObjects, template);
  };

  const toggleProspectSelection = (prospectId: string) => {
    setSelectedProspects(prev => 
      prev.includes(prospectId)
        ? prev.filter(id => id !== prospectId)
        : [...prev, prospectId]
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Campagne Email</h2>
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-500">Chargement des templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Campagne Email</h2>
      
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un template ({templates.length} disponibles)
        </label>
        <select 
          value={selectedTemplate} 
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Choisir un template...</option>
          {templates.map(template => (
            <option key={template.template_key} value={template.template_key}>
              {template.name} ({template.category})
            </option>
          ))}
        </select>
      </div>

      {/* Prospect Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner les prospects ({selectedProspects.length} sélectionnés)
        </label>
        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
          {availableProspects.map(prospect => (
            <label key={prospect.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProspects.includes(prospect.id)}
                onChange={() => toggleProspectSelection(prospect.id)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">{getContactName(prospect)}</div>
                <div className="text-sm text-gray-500">{prospect.email}</div>
                <div className="text-xs text-gray-400">{prospect.company_name}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={handlePreview}
          disabled={!selectedTemplate || selectedProspects.length === 0}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Aperçu
        </button>
        <button
          onClick={handleSend}
          disabled={!selectedTemplate || selectedProspects.length === 0 || sending}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Envoi en cours...' : `Envoyer (${selectedProspects.length})`}
        </button>
      </div>

      {/* Send Results */}
      {(sendResults.success > 0 || sendResults.failed > 0) && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Résultats de l'envoi :</h3>
          <div className="text-sm">
            <div className="text-green-600">✓ {sendResults.success} emails envoyés avec succès</div>
            {sendResults.failed > 0 && (
              <div className="text-red-600">✗ {sendResults.failed} emails en échec</div>
            )}
          </div>
        </div>
      )}

      {/* Email Preview */}
      {previewEmail && (
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="font-medium mb-2">Aperçu de l'email :</h3>
          <div className="bg-gray-50 p-4 rounded">
            <div className="mb-2">
              <strong>Sujet :</strong> {previewEmail.subject}
            </div>
            <div className="whitespace-pre-wrap text-sm text-black">{previewEmail.content}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaign;