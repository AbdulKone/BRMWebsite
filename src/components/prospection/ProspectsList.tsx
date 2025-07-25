import { useState, useMemo, useCallback } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import { Search, Filter, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProspectsListProps {
  onViewDetails?: (prospectId: string) => void;
  onEditProspect?: (prospectId: string) => void;
  onAddProspect?: () => void;
}

type StatusType = 'all' | 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost';

// Constantes pour éviter la duplication
const STATUS_CONFIG = {
  new: { label: 'Nouveau', color: 'bg-blue-500' },
  contacted: { label: 'Contacté', color: 'bg-yellow-500' },
  interested: { label: 'Intéressé', color: 'bg-green-500' },
  qualified: { label: 'Qualifié', color: 'bg-purple-500' },
  proposal_sent: { label: 'Proposition envoyée', color: 'bg-orange-500' },
  negotiation: { label: 'Négociation', color: 'bg-red-500' },
  closed_won: { label: 'Gagné', color: 'bg-emerald-500' },
  closed_lost: { label: 'Perdu', color: 'bg-gray-500' }
} as const;

const ProspectsList = ({ onViewDetails, onEditProspect, onAddProspect }: ProspectsListProps) => {
  const { prospects, loading, error, deleteProspect } = useProspectionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handler optimisé pour la suppression
  const handleDelete = useCallback(async (prospectId: string, companyName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${companyName} ?`)) {
      try {
        await deleteProspect(prospectId);
        const newTotalPages = Math.ceil((prospects.length - 1) / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du prospect');
      }
    }
  }, [deleteProspect, prospects.length, itemsPerPage, currentPage]);

  // Filtrage optimisé
  const filteredProspects = useMemo(() => {
    return prospects.filter(prospect => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim();
      const matchesSearch = !searchTerm || (
        prospect.company_name.toLowerCase().includes(searchLower) ||
        fullName.toLowerCase().includes(searchLower) ||
        prospect.email.toLowerCase().includes(searchLower)
      );
      
      const matchesStatus = statusFilter === 'all' || prospect.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [prospects, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);
  const paginatedProspects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProspects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProspects, currentPage, itemsPerPage]);

  // Reset page when filters change
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: StatusType) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  // Fonctions utilitaires simplifiées
  const getStatusConfig = useCallback((status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { label: status, color: 'bg-gray-500' };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
        <p className="font-medium">Erreur</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Gestion des Prospects</h2>
          <p className="text-gray-400">Gérez et suivez vos prospects efficacement</p>
        </div>
        
        <button
          onClick={onAddProspect}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Prospect</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou entreprise..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as StatusType)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200"
            >
              <option value="all">Tous les statuts</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Statistiques */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className="text-gray-400">Total: <span className="text-white font-semibold">{filteredProspects.length}</span></span>
            <span className="text-gray-400">Page: <span className="text-white font-semibold">{currentPage}/{totalPages}</span></span>
          </div>
        </div>
      </div>

      {/* Liste des prospects */}
      <div className="grid gap-3 sm:gap-4">
        {paginatedProspects.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            <p className="text-sm sm:text-base">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun prospect ne correspond aux critères de recherche.'
                : 'Aucun prospect trouvé. Commencez par en ajouter un !'}
            </p>
          </div>
        ) : (
          paginatedProspects.map(prospect => {
            const fullName = `${prospect.first_name || ''} ${prospect.last_name || ''}`.trim();
            const statusConfig = getStatusConfig(prospect.status);
            
            return (
              <div key={prospect.id} className="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold truncate">{prospect.company_name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {fullName && (
                        <p className="text-gray-300 text-sm sm:text-base">{fullName}</p>
                      )}
                      <p className="text-gray-400 text-sm">{prospect.email}</p>
                      {prospect.position && (
                        <p className="text-gray-500 text-sm">{prospect.position}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewDetails?.(prospect.id)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditProspect?.(prospect.id)}
                      className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prospect.id, prospect.company_name)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredProspects.length)} sur {filteredProspects.length} prospects
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-1 text-sm text-gray-300">
              Page {currentPage} sur {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectsList;