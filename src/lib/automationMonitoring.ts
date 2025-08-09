import { useErrorStore } from '../stores/errorStore';

const { handleError } = useErrorStore.getState();

interface AlertRule {
  id: string;
  name: string;
  condition: (stats: any) => boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
  cooldown: number; // en minutes
}

const alertRules: AlertRule[] = [
  {
    id: 'low_open_rate',
    name: 'Taux d\'ouverture faible',
    condition: (stats) => stats.openRate < 10,
    message: 'Le taux d\'ouverture est tombé sous 10%. Vérifiez vos objets d\'email.',
    severity: 'warning',
    cooldown: 60
  },
  {
    id: 'high_bounce_rate',
    name: 'Taux de rebond élevé',
    condition: (stats) => stats.bounceRate > 5,
    message: 'Taux de rebond élevé détecté. Nettoyez votre liste de prospects.',
    severity: 'error',
    cooldown: 30
  },
  {
    id: 'automation_stopped',
    name: 'Automatisation arrêtée',
    condition: (stats) => !stats.isActive,
    message: 'L\'automatisation a été arrêtée de manière inattendue.',
    severity: 'error',
    cooldown: 5
  }
];

export class AutomationMonitor {
  private lastAlerts = new Map<string, number>();

  checkAlerts(stats: any): void {
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