import { EmailTemplate, PerformanceMetrics, TemplatePriority } from '../types/emailTypes';
import { PERFORMANCE_WEIGHTS } from '../constants/emailConstants';

/**
 * Récupère un template actif par son ID
 */
export const getTemplateById = (templates: EmailTemplate[], id: string): EmailTemplate | undefined => {
  return templates.find(template => template.id === id && template.is_active);
};

/**
 * Filtre les templates selon plusieurs critères
 */
export const getTemplatesByFilter = (
  templates: EmailTemplate[],
  filter: { 
    category?: string; 
    priority?: TemplatePriority; 
    segment?: string;
    withMetrics?: boolean;
  } = {}
): EmailTemplate[] => {
  return templates.filter(template => {
    if (!template.is_active) return false;
    if (filter.category && template.category !== filter.category) return false;
    if (filter.priority && template.priority !== filter.priority) return false;
    if (filter.segment && !template.segment_targeting?.includes(filter.segment)) return false;
    if (filter.withMetrics && (!template.performance_metrics || template.performance_metrics.open_rate <= 0)) return false;
    return true;
  });
};

/**
 * Récupère tous les templates actifs avec métriques
 */
export const getActiveTemplates = (templates: EmailTemplate[]): EmailTemplate[] => {
  return getTemplatesByFilter(templates, { withMetrics: true });
};

/**
 * Calcule un score de performance basé sur les métriques
 */
export const calculatePerformanceScore = (metrics?: PerformanceMetrics): number => {
  if (!metrics) return 0;
  
  return (
    metrics.response_rate * PERFORMANCE_WEIGHTS.RESPONSE_RATE +
    metrics.conversion_rate * PERFORMANCE_WEIGHTS.CONVERSION_RATE +
    metrics.open_rate * PERFORMANCE_WEIGHTS.OPEN_RATE +
    metrics.click_rate * PERFORMANCE_WEIGHTS.CLICK_RATE
  );
};

/**
 * Trouve le template le plus performant selon les critères donnés
 */
export const getBestPerformingTemplate = (
  templates: EmailTemplate[], 
  filter: { category?: string; priority?: TemplatePriority; segment?: string } = {}
): EmailTemplate | undefined => {
  const filteredTemplates = getTemplatesByFilter(templates, { ...filter, withMetrics: true });
  if (filteredTemplates.length === 0) return undefined;
  
  return filteredTemplates.reduce((best, current) => {
    const bestScore = calculatePerformanceScore(best.performance_metrics);
    const currentScore = calculatePerformanceScore(current.performance_metrics);
    return currentScore > bestScore ? current : best;
  });
};

/**
 * Trie les templates par score de performance (décroissant)
 */
export const sortTemplatesByPerformance = (templates: EmailTemplate[]): EmailTemplate[] => {
  return [...templates].sort((a, b) => {
    const scoreA = calculatePerformanceScore(a.performance_metrics);
    const scoreB = calculatePerformanceScore(b.performance_metrics);
    return scoreB - scoreA;
  });
};

/**
 * Récupère les N meilleurs templates d'une catégorie
 */
export const getTopTemplates = (
  templates: EmailTemplate[],
  count: number = 5,
  filter: { category?: string; priority?: TemplatePriority; segment?: string } = {}
): EmailTemplate[] => {
  const filteredTemplates = getTemplatesByFilter(templates, { ...filter, withMetrics: true });
  const sortedTemplates = sortTemplatesByPerformance(filteredTemplates);
  return sortedTemplates.slice(0, count);
};