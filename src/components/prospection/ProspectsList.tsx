import { useState, useMemo, useCallback } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import { Search, Filter, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProspectsListProps {
  onViewDetails?: (prospectId: string) => void;
  onEditProspect?: (prospectId: string) => void;
  onAddProspect?: () => void;
}

type StatusType = 'all' | 'new' | 'contacted' | 'interested' | 'not_interested' | 'unsubscribed';

const ProspectsList = ({ onViewDetails, onEditProspect, onAddProspect }: ProspectsListProps) => {
  const { prospects, loading, error, deleteProspect } = useProspectionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handlers optimisés avec useCallback
  const handleViewDetails = useCallback((prospectId: string) => {
    onViewDetails?.(prospectId);
  }, [onViewDetails]);

  const handleEditProspect = useCallback((prospectId: string) => {
    onEditProspect?.(prospectId);
  }, [onEditProspect]);

  const handleAddProspect = useCallback(() => {
    onAddProspect?.();
  }, [onAddProspect]);

  const handleDelete = useCallback(async (prospectId: string, companyName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${companyName} ?`)) {
      try {
        await deleteProspect(prospectId);
        // Ajuster la page si nécessaire
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
      const matchesSearch = !searchTerm || (
        prospect.company_name.toLowerCase().includes(searchLower) ||
        prospect.contact_name.toLowerCase().includes(searchLower) ||
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

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'interested': return 'bg-green-500';
      case 'not_interested': return 'bg-red-500';
      case 'unsubscribed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'contacted': return 'Contacté';
      case 'interested': return 'Intéressé';
      case 'not_interested': return 'Pas intéressé';
      case 'unsubscribed': return 'Désabonné';
      default: return status;
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* En-tête avec recherche et filtres */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">
            Liste des Prospects ({filteredProspects.length})
          </h2>
          <button
            onClick={handleAddProspect}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un prospect</span>
          </button>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par entreprise, contact ou email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none transition-colors text-sm sm:text-base"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as StatusType)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none transition-colors text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="new">Nouveau</option>
              <option value="contacted">Contacté</option>
              <option value="interested">Intéressé</option>
              <option value="not_interested">Pas intéressé</option>
              <option value="unsubscribed">Désabonné</option>
            </select>
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
          paginatedProspects.map(prospect => (
            <div key={prospect.id} className="bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-semibold truncate">{prospect.company_name}</h3>
                    <span className={`self-start px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(prospect.status)}`}>
                      {getStatusLabel(prospect.status)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-300 text-sm sm:text-base">{prospect.contact_name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm break-all">{prospect.email}</p>
                    {prospect.phone && (
                      <p className="text-gray-400 text-xs sm:text-sm">{prospect.phone}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      Dernier contact: {prospect.last_contact 
                        ? new Date(prospect.last_contact).toLocaleDateString('fr-FR')
                        : 'Jamais contacté'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-1 sm:space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewDetails(prospect.id)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded transition-colors"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditProspect(prospect.id)}
                    className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prospect.id, prospect.company_name)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
            Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredProspects.length)} sur {filteredProspects.length} prospects
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-gray-700 rounded text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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