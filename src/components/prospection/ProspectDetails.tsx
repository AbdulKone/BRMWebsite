import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProspectionStore } from '../../stores/prospectionStore';
import { Mail, Phone, Building, User, Calendar, MessageSquare } from 'lucide-react';

interface ProspectDetailsProps {
  prospectId: string;
  onClose: () => void;
}

const ProspectDetails = ({ prospectId, onClose }: ProspectDetailsProps) => {
  const { prospects, updateProspect } = useProspectionStore();
  const prospect = prospects.find(p => p.id === prospectId);

  if (!prospect) return null;

  const handleStatusChange = async (status: string) => {
    await updateProspect(prospectId, { status });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold">{prospect.company_name}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded hover:bg-gray-700"
        >
          ×
        </button>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Building className="w-5 h-5" />
          <span>{prospect.company_name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>{prospect.contact_name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <a href={`mailto:${prospect.email}`} className="text-blue-400 hover:underline">
            {prospect.email}
          </a>
        </div>
        {prospect.phone && (
          <div className="flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <a href={`tel:${prospect.phone}`} className="text-blue-400 hover:underline">
              {prospect.phone}
            </a>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>
            Dernier contact: {format(new Date(prospect.last_contact), 'PPP', { locale: fr })}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Statut</label>
        <select
          value={prospect.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="w-full p-2 rounded bg-gray-800"
        >
          <option value="new">Nouveau</option>
          <option value="contacted">Contacté</option>
          <option value="interested">Intéressé</option>
          <option value="not_interested">Pas intéressé</option>
        </select>
      </div>

      {prospect.notes && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-medium">Notes</h3>
          </div>
          <p className="whitespace-pre-wrap bg-gray-800 p-4 rounded">
            {prospect.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProspectDetails;