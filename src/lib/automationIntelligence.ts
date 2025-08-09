export interface ConfigSuggestion {
  type: 'optimization' | 'warning' | 'improvement';
  title: string;
  description: string;
  action?: () => void;
  priority: 'high' | 'medium' | 'low';
}

export function getConfigSuggestions(stats: any, config: any): ConfigSuggestion[] {
  const suggestions: ConfigSuggestion[] = [];

  // Suggestion basée sur le taux d'ouverture
  if (stats?.openRate < 15) {
    suggestions.push({
      type: 'warning',
      title: 'Taux d\'ouverture faible',
      description: 'Considérez réduire la fréquence d\'envoi ou améliorer les objets d\'email',
      priority: 'high'
    });
  }

  // Suggestion basée sur la limite quotidienne
  if (config?.dailyLimit > 100) {
    suggestions.push({
      type: 'optimization',
      title: 'Limite quotidienne élevée',
      description: 'Une limite plus basse pourrait améliorer la délivrabilité',
      priority: 'medium'
    });
  }

  // Suggestion basée sur les heures de travail
  const workingHours = config?.workingHours;
  if (workingHours && (workingHours.end === '18:00' && workingHours.start === '09:00')) {
    suggestions.push({
      type: 'improvement',
      title: 'Optimiser les heures d\'envoi',
      description: 'Les emails envoyés entre 10h-11h et 14h-15h ont de meilleurs taux d\'ouverture',
      priority: 'low'
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}