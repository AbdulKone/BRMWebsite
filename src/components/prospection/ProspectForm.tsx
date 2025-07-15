import { useState } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';

interface ProspectFormProps {
  prospectId?: string;
  onClose: () => void;
}

const ProspectForm = ({ prospectId, onClose }: ProspectFormProps) => {
  const { addProspect, updateProspect, prospects } = useProspectionStore();
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (prospectId) {
        await updateProspect(prospectId, formData);
      } else {
        await addProspect({
          ...formData,
          status: 'new',
          last_contact: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Entreprise</label>
        <input
          type="text"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          className="w-full p-2 rounded bg-gray-800"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Contact</label>
        <input
          type="text"
          value={formData.contact_name}
          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
          className="w-full p-2 rounded bg-gray-800"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 rounded bg-gray-800"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Téléphone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-2 rounded bg-gray-800"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full p-2 rounded bg-gray-800"
          rows={4}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
        >
          {prospectId ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
};

export default ProspectForm;