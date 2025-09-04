import { supabase } from './supabase';

interface AnalyticsLog {
  id: string;
  timestamp: number;
  provider_name: string;
  endpoint: string;
  success: boolean;
  error_message?: string;
  prospects_count: number;
  created_at: string;
}

interface ProviderStats {
  total: number;
  success: number;
  errors: number;
}

interface UsageStats {
  totalRequests: number;
  successRate: number;
  byProvider: Record<string, ProviderStats>;
}

export class ProspectAnalytics {
  static async trackApiUsage(
    provider: string, 
    endpoint: string, 
    success: boolean, 
    error?: string
  ): Promise<void> {
    try {
      await supabase.from('api_usage_logs').insert({
        provider_name: provider,
        endpoint,
        success,
        error_message: error || null
      });
    } catch (err) {
      console.error('Failed to track API usage:', err);
    }
  }

  static async getUsageStats(): Promise<UsageStats> {
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Failed to fetch usage stats:', error);
        return { totalRequests: 0, successRate: 0, byProvider: {} };
      }

      const logs = data as AnalyticsLog[] || [];
      
      return {
        totalRequests: logs.length,
        successRate: logs.length > 0 ? (logs.filter(d => d.success).length / logs.length) * 100 : 0,
        byProvider: this.groupByProvider(logs)
      };
    } catch (err) {
      console.error('Error getting usage stats:', err);
      return { totalRequests: 0, successRate: 0, byProvider: {} };
    }
  }

  private static groupByProvider(logs: AnalyticsLog[]): Record<string, ProviderStats> {
    return logs.reduce((acc: Record<string, ProviderStats>, log: AnalyticsLog) => {
      if (!acc[log.provider_name]) {
        acc[log.provider_name] = { total: 0, success: 0, errors: 0 };
      }
      
      acc[log.provider_name].total++;
      if (log.success) {
        acc[log.provider_name].success++;
      } else {
        acc[log.provider_name].errors++;
      }
      
      return acc;
    }, {});
  }
}