import { Bot, Play, Pause, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAutomationDashboard } from './hooks/useAutomationDashboard';
import { SystemHealthIndicator } from './components/SystemHealthIndicator';
import { StatsGrid } from './components/StatsGrid';
import { RecentActivityPanel } from './components/RecentActivityPanel';
import { ConfigurationPanel } from './components/ConfigurationPanel';

export default function AutomationDashboard() {
  const {
    stats,
    recentActivity,
    config,
    isLoading,
    isSyncing,
    systemHealth,
    isActive,
    error,
    toggleAutomation,
    updateConfig,
    updateScores,
    syncWithN8n,
    startProspectionCampaign
  } = useAutomationDashboard();

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Afficher les erreurs */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Indicateur de santé système */}
      <SystemHealthIndicator systemHealth={systemHealth} />

      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Automation Dashboard</h2>
            <p className="text-gray-400">Pilotez votre prospection automatisée avec n8n</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Indicateur de statut */}
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            isActive ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-green-300' : 'text-red-300'}`}>
              {isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          
          {/* Bouton de synchronisation */}
          <button
            onClick={syncWithN8n}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sync...' : 'Sync n8n'}</span>
          </button>
          
          {/* Bouton principal */}
          <button
            onClick={toggleAutomation}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 ${
              isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isActive ? 'Suspendre' : 'Activer'}</span>
          </button>
        </div>
      </div>

      {/* Grille des statistiques */}
      {stats && <StatsGrid stats={stats} config={config} />}

      {/* Panneaux d'activité et configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivityPanel 
          activities={recentActivity} 
          onUpdateScores={updateScores}
          onStartCampaign={startProspectionCampaign}
        />
        <ConfigurationPanel 
          config={config} 
          onUpdateConfig={updateConfig} 
        />
      </div>
    </div>
  );
}