import { useState, useEffect } from 'react';
import useProspectionStore from '../../stores/prospectionStore';
import ProspectsList from './ProspectsList';
import ProspectForm from './ProspectForm';
import ProspectDetails from './ProspectDetails';
import EmailCampaign from './EmailCampaign';
import EmailStatsDashboard from './EmailStatsDashboard';
import TemplateManager from './TemplateManager';
import AutomationDashboard from '../admin/AutomationDashboard';
import { 
  Users, Mail, BarChart3, FileText, Menu, X, 
  TrendingUp, Target, Zap, Bell, Bot 
} from 'lucide-react';
import AutoProspectionPanel from './AutoProspectionPanel';

type ActiveTab = 'list' | 'form' | 'details' | 'campaign' | 'stats' | 'templates' | 'template-form' | 'automation' | 'import';

const ProspectionDashboard = () => {
  const { loadProspects, prospects } = useProspectionStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('list');
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [editingProspectId, setEditingProspectId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
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

  const handleAddTemplate = () => {
    setEditingTemplateId(null);
    setActiveTab('template-form');
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setActiveTab('template-form');
  };

  const handleCloseTemplateForm = () => {
    setEditingTemplateId(null);
    setActiveTab('templates');
  };

  const handleTabChange = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const tabs = [
    { id: 'list', label: 'Prospects', icon: Users },
    { id: 'import', label: 'Import Auto', icon: Zap }, // Nouveau tab
    { id: 'campaign', label: 'Campagnes', icon: Mail },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'automation', label: 'Automation', icon: Bot },
  ];

  // Calculer les notifications de suivi
  const upcomingFollowUps = prospects.filter(p => {
    if (!p.next_follow_up) return false;
    const followUpDate = new Date(p.next_follow_up);
    const today = new Date();
    return followUpDate <= today;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header amélioré */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Prospection Hub
                </h1>
                <p className="text-gray-400 text-sm sm:text-base mt-1">
                  Gérez vos prospects avec intelligence et efficacité
                </p>
              </div>
            </div>
            
            {/* Notifications */}
            {upcomingFollowUps.length > 0 && (
              <div className="hidden md:flex items-center space-x-2 bg-orange-900/20 border border-orange-500/30 rounded-lg px-4 py-2">
                <Bell className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 text-sm">
                  {upcomingFollowUps.length} suivi{upcomingFollowUps.length > 1 ? 's' : ''} en attente
                </span>
              </div>
            )}
            
            {/* Menu burger mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-3 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-200"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Métriques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total Prospects</p>
                  <p className="text-2xl font-bold text-white">{prospects.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Qualifiés</p>
                  <p className="text-2xl font-bold text-white">
                    {prospects.filter(p => p.status === 'qualified').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Gagnés</p>
                  <p className="text-2xl font-bold text-white">
                    {prospects.filter(p => p.status === 'closed_won').length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Score Moyen</p>
                  <p className="text-2xl font-bold text-white">
                    {prospects.length > 0 
                      ? Math.round(prospects.reduce((acc, p) => acc + (p.lead_score || 0), 0) / prospects.length)
                      : 0
                    }
                  </p>
                </div>
                <Zap className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation améliorée */}
        {(activeTab === 'list' || activeTab === 'campaign' || activeTab === 'stats' || activeTab === 'templates' || activeTab === 'automation' || activeTab === 'import') && (
          <>
            {/* Navigation desktop */}
            <div className="hidden md:flex space-x-2 mb-8 bg-gray-800/50 backdrop-blur-sm p-2 rounded-2xl border border-gray-700/50">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as ActiveTab)}
                    className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-200 font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.id === 'automation' && (
                      <span className="bg-green-500 text-xs px-2 py-1 rounded-full">NEW</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Navigation mobile */}
            {isMobileMenuOpen && (
              <div className="md:hidden mb-6 bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="p-2 space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id as ActiveTab)}
                        className={`w-full flex items-center justify-between px-4 py-4 rounded-xl text-left transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <Icon className="w-6 h-6" />
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        {tab.id === 'automation' && (
                          <span className="bg-green-500 text-xs px-2 py-1 rounded-full">NEW</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Contenu principal */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="p-6">
            {activeTab === 'list' && (
              <div>
                <ProspectsList
                  onViewDetails={handleViewDetails}
                  onEditProspect={handleEditProspect}
                  onAddProspect={handleAddProspect}
                />
              </div>
            )}
            
            {activeTab === 'import' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Prospection Automatisée
                  </h2>
                  <p className="text-gray-400">
                    Importez automatiquement des prospects qualifiés via des APIs publiques gratuites
                  </p>
                </div>
                <AutoProspectionPanel />
              </div>
            )}
            
            {activeTab === 'form' && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {editingProspectId ? 'Modifier le prospect' : 'Ajouter un prospect'}
                  </h2>
                  <p className="text-gray-400">
                    {editingProspectId ? 'Mettez à jour les informations du prospect' : 'Créez un nouveau prospect dans votre pipeline'}
                  </p>
                </div>
                <ProspectForm
                  prospectId={editingProspectId || undefined}
                  onClose={handleCloseForm}
                />
              </div>
            )}
            
            {activeTab === 'details' && selectedProspectId && (
              <div className="p-6">
                <ProspectDetails
                  prospectId={selectedProspectId}
                  onClose={handleCloseDetails}
                  onEdit={handleEditFromDetails}
                />
              </div>
            )}
            
            {activeTab === 'campaign' && (
              <div className="p-6">
                <EmailCampaign />
              </div>
            )}
            
            {activeTab === 'stats' && (
              <div className="p-6">
                <EmailStatsDashboard />
              </div>
            )}
            
            {activeTab === 'templates' && (
              <div className="p-6">
                <TemplateManager 
                  activeTab="list"
                  onTabChange={(tab) => {
                    if (tab === 'form') {
                      setActiveTab('template-form');
                    }
                  }}
                  onEditTemplate={handleEditTemplate}
                  onAddTemplate={handleAddTemplate}
                />
              </div>
            )}
            
            {activeTab === 'template-form' && (
              <div className="p-6">
                <TemplateManager 
                  activeTab="form"
                  editingTemplateId={editingTemplateId}
                  onCloseForm={handleCloseTemplateForm}
                />
              </div>
            )}

            {activeTab === 'automation' && (
              <div className="p-6">
                <AutomationDashboard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectionDashboard;