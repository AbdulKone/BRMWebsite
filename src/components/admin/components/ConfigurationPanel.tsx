import React, { useState, useEffect } from 'react';
import { Settings, Save, Clock, Calendar, Target } from 'lucide-react';
import { AutomationConfig } from '../types/automation.types';
import { WORKING_DAYS_OPTIONS } from '../utils/automationUtils';

interface ConfigurationPanelProps {
  config: AutomationConfig;
  onUpdateConfig: (config: Partial<AutomationConfig>) => Promise<void>;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onUpdateConfig
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Synchroniser avec les changements de config externe
  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const handleConfigChange = (field: keyof AutomationConfig, value: any) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Correction du typage pour éviter l'erreur TypeScript
  const handleNestedConfigChange = (parent: string, field: string, value: any) => {
    setLocalConfig(prev => {
      const parentValue = prev[parent as keyof AutomationConfig];
      
      // Vérifier que la valeur parent est un objet avant de faire le spread
      if (typeof parentValue === 'object' && parentValue !== null) {
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [field]: value
          }
        };
      }
      
      // Fallback si ce n'est pas un objet
      return {
        ...prev,
        [parent]: {
          [field]: value
        }
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig(localConfig);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWorkingDaysChange = (dayValue: string, checked: boolean) => {
    const newDays = checked
      ? [...localConfig.workingDays, dayValue]
      : localConfig.workingDays.filter(d => d !== dayValue);
    handleConfigChange('workingDays', newDays);
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Configuration</h3>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
            <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Limites et délais */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span>Limites et délais</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limite quotidienne d'e-mails
              </label>
              <input
                type="number"
                value={localConfig.dailyLimit}
                onChange={(e) => handleConfigChange('dailyLimit', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="1000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Délai de suivi (heures)
              </label>
              <input
                type="number"
                value={localConfig.followUpDelay}
                onChange={(e) => handleConfigChange('followUpDelay', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="168"
              />
            </div>
          </div>
        </div>

        {/* Heures de travail */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Heures de travail</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Heure de début
              </label>
              <input
                type="time"
                value={localConfig.workingHours.start}
                onChange={(e) => handleNestedConfigChange('workingHours', 'start', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Heure de fin
              </label>
              <input
                type="time"
                value={localConfig.workingHours.end}
                onChange={(e) => handleNestedConfigChange('workingHours', 'end', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Jours de travail */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>Jours de travail</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {WORKING_DAYS_OPTIONS.map((day) => (
              <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.workingDays.includes(day.value)}
                  onChange={(e) => handleWorkingDaysChange(day.value, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">{day.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};