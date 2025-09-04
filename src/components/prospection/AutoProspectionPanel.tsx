import { useState, useEffect } from 'react';
import { ProspectApiService } from '../../lib/prospectApiService';
import { type ProspectSearchCriteria } from '../../lib/types/hunterTypes';
import useProspectionStore, { type Prospect } from '../../stores/prospectionStore';
import { useErrorStore } from '../../stores/errorStore';
import { Search, Download, Zap, RefreshCw } from 'lucide-react';

// Interface pour typer les prospects retournés par l'API (étendue)
interface ProspectData {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  position?: string;
  source?: string;
  status?: Prospect['status'];
  lead_score?: number;
  // Nouvelles propriétés enrichies
  company_industry?: string;
  company_size?: string;
  company_location?: string;
}

// Interface pour les options dynamiques
interface FilterOptions {
  industries: Array<{ value: string; label: string }>;
  locations: Array<{ value: string; label: string }>;
  companySizes: Array<{ value: string; label: string }>;
}

const AutoProspectionPanel = () => {
  const { saveProspect } = useProspectionStore();
  const { handleSuccess, handleError } = useErrorStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [criteria, setCriteria] = useState<ProspectSearchCriteria>({
    limit: 25,
    quickFilters: {
      industry: '',
      location: '',
      companySize: ''
    }
  });
  const [previewProspects, setPreviewProspects] = useState<ProspectData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    industries: [],
    locations: [],
    companySizes: []
  });

  // Chargement des options dynamiques au montage du composant
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    setIsLoadingOptions(true);
    try {
      // Initialisation du service pour charger les mappings
      await ProspectApiService.initialize();
      
      // Options de fallback basées sur les mappings par défaut du service
      setFilterOptions({
        industries: [
          { value: 'music', label: 'Musique' },
          { value: 'media', label: 'Médias' },
          { value: 'advertising', label: 'Publicité' },
          { value: 'luxury', label: 'Luxe' },
          { value: 'sports', label: 'Sports' }
        ],
        locations: [
          { value: 'france', label: 'France' },
          { value: 'europe', label: 'Europe' },
          { value: 'international', label: 'International' }
        ],
        companySizes: [
          { value: 'startup', label: '1-10 employés' },
          { value: 'small', label: '11-50 employés' },
          { value: 'medium', label: '51-200 employés' },
          { value: 'large', label: '200+ employés' }
        ]
      });
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error);
      handleError('Erreur de configuration', 'Impossible de charger les options de filtrage');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const prospects = await ProspectApiService.fetchProspects(criteria);
  
      const transformedProspects: ProspectData[] = prospects.map(prospect => ({
        email: prospect.email,
        first_name: prospect.first_name,
        last_name: prospect.last_name,
        company_name: prospect.company,
        position: prospect.position,
        source: 'api_import',
        status: 'new' as Prospect['status'],
        lead_score: prospect.score || 50,
        company_industry: prospect.industry,
        company_size: prospect.company_size,
        company_location: prospect.company
      }));
  
      setPreviewProspects(transformedProspects);
      setShowPreview(true);
      handleSuccess(`${transformedProspects.length} prospects trouvés`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      handleError('Erreur lors de la recherche', errorMessage);
      console.error('Détails de l\'erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (selectedProspects: ProspectData[]) => {
    setIsLoading(true);
    try {
      for (const prospect of selectedProspects) {
        const prospectToSave: Partial<Prospect> = {
          email: prospect.email,
          first_name: prospect.first_name,
          last_name: prospect.last_name,
          company_name: prospect.company_name,
          position: prospect.position,
          source: prospect.source || 'api_import',
          status: prospect.status || 'new',
          lead_score: prospect.lead_score || 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await saveProspect(prospectToSave);
      }
      handleSuccess(`${selectedProspects.length} prospects importés avec succès`);
      setShowPreview(false);
      setPreviewProspects([]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      handleError('Erreur lors de l\'importation', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Suppression de handleRefreshOptions car elle fait doublon avec loadFilterOptions

  if (isLoadingOptions) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400">Chargement des options...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Prospection Automatisée</h3>
            <p className="text-gray-400 text-sm">Importez des prospects via APIs publiques</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadFilterOptions}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Actualiser les options"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full">
            APIs Dynamiques
          </span>
        </div>
      </div>

      {/* Critères de recherche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Industrie
          </label>
          <select
            value={criteria.quickFilters?.industry || ''}
            onChange={(e) => setCriteria({
              ...criteria,
              quickFilters: {
                ...criteria.quickFilters,
                industry: e.target.value || undefined
              }
            })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Toutes les industries</option>
            {filterOptions.industries.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Localisation
          </label>
          <select
            value={criteria.quickFilters?.location || ''}
            onChange={(e) => setCriteria({
              ...criteria,
              quickFilters: {
                ...criteria.quickFilters,
                location: e.target.value || undefined
              }
            })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Toutes les localisations</option>
            {filterOptions.locations.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Taille d'entreprise
          </label>
          <select
            value={criteria.quickFilters?.companySize || ''}
            onChange={(e) => setCriteria({
              ...criteria,
              quickFilters: {
                ...criteria.quickFilters,
                companySize: e.target.value || undefined
              }
            })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Toutes les tailles</option>
            {filterOptions.companySizes.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Limite
          </label>
          <select
            value={criteria.limit}
            onChange={(e) => setCriteria({...criteria, limit: parseInt(e.target.value)})}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value={10}>10 prospects</option>
            <option value={25}>25 prospects</option>
            <option value={50}>50 prospects</option>
            <option value={100}>100 prospects</option>
          </select>
        </div>
      </div>

      {/* Champs de recherche avancée */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Mots-clés (optionnel)
          </label>
          <input
            type="text"
            value={criteria.keywords?.join(', ') || ''}
            onChange={(e) => setCriteria({
              ...criteria,
              keywords: e.target.value ? e.target.value.split(',').map(k => k.trim()) : undefined
            })}
            placeholder="Ex: marketing, design, startup..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nom d'entreprise (optionnel)
          </label>
          <input
            type="text"
            value={criteria.companyName || ''}
            onChange={(e) => setCriteria({
              ...criteria,
              companyName: e.target.value || undefined
            })}
            placeholder="Ex: Google, Microsoft..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Recherche en langage naturel */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Recherche en langage naturel (optionnel)
        </label>
        <textarea
          value={criteria.naturalLanguageQuery || ''}
          onChange={(e) => setCriteria({
            ...criteria,
            naturalLanguageQuery: e.target.value || undefined
          })}
          placeholder="Ex: Startups françaises dans le domaine de la tech avec moins de 50 employés..."
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-all"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Recherche...' : 'Rechercher des Prospects'}</span>
        </button>

        <div className="text-sm text-gray-400">
          Recherche dynamique via APIs configurables
        </div>
      </div>

      {/* Prévisualisation */}
      {showPreview && (
        <ProspectPreview
          prospects={previewProspects}
          onImport={handleImport}
          onCancel={() => setShowPreview(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

interface ProspectPreviewProps {
  prospects: ProspectData[];
  onImport: (selected: ProspectData[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ProspectPreview = ({ prospects, onImport, onCancel, isLoading }: ProspectPreviewProps) => {
  const [selectedProspects, setSelectedProspects] = useState<ProspectData[]>(prospects);

  const toggleProspect = (prospect: ProspectData) => {
    setSelectedProspects(prev => 
      prev.includes(prospect) 
        ? prev.filter(p => p !== prospect)
        : [...prev, prospect]
    );
  };

  return (
    <div className="mt-6 border-t border-gray-700 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">
          Prévisualisation ({prospects.length} prospects trouvés)
        </h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedProspects(prospects)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Tout sélectionner
          </button>
          <button
            onClick={() => setSelectedProspects([])}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
        {prospects.map((prospect, index) => (
          <div
            key={`${prospect.email}-${index}`}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedProspects.includes(prospect)
                ? 'bg-blue-900/20 border-blue-500/50'
                : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'
            }`}
            onClick={() => toggleProspect(prospect)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">
                  {prospect.first_name} {prospect.last_name}
                </div>
                <div className="text-sm text-gray-400">
                  {prospect.position} chez {prospect.company_name}
                </div>
                <div className="text-xs text-gray-500">{prospect.email}</div>
                {/* Affichage des données enrichies */}
                {(prospect.company_industry || prospect.company_size || prospect.company_location) && (
                  <div className="flex items-center space-x-2 mt-1">
                    {prospect.company_industry && (
                      <span className="text-xs bg-purple-900/20 text-purple-400 px-2 py-1 rounded-full">
                        {prospect.company_industry}
                      </span>
                    )}
                    {prospect.company_size && (
                      <span className="text-xs bg-blue-900/20 text-blue-400 px-2 py-1 rounded-full">
                        {prospect.company_size}
                      </span>
                    )}
                    {prospect.company_location && (
                      <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded-full">
                        {prospect.company_location}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded-full">
                  Score: {prospect.lead_score}
                </span>
                <input
                  type="checkbox"
                  checked={selectedProspects.includes(prospect)}
                  onChange={() => toggleProspect(prospect)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {selectedProspects.length} prospects sélectionnés
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onImport(selectedProspects)}
            disabled={selectedProspects.length === 0 || isLoading}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Importer {selectedProspects.length} prospects</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoProspectionPanel;
