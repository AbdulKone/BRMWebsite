import { useState, useEffect } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import { supabase } from '../../lib/supabase';
import { EmailTemplate } from '../../data/types/emailTypes';

// Fonction pour obtenir le nom de contact
const getContactName = (prospect: any) => {
  const fullName = `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim();
  return fullName || prospect.company_name;
};

// Fonction pour compiler un template avec les variables
const compileTemplate = (template: EmailTemplate, variables: Record<string, string>): { subject: string; content: string } => {
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

// Fonction pour envoyer via Vercel + SES
const sendEmailViaVercel = async ({
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
    
    if (result.success) {
      // Enregistrer le tracking dans Supabase
      await supabase.from('email_tracking').insert({
        prospect_id: prospectId,
        template_id: templateId,
        campaign_id: campaignId,
        email_status: 'sent',
        sent_at: new Date().toISOString(),
        subject: subject,
        message_id: result.messageId
      });

      // Mettre à jour le prospect
      await supabase.from('prospects')
        .update({ 
          last_email_sent: new Date().toISOString(),
          status: 'contacted'
        })
        .eq('id', prospectId);
    }
    
    return result;
  } catch (error) {
    console.error('Erreur envoi email via Vercel:', error);
    return { success: false, error };
  }
};

const EmailCampaign = () => {
  const { prospects } = useProspectionStore();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [previewEmail, setPreviewEmail] = useState<{ subject: string; body: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendResults, setSendResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  // Charger les templates depuis la base de données
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .order('name');

        if (error) {
          console.error('Erreur lors du chargement des templates:', error);
          return;
        }

        setTemplates(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const getTemplate = (templateKey: string): EmailTemplate | undefined => {
    return templates.find(t => t.template_key === templateKey && t.is_active);
  };

  const handlePreview = () => {
    const template = getTemplate(selectedTemplate);
    if (!template) return;

    const prospect = prospects.find(p => p.id === selectedProspects[0]);
    if (!prospect) return;

    const unsubscribeLink = generateUnsubscribeLink(prospect.id);
    const compiledEmail = compileTemplate(template, {
      contact_name: getContactName(prospect),
      sender_name: 'Black Road Music',
      company_name: prospect.company_name || '',
      project_name: 'Votre Projet',
      unsubscribe_link: unsubscribeLink
    });

    setPreviewEmail({
      subject: compiledEmail.subject,
      body: compiledEmail.content
    });
  };

  const handleSend = async () => {
    const template = getTemplate(selectedTemplate);
    if (!template) return;

    setSending(true);
    setSendResults({ success: 0, failed: 0 });
    
    const campaignId = `campaign_${Date.now()}`;

    try {
      for (const prospectId of selectedProspects) {
        const prospect = prospects.find(p => p.id === prospectId);
        if (!prospect) continue;

        try {
          // Validation de l'email
          if (!prospect.email || !prospect.email.includes('@')) {
            console.error('Email invalide pour:', getContactName(prospect));
            setSendResults(prev => ({ ...prev, failed: prev.failed + 1 }));
            continue;
          }

          const unsubscribeLink = generateUnsubscribeLink(prospect.id);
          const compiledEmail = compileTemplate(template, {
            contact_name: getContactName(prospect),
            sender_name: 'Black Road Music',
            company_name: prospect.company_name || '',
            project_name: 'Votre Projet',
            unsubscribe_link: unsubscribeLink
          });

          // Envoi via Vercel + SES
          const result = await sendEmailViaVercel({
            to: prospect.email,
            subject: compiledEmail.subject,
            body: compiledEmail.content,
            templateId: template.template_key,
            prospectId: prospect.id,
            campaignId
          });

          if (result.success) {
            setSendResults(prev => ({ ...prev, success: prev.success + 1 }));
          } else {
            console.error('Échec envoi email pour:', getContactName(prospect), result.error);
            setSendResults(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
        } catch (error) {
          console.error('Erreur envoi email pour:', getContactName(prospect), error);
          setSendResults(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }
    } finally {
      setSending(false);
    }
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
          {prospects.filter(p => p.status === 'new' || p.status === 'contacted' || p.status === 'interested').map(prospect => (
            <label key={prospect.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedProspects.includes(prospect.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProspects([...selectedProspects, prospect.id]);
                  } else {
                    setSelectedProspects(selectedProspects.filter(id => id !== prospect.id));
                  }
                }}
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
            <div className="whitespace-pre-wrap text-sm text-black">{previewEmail.body}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaign;