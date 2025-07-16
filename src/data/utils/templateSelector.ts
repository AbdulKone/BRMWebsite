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
    template.id.startsWith(baseTemplateId) && template.isActive
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
 * Récupère la séquence de follow-up pour un template donné
 */
export const getFollowUpSequence = (
  templates: EmailTemplate[],
  initialTemplateId: string
): EmailTemplate[] => {
  const sequences: Record<string, string[]> = {
    'visual_intro_advertising': ['advanced_follow_up_sequence_1', 'advanced_follow_up_sequence_2'],
    'music_video_intro': ['personalized_follow_up', 'detailed_video_proposal'],
    'luxury_advertising_intro': ['personalized_follow_up', 'detailed_video_proposal'],
    'sports_advertising_intro': ['personalized_follow_up', 'detailed_video_proposal'],
    'wedding_videography_intro': ['personalized_follow_up', 'detailed_video_proposal']
  };
  
  const sequenceIds = sequences[initialTemplateId] || [];
  return sequenceIds
    .map(id => templates.find(template => template.id === id && template.is_active)) // Changed from isActive
    .filter((template): template is EmailTemplate => template !== undefined);
};

export const getTemplateVariants = (templates: EmailTemplate[], baseTemplateId: string): EmailTemplate[] => {
  return templates.filter(template => 
    template.id.startsWith(baseTemplateId) && template.is_active // Changed from isActive
  );
};

const getTemplatesByIds = (templates: EmailTemplate[], templateIds: string[]): EmailTemplate[] => {
  return templateIds
    .map(id => templates.find(template => template.id === id && template.is_active)) // Changed from isActive
    .filter((template): template is EmailTemplate => template !== undefined);
};