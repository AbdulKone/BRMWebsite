import { EmailTemplate, PerformanceMetrics } from '../types/emailTypes';
import { calculatePerformanceScore } from './templateUtils';

/**
 * Met à jour les métriques de performance d'un template
 */
export const updateTemplatePerformance = (
  templates: EmailTemplate[],
  templateId: string, 
  metrics: Partial<PerformanceMetrics>
): boolean => {
  const templateIndex = templates.findIndex(template => template.id === templateId);
  
  if (templateIndex === -1) return false;
  
  templates[templateIndex].performance_metrics = {
    ...templates[templateIndex].performance_metrics,
    ...metrics,
    last_updated: new Date().toISOString()
  } as PerformanceMetrics;
  
  return true;
};

/**
 * Analyse les performances globales des templates
 */
export const analyzeTemplatePerformance = (
  templates: EmailTemplate[]
): {
  bestPerforming: EmailTemplate[];
  worstPerforming: EmailTemplate[];
  averageMetrics: PerformanceMetrics;
} => {
  const activeTemplates = templates.filter(t => t.isActive && t.performance_metrics);
  
  if (activeTemplates.length === 0) {
    return {
      bestPerforming: [],
      worstPerforming: [],
      averageMetrics: {
        open_rate: 0,
        click_rate: 0,
        response_rate: 0,
        conversion_rate: 0,
        last_updated: new Date().toISOString()
      }
    };
  }
  
  const sortedByPerformance = activeTemplates.sort((a, b) => {
    const scoreA = calculatePerformanceScore(a.performance_metrics);
    const scoreB = calculatePerformanceScore(b.performance_metrics);
    return scoreB - scoreA;
  });
  
  const totalMetrics = activeTemplates.reduce(
    (acc, template) => {
      const metrics = template.performance_metrics!;
      return {
        open_rate: acc.open_rate + metrics.open_rate,
        click_rate: acc.click_rate + metrics.click_rate,
        response_rate: acc.response_rate + metrics.response_rate,
        conversion_rate: acc.conversion_rate + metrics.conversion_rate
      };
    },
    { open_rate: 0, click_rate: 0, response_rate: 0, conversion_rate: 0 }
  );
  
  const count = activeTemplates.length;
  
  return {
    bestPerforming: sortedByPerformance.slice(0, 3),
    worstPerforming: sortedByPerformance.slice(-3).reverse(),
    averageMetrics: {
      open_rate: totalMetrics.open_rate / count,
      click_rate: totalMetrics.click_rate / count,
      response_rate: totalMetrics.response_rate / count,
      conversion_rate: totalMetrics.conversion_rate / count,
      last_updated: new Date().toISOString()
    }
  };
};