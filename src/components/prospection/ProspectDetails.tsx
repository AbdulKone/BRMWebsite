import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProspectionStore } from '../../stores/prospectionStore';
import { supabase } from '../../lib/supabase';
import { emailSequences, startEmailSequence, stopEmailSequence } from '../../data/emailSequences';
import { 
  Mail, Phone, Building, User, Calendar, MessageSquare, History, X, 
  AlertTriangle, Play, Square, Target, BarChart3 
} from 'lucide-react';

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
  opened_at?: string;
  responded_at?: string;
  sequence_id?: string;
  step_id?: string;
}

interface ProspectMetrics {
  leadScore: number;
  conversionProbability: number;
  daysSinceLastContact: number;
  emailsSent: number;
  emailsOpened: number;
  responseRate: number;
  churnRisk: number;
}

type StatusType = "new" | "contacted" | "interested" | "qualified" | "proposal_sent" | "negotiation" | "closed_won" | "closed_lost";

// Constantes pour éviter la redéfinition
const STATUS_CONFIG = {
  new: { color: 'bg-blue-500', label: 'Nouveau' },
  contacted: { color: 'bg-yellow-500', label: 'Contacté' },
  interested: { color: 'bg-green-500', label: 'Intéressé' },
  qualified: { color: 'bg-emerald-500', label: 'Qualifié' },
  proposal_sent: { color: 'bg-purple-500', label: 'Proposition envoyée' },
  negotiation: { color: 'bg-orange-500', label: 'En négociation' },
  closed_won: { color: 'bg-green-600', label: 'Gagné' },
  closed_lost: { color: 'bg-red-500', label: 'Perdu' },
  nurturing: { color: 'bg-indigo-500', label: 'En nurturing' }
} as const;

const EMAIL_STATUS_COLORS = {
  sent: 'text-blue-400',
  delivered: 'text-green-400',
  opened: 'text-purple-400',
  clicked: 'text-yellow-400',
  bounced: 'text-red-400',
  complained: 'text-red-600'
} as const;

