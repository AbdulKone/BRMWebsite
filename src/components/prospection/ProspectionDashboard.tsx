import { useState, useEffect } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import ProspectsList from './ProspectsList';
import ProspectForm from './ProspectForm';
import ProspectDetails from './ProspectDetails';
import EmailCampaign from './EmailCampaign';
import EmailStatsDashboard from './EmailStatsDashboard';
import TemplateManager from './TemplateManager';
import { Users, Mail, BarChart3, Plus, FileText, Menu, X } from 'lucide-react';

type ActiveTab = 'list' | 'form' | 'details' | 'campaign' | 'stats' | 'templates';

const ProspectionDashboard = () => {
  const { loadProspects } = useProspectionStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [editingProspectId, setEditingProspectId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadProspects();
  }, [loadProspects]);

  const handleViewDetails = (prospectId: string) => {
    setSelectedProspectId(prospectId);
    setActiveTab('details');
  };

  const handleEditProspect = (prospectId: string) => {
    setEditingProspectId(prospectId);
    setActiveTab('form');
  };

  const handleAddProspect = () => {
    setEditingProspectId(null);
    setActiveTab('form');
  };

  const handleCloseForm = () => {
    setEditingProspectId(null);
    setActiveTab('list');
  };

  const handleCloseDetails = () => {
    setSelectedProspectId(null);
    setActiveTab('list');
  };

  const handleEditFromDetails = () => {
    if (selectedProspectId) {
      setEditingProspectId(selectedProspectId);
      setActiveTab('form');
    }
  };

  const handleTabChange = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false); // Fermer le menu mobile après sélection
  };

  const tabs = [
    { id: 'list', label: 'Prospects', icon: Users },
    { id: 'campaign', label: 'Campagnes', icon: Mail },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: FileText },
  ];

  const getCurrentTabLabel = () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    return currentTab ? currentTab.label : 'Prospects';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* En-tête avec menu mobile */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestion de la Prospection</h1>
              <p className="text-gray-400 text-sm sm:text-base">Gérez vos prospects, campagnes email et templates</p>
            </div>
            
            {/* Menu burger mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Titre de l'onglet actuel sur mobile */}
          <div className="md:hidden mb-4">
            <h2 className="text-lg font-semibold text-blue-400">{getCurrentTabLabel()}</h2>
          </div>
        </div>

        {/* Navigation par onglets */}
        {(activeTab === 'list' || activeTab === 'campaign' || activeTab === 'stats' || activeTab === 'templates') && (
          <>
            {/* Navigation desktop */}
            <div className="hidden md:flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as ActiveTab)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Navigation mobile */}
            {isMobileMenuOpen && (
              <div className="md:hidden mb-6 bg-gray-800 rounded-lg border border-gray-700">
                <div className="p-2 space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as ActiveTab)}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-md text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Contenu principal */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
          {activeTab === 'list' && (
            <ProspectsList
              onViewDetails={handleViewDetails}
              onEditProspect={handleEditProspect}
              onAddProspect={handleAddProspect}
            />
          )}
          
          {activeTab === 'form' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-6">
                {editingProspectId ? 'Modifier le prospect' : 'Ajouter un prospect'}
              </h2>
              <ProspectForm
                prospectId={editingProspectId || undefined}
                onClose={handleCloseForm}
              />
            </div>
          )}
          
          {activeTab === 'details' && selectedProspectId && (
            <ProspectDetails
              prospectId={selectedProspectId}
              onClose={handleCloseDetails}
              onEdit={handleEditFromDetails}
            />
          )}
          
          {activeTab === 'campaign' && <EmailCampaign />}
          
          {activeTab === 'stats' && <EmailStatsDashboard />}
          
          {activeTab === 'templates' && <TemplateManager />}
        </div>
      </div>
    </div>
  );
};

export default ProspectionDashboard;