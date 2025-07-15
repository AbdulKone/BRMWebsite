import { useState } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import { emailTemplates, getTemplate, compileTemplate } from '../../data/emailTemplates';

const EmailCampaign = () => {
  const { prospects } = useProspectionStore();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);
  const [previewEmail, setPreviewEmail] = useState<string | null>(null);

  const handlePreview = () => {
    const template = getTemplate(selectedTemplate);
    if (!template) return;

    const prospect = prospects.find(p => p.id === selectedProspects[0]);
    if (!prospect) return;

    const compiledEmail = compileTemplate(template, {
      contact_name: prospect.contact_name,
      sender_name: 'Votre Nom' // À remplacer par le nom de l'utilisateur connecté
    });

    setPreviewEmail(compiledEmail);
  };

  const handleSend = async () => {
    // Implémenter l'envoi d'emails ici
    console.log('Envoi des emails...');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campagne Email</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-2 rounded bg-gray-800"
          >
            <option value="">Sélectionner un template</option>
            {emailTemplates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Prospects</label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {prospects.map(prospect => (
              <label key={prospect.id} className="flex items-center space-x-2">
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
                  className="rounded bg-gray-800"
                />
                <span>{prospect.company_name} ({prospect.contact_name})</span>
              </label>
            ))}
          </div>
        </div>

        {previewEmail && (
          <div className="space-y-2">
            <h3 className="font-medium">Aperçu</h3>
            <div className="bg-gray-800 p-4 rounded whitespace-pre-wrap">
              {previewEmail}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={handlePreview}
            disabled={!selectedTemplate || selectedProspects.length === 0}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            Aperçu
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedTemplate || selectedProspects.length === 0}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailCampaign;