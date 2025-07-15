import { useState } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import { emailTemplates, getTemplate, compileTemplate, generateUnsubscribeLink } from '../../data/emailTemplates';
import { supabase } from '../../lib/supabase';

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

// Fonction de test temporaire
const sendEmailTest = async (emailData: any) => {
  console.log('Test envoi email:', emailData);
  
  // Simuler un succès pour tester l'interface
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Enregistrer dans Supabase pour le tracking
  await supabase.from('email_tracking').insert({
    prospect_id: emailData.prospectId,
    template_id: emailData.templateId,
    campaign_id: emailData.campaignId,
    email_status: 'sent',
    sent_at: new Date().toISOString(),
    subject: emailData.subject,
    message_id: 'test-' + Date.now()
  });
  
  return { success: true, messageId: 'test-' + Date.now() };
};

// Dans handleSend, remplacez temporairement :
// const result = await sendEmailViaVercel({
// par :
// const result = await sendEmailTest({
const EmailCampaign = () => {
  const { prospects } = useProspectionStore();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [previewEmail, setPreviewEmail] = useState<{ subject: string; body: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const handlePreview = () => {
    const template = getTemplate(selectedTemplate);
    if (!template) return;

    const prospect = prospects.find(p => p.id === selectedProspects[0]);
    if (!prospect) return;

    const unsubscribeLink = generateUnsubscribeLink(prospect.id);
    const compiledEmail = compileTemplate(template, {
      contact_name: prospect.contact_name,
      sender_name: 'Black Road Music',
      company_name: prospect.company_name || '',
      project_name: 'Votre Projet',
      unsubscribe_link: unsubscribeLink
    });

    setPreviewEmail(compiledEmail);
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
            console.error('Email invalide pour:', prospect.contact_name);
            setSendResults(prev => ({ ...prev, failed: prev.failed + 1 }));
            continue;
          }

          const unsubscribeLink = generateUnsubscribeLink(prospect.id, campaignId);
          const compiledEmail = compileTemplate(template, {
            contact_name: prospect.contact_name,
            sender_name: 'Black Road Music',
            company_name: prospect.company_name || '',
            project_name: 'Votre Projet',
            unsubscribe_link: unsubscribeLink
          });

          // Envoi via Vercel + SES
          const result = await sendEmailViaVercel({
            to: prospect.email,
            subject: compiledEmail.subject,
            body: compiledEmail.body,
            templateId: template.id,
            prospectId: prospect.id,
            campaignId
          });

          if (result.success) {
            setSendResults(prev => ({ ...prev, success: prev.success + 1 }));
          } else {
            console.error('Échec envoi email pour:', prospect.contact_name, result.error);
            setSendResults(prev => ({ ...prev, failed: prev.failed + 1 }));
          }
        } catch (error) {
          console.error('Erreur envoi email pour:', prospect.contact_name, error);
          setSendResults(prev => ({ ...prev, failed: prev.failed + 1 }));
        }
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Campagne Email</h2>
      
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un template
        </label>
        <select 
          value={selectedTemplate} 
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Choisir un template...</option>
          {emailTemplates.filter(t => t.isActive).map(template => (
            <option key={template.id} value={template.id}>
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
          {prospects.filter(p => p.status === 'new' || p.status === 'contacted' || p.status === 'interested' || p.status === 'not_interested').map(prospect => (
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
                <div className="font-medium">{prospect.contact_name}</div>
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
            <div className="whitespace-pre-wrap text-sm">{previewEmail.body}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaign;


// Fonction de test temporaire - remplacez la ligne 72
const testAWSConnection = async () => {
  try {
    console.log('🧪 Test de connexion AWS SES...');
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'blackroadmusic@hotmail.com', // Utilisez votre email vérifié
        subject: 'Test AWS SES - ' + new Date().toLocaleString(),
        body: '<h1>Test de connexion</h1><p>Si vous recevez cet email, AWS SES fonctionne correctement !</p>',
        templateId: 'test',
        prospectId: 'test-prospect',
        campaignId: 'test-campaign'
      })
    });
    
    const responseText = await response.text();
    console.log('📋 Réponse brute:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Test réussi:', result);
      alert(`✅ Test AWS SES réussi !\nMessage ID: ${result.messageId}`);
    } else {
      console.error('Erreur HTTP:', response.status, responseText);
      alert(`Erreur ${response.status}: ${responseText}`);
    }
  } catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ Erreur réseau:', error);
  alert(`❌ Erreur réseau: ${errorMessage}`);
}
};

// Ajoutez ce bouton temporairement dans votre interface
// <button 
//   onClick={testAWSConnection}
//   className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
// >
//   🧪 Tester AWS SES
// </button>