import { supabase } from '../lib/supabase';

export interface AnalyticsMetrics {
  totalProspects: number;
  conversionRate: number;
  averageResponseTime: number;
  topPerformingTemplates: Array<{
    templateId: string;
    templateName: string;
    openRate: number;
    responseRate: number;
    conversionRate: number;
  }>;
  segmentPerformance: Array<{
    segment: string;
    prospects: number;
    conversionRate: number;
    averageScore: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    newProspects: number;
    conversions: number;
    revenue: number;
  }>;
  churnRisk: Array<{
    prospectId: string;
    companyName: string;
    riskScore: number;
    lastContact: string;
  }>;
}

export class ProspectionAnalytics {
  static async getConversionRatesBySegment(): Promise<Array<{
    segment: string;
    totalProspects: number;
    conversions: number;
    conversionRate: number;
  }>> {
    const { data, error } = await supabase
      .from('prospects')
      .select('segment, status')
      .not('segment', 'is', null);

    if (error) throw error;

    const segmentStats = data?.reduce((acc, prospect) => {
      const segment = prospect.segment || 'unknown';
      if (!acc[segment]) {
        acc[segment] = { total: 0, conversions: 0 };
      }
      acc[segment].total++;
      if (prospect.status === 'converted' || prospect.status === 'client') {
        acc[segment].conversions++;
      }
      return acc;
    }, {} as Record<string, { total: number; conversions: number }>);

    return Object.entries(segmentStats || {}).map(([segment, stats]) => ({
      segment,
      totalProspects: stats.total,
      conversions: stats.conversions,
      conversionRate: stats.total > 0 ? (stats.conversions / stats.total) * 100 : 0
    }));
  }

  static async getBestPerformingTemplates(): Promise<Array<{
    templateId: string;
    templateName: string;
    sentCount: number;
    openRate: number;
    responseRate: number;
  }>> {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('template_id, status, opened_at, responded_at')
      .not('template_id', 'is', null);

    if (error) throw error;

    const templateStats = data?.reduce((acc, email) => {
      const templateId = email.template_id;
      if (!acc[templateId]) {
        acc[templateId] = {
          sent: 0,
          opened: 0,
          responded: 0
        };
      }
      acc[templateId].sent++;
      if (email.opened_at) acc[templateId].opened++;
      if (email.responded_at) acc[templateId].responded++;
      return acc;
    }, {} as Record<string, { sent: number; opened: number; responded: number }>);

    return Object.entries(templateStats || {}).map(([templateId, stats]) => ({
      templateId,
      templateName: `Template ${templateId}`,
      sentCount: stats.sent,
      openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
      responseRate: stats.sent > 0 ? (stats.responded / stats.sent) * 100 : 0
    }));
  }

  static async getOptimalSendTimes(): Promise<Array<{
    hour: number;
    dayOfWeek: number;
    openRate: number;
    responseRate: number;
  }>> {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('sent_at, opened_at, responded_at')
      .not('sent_at', 'is', null);

    if (error) throw error;

    const timeStats = data?.reduce((acc, email) => {
      const sentDate = new Date(email.sent_at);
      const hour = sentDate.getHours();
      const dayOfWeek = sentDate.getDay();
      const key = `${hour}-${dayOfWeek}`;
      
      if (!acc[key]) {
        acc[key] = {
          hour,
          dayOfWeek,
          sent: 0,
          opened: 0,
          responded: 0
        };
      }
      
      acc[key].sent++;
      if (email.opened_at) acc[key].opened++;
      if (email.responded_at) acc[key].responded++;
      
      return acc;
    }, {} as Record<string, { hour: number; dayOfWeek: number; sent: number; opened: number; responded: number }>);

    return Object.values(timeStats || {}).map(stats => ({
      hour: stats.hour,
      dayOfWeek: stats.dayOfWeek,
      openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
      responseRate: stats.sent > 0 ? (stats.responded / stats.sent) * 100 : 0
    }));
  }

  static async identifyChurnRiskProspects(): Promise<Array<{
    prospectId: string;
    companyName: string;
    contactName: string;
    riskScore: number;
    lastContact: string;
    daysSinceContact: number;
  }>> {
    const { data, error } = await supabase
      .from('prospects')
      .select('id, company_name, contact_name, last_contact, status')
      .in('status', ['interested', 'contacted', 'warm_lead']);

    if (error) throw error;

    const now = new Date();
    
    return (data || []).map(prospect => {
      const lastContactDate = new Date(prospect.last_contact);
      const daysSinceContact = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calcul du score de risque (0-100)
      let riskScore = 0;
      if (daysSinceContact > 30) riskScore += 40;
      if (daysSinceContact > 60) riskScore += 30;
      if (daysSinceContact > 90) riskScore += 30;
      if (prospect.status === 'interested' && daysSinceContact > 14) riskScore += 20;
      
      return {
        prospectId: prospect.id,
        companyName: prospect.company_name,
        contactName: prospect.contact_name,
        riskScore: Math.min(riskScore, 100),
        lastContact: prospect.last_contact,
        daysSinceContact
      };
    }).filter(prospect => prospect.riskScore > 50)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  static async generateInsights(): Promise<{
    insights: string[];
    recommendations: string[];
    alerts: string[];
  }> {
    const [conversionRates, templates, churnRisk] = await Promise.all([
      this.getConversionRatesBySegment(),
      this.getBestPerformingTemplates(),
      this.identifyChurnRiskProspects()
    ]);

    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Analyse des taux de conversion
    const bestSegment = conversionRates.sort((a, b) => b.conversionRate - a.conversionRate)[0];
    if (bestSegment) {
      insights.push(`Le segment "${bestSegment.segment}" a le meilleur taux de conversion (${bestSegment.conversionRate.toFixed(1)}%)`);
    }

    // Analyse des templates
    const bestTemplate = templates.sort((a, b) => b.responseRate - a.responseRate)[0];
    if (bestTemplate) {
      insights.push(`Le template "${bestTemplate.templateName}" a le meilleur taux de réponse (${bestTemplate.responseRate.toFixed(1)}%)`);
      recommendations.push(`Utilisez plus souvent le template "${bestTemplate.templateName}" pour améliorer vos résultats`);
    }

    // Alertes de churn
    if (churnRisk.length > 0) {
      alerts.push(`${churnRisk.length} prospects à risque de désengagement détectés`);
      recommendations.push('Relancez les prospects à risque avec du contenu de valeur');
    }

    // Recommandations générales
    const lowPerformingSegments = conversionRates.filter(s => s.conversionRate < 5);
    if (lowPerformingSegments.length > 0) {
      recommendations.push('Revoyez votre approche pour les segments à faible conversion');
    }

    return { insights, recommendations, alerts };
  }
}