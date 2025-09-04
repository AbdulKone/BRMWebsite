interface DailyUsage {
  date: string;
  requests: number;
  cached: number;
  domains: Set<string>;
  companies: Set<string>;
}

interface UsageAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  percentage: number;
}

class ApiUsageMonitor {
  private readonly DAILY_LIMIT = 50; // Limite gratuite Hunter.io
  private readonly MONTHLY_LIMIT = 1000;
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly CRITICAL_THRESHOLD = 0.95; // 95%
  private readonly STORAGE_KEY = 'hunter_usage_monitor';

  private usage: Map<string, DailyUsage> = new Map();

  constructor() {
    this.loadUsage();
    // Nettoyage des données anciennes (> 30 jours)
    this.cleanupOldData();
  }

  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getTodayUsage(): DailyUsage {
    const today = this.getTodayKey();
    return this.usage.get(today) || {
      date: today,
      requests: 0,
      cached: 0,
      domains: new Set(),
      companies: new Set()
    };
  }

  getMonthlyUsage(): number {
    const monthKey = this.getMonthKey();
    let total = 0;
    
    for (const [date, usage] of this.usage.entries()) {
      if (date.startsWith(monthKey)) {
        total += usage.requests;
      }
    }
    
    return total;
  }

  incrementUsage(type: 'api' | 'cache', domain?: string, company?: string): void {
    const today = this.getTodayKey();
    const todayUsage = this.getTodayUsage();
    
    if (type === 'api') {
      todayUsage.requests++;
      if (domain) todayUsage.domains.add(domain);
      if (company) todayUsage.companies.add(company);
    } else {
      todayUsage.cached++;
    }
    
    this.usage.set(today, todayUsage);
    this.saveUsage();
    
    // Vérifier les alertes
    this.checkAlerts();
  }

  canMakeRequest(): boolean {
    const todayUsage = this.getTodayUsage();
    return todayUsage.requests < this.DAILY_LIMIT;
  }

  getRemainingQuota(): { daily: number; monthly: number } {
    const todayUsage = this.getTodayUsage();
    const monthlyUsage = this.getMonthlyUsage();
    
    return {
      daily: Math.max(0, this.DAILY_LIMIT - todayUsage.requests),
      monthly: Math.max(0, this.MONTHLY_LIMIT - monthlyUsage)
    };
  }

  getUsagePercentage(): { daily: number; monthly: number } {
    const todayUsage = this.getTodayUsage();
    const monthlyUsage = this.getMonthlyUsage();
    
    return {
      daily: (todayUsage.requests / this.DAILY_LIMIT) * 100,
      monthly: (monthlyUsage / this.MONTHLY_LIMIT) * 100
    };
  }

  checkAlerts(): UsageAlert[] {
    const alerts: UsageAlert[] = [];
    const percentages = this.getUsagePercentage();
    const remaining = this.getRemainingQuota();
    
    // Alerte quotidienne
    if (percentages.daily >= this.CRITICAL_THRESHOLD * 100) {
      alerts.push({
        type: 'critical',
        message: `⚠️ Quota quotidien critique: ${remaining.daily} appels restants`,
        percentage: percentages.daily
      });
    } else if (percentages.daily >= this.WARNING_THRESHOLD * 100) {
      alerts.push({
        type: 'warning',
        message: `⚡ Attention: ${remaining.daily} appels restants aujourd'hui`,
        percentage: percentages.daily
      });
    }
    
    // Alerte mensuelle
    if (percentages.monthly >= this.WARNING_THRESHOLD * 100) {
      alerts.push({
        type: 'warning',
        message: `📊 Quota mensuel: ${remaining.monthly} appels restants`,
        percentage: percentages.monthly
      });
    }
    
    // Afficher les alertes
    alerts.forEach(alert => {
      if (alert.type === 'critical') {
        console.error(alert.message);
      } else {
        console.warn(alert.message);
      }
    });
    
    return alerts;
  }

  getEfficiencyStats(): {
    cacheHitRate: number;
    apiCallsSaved: number;
    totalRequests: number;
  } {
    const todayUsage = this.getTodayUsage();
    const totalRequests = todayUsage.requests + todayUsage.cached;
    
    return {
      cacheHitRate: totalRequests > 0 ? (todayUsage.cached / totalRequests) * 100 : 0,
      apiCallsSaved: todayUsage.cached,
      totalRequests
    };
  }

  private saveUsage(): void {
    try {
      const data = Array.from(this.usage.entries()).map(([date, usage]) => ([
        date,
        {
          ...usage,
          domains: Array.from(usage.domains),
          companies: Array.from(usage.companies)
        }
      ]));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Erreur sauvegarde usage monitor:', error);
    }
  }

  private loadUsage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.usage = new Map(data.map(([date, usage]: [string, any]) => [
          date,
          {
            ...usage,
            domains: new Set(usage.domains || []),
            companies: new Set(usage.companies || [])
          }
        ]));
      }
    } catch (error) {
      console.warn('Erreur chargement usage monitor:', error);
      this.usage.clear();
    }
  }

  private cleanupOldData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    let cleaned = 0;
    for (const [date] of this.usage.entries()) {
      if (date < cutoffDate) {
        this.usage.delete(date);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Données d'usage nettoyées: ${cleaned} jours supprimés`);
      this.saveUsage();
    }
  }

  reset(): void {
    this.usage.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const apiUsageMonitor = new ApiUsageMonitor();
export type { UsageAlert, DailyUsage };