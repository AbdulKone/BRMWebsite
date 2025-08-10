import { supabase } from './supabase';

export class ProspectAnalytics {
  static async trackApiUsage(provider: string, endpoint: string, success: boolean, error?: string) {
    await supabase.from('api_usage_logs').insert({
      provider_name: provider,
      endpoint,
      success,
      error_message: error || null
    });
  }

  static async getUsageStats(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data } = await supabase
      .from('api_usage_logs')
      .select('*')
      .gte('created_at', startDate);
    
    return {
      totalRequests: data?.length || 0,
      successRate: data ? (data.filter((d: any) => d.success).length / data.length) * 100 : 0,
      byProvider: this.groupByProvider(data || [])
    };
  }

  private static groupByProvider(logs: any[]) {
    return logs.reduce((acc: any, log: any) => {
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