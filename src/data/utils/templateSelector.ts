import { EmailTemplate } from '../types/emailTypes';
import { calculatePerformanceScore, getTemplatesBySegment } from './templateUtils';

/**
 * Sélectionne la meilleure variante d'un template pour A/B testing
 */
export const selectOptimalTemplateVariant = (
  templates: EmailTemplate[], 
  baseTemplateId: string
): EmailTemplate | undefined => {
  const variants = templates.filter(template => 
    template.id.startsWith(baseTemplateId) && template.is_active // Fixed: isActive -> is_active
  );
  
  if (variants.length === 0) return undefined;
  if (variants.length === 1) return variants[0];
  
  return variants.reduce((best, current) => {
    const bestScore = calculatePerformanceScore(best.performance_metrics);
    const currentScore = calculatePerformanceScore(current.performance_metrics);
    return currentScore > bestScore ? current : best;
  });
};

/**
 * Récupère les templates recommandés pour un segment spécifique
 */
export const getRecommendedTemplates = (
  templates: EmailTemplate[],
  segment: string, 
  category?: EmailTemplate['category']
): EmailTemplate[] => {
  let segmentTemplates = getTemplatesBySegment(templates, segment);
  
  if (category) {
    segmentTemplates = segmentTemplates.filter(template => template.category === category);
  }
  
  return segmentTemplates.sort((a, b) => {
    const scoreA = calculatePerformanceScore(a.performance_metrics);
    const scoreB = calculatePerformanceScore(b.performance_metrics);
    
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

/**
 * Récupère une séquence de follow-up basée sur un template initial
 */
export const getFollowUpSequence = (
  templates: EmailTemplate[],
  initialTemplateId: string
): EmailTemplate[] => {
  // Logique pour déterminer la séquence de follow-up
  const sequenceIds = [
    `${initialTemplateId}_followup_1`,
    `${initialTemplateId}_followup_2`,
    `${initialTemplateId}_followup_3`
  ];
  
  return getTemplatesByIds(templates, sequenceIds);
};

export const getTemplateVariants = (templates: EmailTemplate[], baseTemplateId: string): EmailTemplate[] => {
  return templates.filter(template => 
    template.template_key.startsWith(baseTemplateId) && template.is_active
  );
};

const getTemplatesByIds = (templates: EmailTemplate[], templateIds: string[]): EmailTemplate[] => {
  return templateIds.map(id => templates.find(t => t.template_key === id && t.is_active)).filter(Boolean) as EmailTemplate[];
};