export interface EmailTemplate {
  id: string; // UUID from database
  template_key: string; // For code references like 'visual_intro_advertising'
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  priority: 'low' | 'medium' | 'high';
  segment_targeting: string[];
  ab_test_variant: 'A' | 'B';
  performance_metrics: PerformanceMetrics;
  created_at?: string;
  updated_at?: string;
}

export interface PerformanceMetrics {
  open_rate: number;
  click_rate: number;
  response_rate: number;
  conversion_rate: number;
  last_updated: string;
}

// Add the missing TemplateAnalysis interface
export interface TemplateAnalysis {
  bestPerforming: EmailTemplate[];
  worstPerforming: EmailTemplate[];
  averageMetrics: PerformanceMetrics;
}

export type TemplateCategory = EmailTemplate['category'];
export type TemplatePriority = EmailTemplate['priority'];
export type TemplateVariant = EmailTemplate['ab_test_variant'];