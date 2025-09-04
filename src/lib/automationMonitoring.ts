import { useErrorStore } from '../stores/errorStore';
import { ApiUsageStats } from './types/hunterTypes';

const { handleError } = useErrorStore.getState();

interface AlertRule {
  id: string;
  name: string;
  condition: (stats: ApiUsageStats) => boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
  cooldown: number; // en minutes
}

const alertRules: AlertRule[] = [
  {
    id: 'low_cache_hit_rate',
    name: 'Taux de cache faible',
    condition: (stats) => stats.usage.cacheHitRate < 0.5,
    message: 'Le taux de cache est tombé sous 50%. Optimisez vos requêtes pour améliorer les performances.',
    severity: 'warning',
    cooldown: 60
  },
  {
    id: 'high_api_usage',
    name: 'Utilisation API élevée',
    condition: (stats) => stats.usage.totalRequests > stats.quota.daily * 0.8,
    message: 'Utilisation API élevée détectée. Vous approchez de votre quota quotidien.',
    severity: 'error',
    cooldown: 30
  },
  {
    id: 'quota_exceeded',
    name: 'Quota dépassé',
    condition: (stats) => stats.usage.totalRequests >= stats.quota.daily,
    message: 'Le quota quotidien a été atteint. Les requêtes API sont suspendues.',
    severity: 'error',
    cooldown: 5
  }
];

export class AutomationMonitor {
  private lastAlerts = new Map<string, number>();

  checkAlerts(stats: ApiUsageStats): void {
    const now = Date.now();
    
    alertRules.forEach(rule => {
      if (rule.condition(stats)) {
        const lastAlert = this.lastAlerts.get(rule.id) || 0;
        const cooldownMs = rule.cooldown * 60 * 1000;
        
        if (now - lastAlert > cooldownMs) {
          this.sendAlert(rule);
          this.lastAlerts.set(rule.id, now);
        }
      }
    });
  }

  private sendAlert(rule: AlertRule): void {
    // Utiliser handleError avec le niveau de sévérité approprié
    const errorMessage = `${rule.name}: ${rule.message}`;
    
    if (rule.severity === 'error') {
      handleError(new Error(errorMessage), 'Alerte Automation');
      this.sendSlackNotification(rule);
    } else if (rule.severity === 'warning') {
      // Pour les warnings, on peut utiliser handleError avec un préfixe différent
      handleError(new Error(errorMessage), 'Avertissement Automation');
    }
  }

  private async sendSlackNotification(rule: AlertRule): Promise<void> {
    // Implémentation Slack webhook
  }
}