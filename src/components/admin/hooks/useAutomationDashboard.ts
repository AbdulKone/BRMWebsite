import { useState, useEffect, useCallback } from 'react';
import { useAutomationStore } from '../../../stores/automationStore';
import { AutomationService } from '../services/automationService';
import { AutomationStats, RecentActivity, AutomationConfig, SystemHealth } from '../types/automation.types';
import { useErrorStore } from '../../../stores/errorStore';

export const useAutomationDashboard = () => {
  const {
    isActive,
    error,
    toggleAutomation,
    updateConfig: updateStoreConfig,
    triggerN8nWorkflow,
    syncWithN8n,
    startProspectionCampaign,
    isLoading: storeLoading,
    initializeConfig
  } = useAutomationStore();

  const { handleError, handleSuccess } = useErrorStore();

  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'disconnected',
    color: 'red',
    label: 'Vérification...',
    n8nConnected: false,
    databaseConnected: false
  });

  const fetchAutomationConfig = useCallback(async () => {
    const configData = await AutomationService.fetchAutomationConfig();
    if (configData) {
      setConfig(configData);
    }
  }, []);

  const fetchAutomationStats = useCallback(async () => {
    if (!config) return;
    
    const statsData = await AutomationService.fetchAutomationStats(config);
    if (statsData) {
      setStats(statsData);
    }
    setIsLoading(false);
  }, [config]);

  const fetchRecentActivity = useCallback(async () => {
    if (!config) return;
    
    const activities = await AutomationService.fetchRecentActivity(config);
    setRecentActivity(activities);
  }, [config]);

  const checkSystemHealth = useCallback(async () => {
    const health = await AutomationService.checkSystemHealth(config, isActive, error);
    setSystemHealth(health);
  }, [config, isActive, error]);

  const updateConfig = useCallback(async (newConfig: Partial<AutomationConfig>) => {
    if (!config) {
      handleError('Configuration non initialisée', 'Impossible de mettre à jour une configuration non chargée');
      return;
    }

    try {
      setIsLoading(true);
      const fullConfig: AutomationConfig = { ...config, ...newConfig };
      await AutomationService.updateConfig(fullConfig);
      setConfig(fullConfig);
      handleSuccess('Configuration mise à jour avec succès');
    } catch (error) {
      handleError('Erreur lors de la mise à jour de la configuration', error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [config, handleError, handleSuccess]);

  const updateScores = useCallback(async () => {
    try {
      setIsLoading(true);
      await triggerN8nWorkflow('update-scores');
      await fetchAutomationStats();
      handleSuccess('Scores mis à jour avec succès');
    } catch (error) {
      handleError('Erreur lors de la mise à jour des scores', error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [triggerN8nWorkflow, fetchAutomationStats, handleError, handleSuccess]);

  // Ajouter un useEffect pour initialiser la configuration au montage
  useEffect(() => {
    initializeConfig();
  }, [initializeConfig]);

  useEffect(() => {
    fetchAutomationConfig();
  }, [fetchAutomationConfig]);

  useEffect(() => {
    if (config) {
      fetchAutomationStats();
      fetchRecentActivity();
    }
  }, [config, fetchAutomationStats, fetchRecentActivity]);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  const handleSyncWithN8n = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncWithN8n();
    } finally {
      setIsSyncing(false);
    }
  }, [syncWithN8n]);
  
  return {
    // État
    stats,
    recentActivity,
    config,
    isLoading: isLoading || storeLoading,
    isSyncing,
    systemHealth,
    isActive,
    error,
    
    // Actions
    toggleAutomation,
    updateConfig,
    updateScores,
    syncWithN8n: handleSyncWithN8n,
    startProspectionCampaign,
    
    // Fonctions de rafraîchissement
    refreshStats: fetchAutomationStats,
    refreshActivity: fetchRecentActivity,
    refreshHealth: checkSystemHealth
  };
};
