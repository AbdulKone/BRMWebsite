import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProspectionStore } from '../../stores/prospectionStore';
import { supabase } from '../../lib/supabase';
import { Mail, Phone, Building, User, Calendar, MessageSquare, History, X } from 'lucide-react';

interface ProspectDetailsProps {
  prospectId: string;
  onClose: () => void;
  onEdit: () => void;
}

interface EmailTracking {
  id: string;
  template_id: string;
  subject: string;
  status: string;
  sent_at: string;
  updated_at: string;
}

const ProspectDetails = ({ prospectId, onClose, onEdit }: ProspectDetailsProps) => {
  const { prospects, updateProspect } = useProspectionStore();
  const [emailHistory, setEmailHistory] = useState<EmailTracking[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  const prospect = prospects.find(p => p.id === prospectId);

  useEffect(() => {
    if (prospectId) {
      loadEmailHistory();
    }
  }, [prospectId]);

  const loadEmailHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setEmailHistory(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateProspect(prospectId, { 
        status: status as "new" | "contacted" | "interested" | "not_interested",
        last_contact: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsAddingNote(true);
    try {
      const currentNotes = prospect?.notes || '';
      const timestamp = new Date().toLocaleString('fr-FR');
      const updatedNotes = currentNotes 
        ? `${currentNotes}\n\n[${timestamp}] ${newNote}`
        : `[${timestamp}] ${newNote}`;
      
      await updateProspect(prospectId, { 
        notes: updatedNotes,
        last_contact: new Date().toISOString()
      });
      setNewNote('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'interested': return 'bg-green-500';
      case 'not_interested': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'contacted': return 'Contacté';
      case 'interested': return 'Intéressé';
      case 'not_interested': return 'Pas intéressé';
      default: return status;
    }
  };

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-400';
      case 'delivered': return 'text-green-400';
      case 'opened': return 'text-purple-400';
      case 'clicked': return 'text-yellow-400';
      case 'bounced': return 'text-red-400';
      case 'complained': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  if (!prospect) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold">{prospect.company_name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(prospect.status)}`}>
              {getStatusLabel(prospect.status)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations du prospect */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-3">Informations</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <span>{prospect.company_name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <span>{prospect.contact_name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${prospect.email}`} className="text-blue-400 hover:underline">
                  {prospect.email}
                </a>
              </div>
              {prospect.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${prospect.phone}`} className="text-blue-400 hover:underline">
                    {prospect.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span>
                  Dernier contact: {format(new Date(prospect.last_contact), 'PPP à HH:mm', { locale: fr })}
                </span>
              </div>
            </div>

            {/* Changement de statut */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Statut</label>
              <select
                value={prospect.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="new">Nouveau</option>
                <option value="contacted">Contacté</option>
                <option value="interested">Intéressé</option>
                <option value="not_interested">Pas intéressé</option>
              </select>
            </div>
          </div>

          {/* Historique des emails */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold">Historique des emails ({emailHistory.length})</h3>
            </div>
            
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : emailHistory.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">Aucun email envoyé pour le moment.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {emailHistory.map(email => (
                  <div key={email.id} className="bg-gray-800 p-3 rounded border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{email.subject}</h4>
                      <span className={`text-xs font-medium ${getEmailStatusColor(email.status)}`}>
                        {email.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">
                      Envoyé le {format(new Date(email.sent_at), 'PPP à HH:mm', { locale: fr })}
                    </p>
                    {email.updated_at !== email.sent_at && (
                      <p className="text-gray-500 text-xs">
                        Mis à jour le {format(new Date(email.updated_at), 'PPP à HH:mm', { locale: fr })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold">Notes</h3>
          </div>
          
          {prospect.notes && (
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <pre className="whitespace-pre-wrap text-sm text-gray-300">{prospect.notes}</pre>
            </div>
          )}
          
          {/* Ajouter une note */}
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter une note..."
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isAddingNote}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingNote ? 'Ajout...' : 'Ajouter la note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectDetails;