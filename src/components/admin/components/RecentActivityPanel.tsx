import React from 'react';
import { RefreshCw, Play, Clock } from 'lucide-react';
import { RecentActivity } from '../types/automation.types';
import { getActivityIcon, formatTimeAgo, getStatusColor, getStatusLabel, getStatusBackground } from '../utils/automationUtils';

interface RecentActivityPanelProps {
  activities: RecentActivity[];
  onUpdateScores: () => Promise<void>;
  onStartCampaign: () => Promise<void>;
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({
  activities,
  onUpdateScores,
  onStartCampaign
}) => {
  const [isUpdatingScores, setIsUpdatingScores] = React.useState(false);
  const [isStartingCampaign, setIsStartingCampaign] = React.useState(false);

  const handleUpdateScores = async () => {
    setIsUpdatingScores(true);
    try {
      await onUpdateScores();
    } finally {
      setIsUpdatingScores(false);
    }
  };

  const handleStartCampaign = async () => {
    setIsStartingCampaign(true);
    try {
      await onStartCampaign();
    } finally {
      setIsStartingCampaign(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Activité récente</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleUpdateScores}
            disabled={isUpdatingScores}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdatingScores ? 'animate-spin' : ''}`} />
            <span>{isUpdatingScores ? 'Mise à jour...' : 'Actualiser'}</span>
          </button>
          <button
            onClick={handleStartCampaign}
            disabled={isStartingCampaign}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors text-sm"
          >
            <Play className={`w-4 h-4 ${isStartingCampaign ? 'animate-pulse' : ''}`} />
            <span>{isStartingCampaign ? 'Démarrage...' : 'Campagne'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucune activité récente</p>
          </div>
        ) : (
          activities.map((activity) => {
            const activityIcon = getActivityIcon(activity.type);
            
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-900/30 rounded-lg">
                <div className={`p-2 rounded-lg bg-gray-700 ${getStatusColor(activity.status)}`}>
                  <span className="text-sm">{activityIcon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{activity.description}</p>
                  <p className="text-gray-400 text-xs mt-1">{formatTimeAgo(activity.timestamp)}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBackground(activity.status)}`}>
                  {getStatusLabel(activity.status)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};