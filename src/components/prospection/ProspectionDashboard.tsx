import { useState, useEffect } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import ProspectsList from './ProspectsList';
import ProspectForm from './ProspectForm';
import ProspectDetails from './ProspectDetails';
import EmailCampaign from './EmailCampaign';
import EmailStatsDashboard from './EmailStatsDashboard';
import TemplateManager from './TemplateManager';
import { Users, Mail, BarChart3, Plus, FileText } from 'lucide-react';

type ActiveTab = 'list' | 'form' | 'details' | 'campaign' | 'stats' | 'templates';

const ProspectionDashboard = () => {
  const { loadProspects } = useProspectionStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [editingProspectId, setEditingProspectId] = useState<string | null>(null);

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

  const tabs = [
    { id: 'list', label: 'Prospects', icon: Users },
    { id: 'campaign', label: 'Campagnes', icon: Mail },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion de la Prospection</h1>
          <p className="text-gray-400">Gérez vos prospects, campagnes email et templates</p>
        </div>

        {/* Navigation par onglets */}
        {(activeTab === 'list' || activeTab === 'campaign' || activeTab === 'stats' || activeTab === 'templates') && (
          <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
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
        )}

        {/* Contenu principal */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'list' && (
            <ProspectsList
              onViewDetails={handleViewDetails}
              onEditProspect={handleEditProspect}
              onAddProspect={handleAddProspect}
            />
          )}
          
          {activeTab === 'form' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
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