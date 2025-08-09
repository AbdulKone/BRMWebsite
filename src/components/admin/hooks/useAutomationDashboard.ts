import { useState, useEffect, useCallback } from 'react';
import { useAutomationStore } from '../../../stores/automationStore';
import { AutomationService } from '../services/automationService';
import { AutomationStats, RecentActivity, AutomationConfig, SystemHealth } from '../types/automation.types';

export const useAutomationDashboard = () => {
  const {
    isActive,
    error,
    toggleAutomation,
    updateConfig: updateStoreConfig,
    triggerN8nWorkflow,
    syncWithN8n,
    startProspectionCampaign,
    isLoading: storeLoading
  } = useAutomationStore();

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
    if (!config) return;
    
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    try {
      await AutomationService.updateConfig(updatedConfig);
      
      // Synchroniser avec le store
      updateStoreConfig({
        dailyLimit: updatedConfig.dailyLimit,
        followUpDelay: updatedConfig.followUpDelay,
        workingHours: updatedConfig.workingHours,
        workingDays: updatedConfig.workingDays
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
    }
  }, [config, updateStoreConfig]);

  const updateScores = useCallback(async () => {
    setIsLoading(true);
    try {
      await triggerN8nWorkflow('update-scores');
      await fetchAutomationStats();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des scores:', error);
    } finally {
      setIsLoading(false);
    }
  }, [triggerN8nWorkflow, fetchAutomationStats]);

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
    syncWithN8n,
    startProspectionCampaign,
    
    // Fonctions de rafraîchissement
    refreshStats: fetchAutomationStats,
    refreshActivity: fetchRecentActivity,
    refreshHealth: checkSystemHealth
  };
};