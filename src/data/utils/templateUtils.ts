import { EmailTemplate, PerformanceMetrics } from '../types/emailTypes';
import { PERFORMANCE_WEIGHTS } from '../constants/emailConstants';

/**
 * Récupère un template actif par son ID
 */
export const getTemplate = (templates: EmailTemplate[], id: string): EmailTemplate | undefined => {
  return templates.find(template => template.id === id && template.isActive);
};

/**
 * Récupère tous les templates d'une catégorie donnée
 */
export const getTemplatesByCategory = (
  templates: EmailTemplate[], 
  category: EmailTemplate['category']
): EmailTemplate[] => {
  return templates.filter(template => 
    template.category === category && template.isActive
  );
};

/**
 * Récupère les templates par niveau de priorité
 */
export const getTemplatesByPriority = (
  templates: EmailTemplate[], 
  priority: EmailTemplate['priority']
): EmailTemplate[] => {
  return templates.filter(template => 
    template.priority === priority && template.isActive
  );
};

/**
 * Récupère les templates par segment de marché
 */
export const getTemplatesBySegment = (
  templates: EmailTemplate[], 
  segment: string
): EmailTemplate[] => {
  return templates.filter(template => 
    template.isActive && 
    (template.segment_targeting?.includes(segment) || !template.segment_targeting)
  );
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
 * Trouve le template le plus performant d'une catégorie
 */
export const getBestPerformingTemplate = (
  templates: EmailTemplate[], 
  category: EmailTemplate['category']
): EmailTemplate | undefined => {
  const categoryTemplates = getTemplatesByCategory(templates, category);
  if (categoryTemplates.length === 0) return undefined;
  
  return categoryTemplates.reduce((best, current) => {
    const bestScore = calculatePerformanceScore(best.performance_metrics);
    const currentScore = calculatePerformanceScore(current.performance_metrics);
    return currentScore > bestScore ? current : best;
  });
};