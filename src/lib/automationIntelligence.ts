import { ApiUsageStats, ProspectSearchCriteria } from './types/hunterTypes';

interface AutomationConfig {
  enabled: boolean;
  criteria: ProspectSearchCriteria;
  limits: {
    daily: number;
    monthly: number;
  };
  dailyLimit?: number;
  workingHours?: {
    start: string;
    end: string;
  };
}

interface ConfigSuggestion {
  type: 'optimization' | 'warning' | 'info';
  message: string;
  action?: string;
  title?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

export function getConfigSuggestions(stats: ApiUsageStats, config: AutomationConfig): ConfigSuggestion[] {
  const suggestions: ConfigSuggestion[] = [];

  // Suggestion basée sur le taux de cache hit
  if (stats?.usage?.cacheHitRate < 0.5) {
    suggestions.push({
      type: 'warning',
      message: 'Taux de cache faible',
      title: 'Optimisation du cache',
      description: 'Considérez ajuster les critères de recherche pour améliorer le cache',
      priority: 'high'
    });
  }

  // Suggestion basée sur la limite quotidienne
  if (config?.dailyLimit && config.dailyLimit > 100) {
    suggestions.push({
      type: 'optimization',
      message: 'Limite quotidienne élevée',
      title: 'Limite quotidienne élevée',
      description: 'Une limite plus basse pourrait améliorer la délivrabilité',
      priority: 'medium'
    });
  }

  // Suggestion basée sur les heures de travail
  const workingHours = config?.workingHours;
  if (workingHours && (workingHours.end === '18:00' && workingHours.start === '09:00')) {
    suggestions.push({
      type: 'info',
      message: 'Optimiser les heures d\'envoi',
      title: 'Optimiser les heures d\'envoi',
      description: 'Les emails envoyés entre 10h-11h et 14h-15h ont de meilleurs taux d\'ouverture',
      priority: 'low'
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const aPriority = a.priority || 'low';
    const bPriority = b.priority || 'low';
    return priorityOrder[bPriority] - priorityOrder[aPriority];
  });
}