const ProspectDetails = ({ prospectId, onClose, onEdit }: ProspectDetailsProps) => {
  const { prospects, saveProspect, calculateDetailedLeadScore, enrichProspectData } = useProspectionStore();
  const [emailHistory, setEmailHistory] = useState<EmailTracking[]>([]);
  const [prospectMetrics, setProspectMetrics] = useState<ProspectMetrics | null>(null);
  const [activeSequences, setActiveSequences] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState('');
  const [isStartingSequence, setIsStartingSequence] = useState(false);
  
  const prospect = prospects.find(p => p.id === prospectId);

  // Fonctions utilitaires mémorisées
  const getContactName = useCallback((prospect: any) => {
    if (prospect.first_name && prospect.last_name) {
      return `${prospect.first_name} ${prospect.last_name}`;
    }
    return prospect.contact_name || 'Contact non défini';
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { color: 'bg-gray-500', label: status };
  }, []);

  const getEmailStatusColor = useCallback((status: string) => {
    return EMAIL_STATUS_COLORS[status as keyof typeof EMAIL_STATUS_COLORS] || 'text-gray-400';
  }, []);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  }, []);

  const getRiskColor = useCallback((risk: number) => {
    if (risk >= 70) return 'text-red-400';
    if (risk >= 40) return 'text-yellow-400';
    return 'text-green-400';
  }, []);

  const loadEmailHistory = useCallback(async () => {
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
  }, [prospectId]);

  const calculateMetrics = useCallback(async (emailData: EmailTracking[]) => {
    const emailsSent = emailData.length;
    const emailsOpened = emailData.filter(e => e.opened_at).length;
    const emailsResponded = emailData.filter(e => e.responded_at).length;
    
    const responseRate = emailsSent > 0 ? (emailsResponded / emailsSent) * 100 : 0;
    const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
    
    const lastContact = prospect?.last_contact_date ? new Date(prospect.last_contact_date) : new Date();
    const daysSinceLastContact = Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calcul du score de lead
    const leadScoreObj = await calculateDetailedLeadScore(prospectId);
    const leadScore = typeof leadScoreObj === 'number' ? leadScoreObj : leadScoreObj.total;
    
    // Calcul optimisé de la probabilité de conversion
    let conversionProbability = 0;
    const statusBonus = {
      interested: 40,
      contacted: 20,
      qualified: 60,
      proposal_sent: 70,
      negotiation: 80
    };
    
    conversionProbability += statusBonus[prospect?.status as keyof typeof statusBonus] || 0;
    if (responseRate > 50) conversionProbability += 30;
    if (openRate > 70) conversionProbability += 20;
    if (daysSinceLastContact < 7) conversionProbability += 10;
    
    // Calcul optimisé du risque de churn
    let churnRisk = 0;
    if (daysSinceLastContact > 60) churnRisk += 70;
    else if (daysSinceLastContact > 30) churnRisk += 40;
    if (responseRate === 0 && emailsSent > 2) churnRisk += 30;
    
    return {
      leadScore,
      conversionProbability: Math.min(conversionProbability, 100),
      daysSinceLastContact,
      emailsSent,
      emailsOpened,
      responseRate,
      churnRisk: Math.min(churnRisk, 100)
    };
  }, [prospect, prospectId, calculateDetailedLeadScore]);

  const loadProspectMetrics = useCallback(async () => {
    try {
      const emails = await supabase
        .from('email_tracking')
        .select('*')
        .eq('prospect_id', prospectId);

      if (emails.data) {
        const metrics = await calculateMetrics(emails.data);
        setProspectMetrics(metrics);
      }
    } catch (error) {
      console.error('Erreur lors du calcul des métriques:', error);
    }
  }, [prospectId, calculateMetrics]);

  const loadActiveSequences = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('sequence_id')
        .eq('prospect_id', prospectId)
        .eq('status', 'pending');

      if (error) throw error;
      const sequences = [...new Set(data?.map(d => d.sequence_id) || [])];
      setActiveSequences(sequences);
    } catch (error) {
      console.error('Erreur lors du chargement des séquences actives:', error);
    }
  }, [prospectId]);

  const enrichProspectIfNeeded = useCallback(async () => {
    if (prospect && !prospect.enriched_data) {
      try {
        await enrichProspectData(prospectId);
      } catch (error) {
        console.error('Erreur lors de l\'enrichissement:', error);
      }
    }
  }, [prospect, prospectId, enrichProspectData]);

  const handleStatusChange = useCallback(async (status: string) => {
    try {
      await saveProspect({ 
        id: prospectId,
        status: status as StatusType,
        last_contact_date: new Date().toISOString()
      });
      loadProspectMetrics();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  }, [prospectId, saveProspect, loadProspectMetrics]);

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return;
    
    setIsAddingNote(true);
    try {
      const currentNotes = prospect?.notes || '';
      const timestamp = new Date().toLocaleString('fr-FR');
      const updatedNotes = currentNotes 
        ? `${currentNotes}\n\n[${timestamp}] ${newNote}`
        : `[${timestamp}] ${newNote}`;
      
      await saveProspect({ 
        id: prospectId,
        notes: updatedNotes,
        last_contact_date: new Date().toISOString()
      });
      setNewNote('');
      loadProspectMetrics();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
    } finally {
      setIsAddingNote(false);
    }
  }, [newNote, prospect?.notes, prospectId, saveProspect, loadProspectMetrics]);

  const handleStartSequence = useCallback(async () => {
    if (!selectedSequence) return;
    
    setIsStartingSequence(true);
    try {
      await startEmailSequence(prospectId, selectedSequence);
      await loadActiveSequences();
      setSelectedSequence('');
    } catch (error) {
      console.error('Erreur lors du démarrage de la séquence:', error);
    } finally {
      setIsStartingSequence(false);
    }
  }, [selectedSequence, prospectId, loadActiveSequences]);

  const handleStopSequence = useCallback(async (sequenceId: string) => {
    try {
      await stopEmailSequence(prospectId, sequenceId);
      await loadActiveSequences();
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la séquence:', error);
    }
  }, [prospectId, loadActiveSequences]);

  // Mémorisation des séquences disponibles
  const availableSequences = useMemo(() => {
    return emailSequences.filter(seq => !activeSequences.includes(seq.id));
  }, [activeSequences]);

  // Mémorisation du statut du prospect
  const statusConfig = useMemo(() => {
    return getStatusConfig(prospect?.status || 'new');
  }, [prospect?.status, getStatusConfig]);

  useEffect(() => {
    if (prospectId) {
      Promise.all([
        loadEmailHistory(),
        loadProspectMetrics(),
        loadActiveSequences(),
        enrichProspectIfNeeded()
      ]);
    }
  }, [prospectId, loadEmailHistory, loadProspectMetrics, loadActiveSequences, enrichProspectIfNeeded]);

  if (!prospect) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto text-white">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-white">{prospect.company_name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            {prospectMetrics && prospectMetrics.churnRisk > 70 && (
              <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Risque élevé</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors text-white"
            >
              Modifier
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-gray-700 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations du prospect */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-3 text-white">Informations</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <span className="text-gray-200">{prospect.company_name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-200">{getContactName(prospect)}</span>
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
                <span className="text-gray-200">
                  Dernier contact: {prospect.last_contact_date 
                    ? format(new Date(prospect.last_contact_date), 'PPP à HH:mm', { locale: fr })
                    : 'Aucun contact enregistré'
                  }
                </span>
              </div>
            </div>

            {/* Métriques du prospect */}
            {prospectMetrics && (
              <div className="bg-gray-800 p-4 rounded border border-gray-700">
                <div className="flex items-center space-x-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <h4 className="font-semibold text-white">Métriques</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Score Lead:</span>
                    <span className={`ml-2 font-medium ${getScoreColor(prospectMetrics.leadScore)}`}>
                      {prospectMetrics.leadScore}/100
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Conversion:</span>
                    <span className={`ml-2 font-medium ${getScoreColor(prospectMetrics.conversionProbability)}`}>
                      {prospectMetrics.conversionProbability}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Emails envoyés:</span>
                    <span className="ml-2 font-medium text-blue-400">
                      {prospectMetrics.emailsSent}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Taux réponse:</span>
                    <span className={`ml-2 font-medium ${getScoreColor(prospectMetrics.responseRate)}`}>
                      {prospectMetrics.responseRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Risque churn:</span>
                    <span className={`ml-2 font-medium ${getRiskColor(prospectMetrics.churnRisk)}`}>
                      {prospectMetrics.churnRisk}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Jours silence:</span>
                    <span className={`ml-2 font-medium ${
                      prospectMetrics.daysSinceLastContact > 30 ? 'text-red-400' : 
                      prospectMetrics.daysSinceLastContact > 14 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {prospectMetrics.daysSinceLastContact}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Changement de statut */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">Statut</label>
              <select
                value={prospect.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-white"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Séquences d'emails */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Séquences d'emails</h3>
            </div>
            
            {/* Séquences actives */}
            {activeSequences.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-green-400">Séquences actives</h4>
                {activeSequences.map(sequenceId => {
                  const sequence = emailSequences.find(s => s.id === sequenceId);
                  return (
                    <div key={sequenceId} className="bg-green-900/20 border border-green-700 p-3 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{sequence?.name || sequenceId}</span>
                        <button
                          onClick={() => handleStopSequence(sequenceId)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Arrêter la séquence"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{sequence?.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Démarrer une nouvelle séquence */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Démarrer une séquence</h4>
              <select
                value={selectedSequence}
                onChange={(e) => setSelectedSequence(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm text-white"
              >
                <option value="">Sélectionner une séquence...</option>
                {availableSequences.map(sequence => (
                  <option key={sequence.id} value={sequence.id}>
                    {sequence.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStartSequence}
                disabled={!selectedSequence || isStartingSequence}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-white"
              >
                <Play className="w-4 h-4" />
                <span>{isStartingSequence ? 'Démarrage...' : 'Démarrer la séquence'}</span>
              </button>
            </div>
          </div>

          {/* Historique des emails */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Historique des emails ({emailHistory.length})</h3>
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
                      <h4 className="font-medium text-sm text-white">{email.subject}</h4>
                      <div className="flex items-center space-x-2">
                        {email.sequence_id && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Séquence
                          </span>
                        )}
                        <span className={`text-xs font-medium ${getEmailStatusColor(email.status)}`}>
                          {email.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      {format(new Date(email.sent_at), 'PPP à HH:mm', { locale: fr })}
                    </p>
                    {email.opened_at && (
                      <p className="text-xs text-purple-400 mt-1">
                        Ouvert le {format(new Date(email.opened_at), 'PPP à HH:mm', { locale: fr })}
                      </p>
                    )}
                    {email.responded_at && (
                      <p className="text-xs text-green-400 mt-1">
                        Répondu le {format(new Date(email.responded_at), 'PPP à HH:mm', { locale: fr })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section Notes */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Notes</h3>
          </div>
          
          {/* Ajouter une note */}
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ajouter une note..."
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none text-white resize-none"
              rows={3}
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isAddingNote}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              {isAddingNote ? 'Ajout...' : 'Ajouter la note'}
            </button>
          </div>
          
          {/* Affichage des notes existantes */}
          {prospect.notes && (
            <div className="bg-gray-800 p-4 rounded border border-gray-700">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans">
                {prospect.notes}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProspectDetails;