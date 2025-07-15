export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'introduction' | 'follow_up' | 'proposal' | 'nurturing' | 'closing' | 'reactivation';
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
  segment_targeting?: string[];
  ab_test_variant?: 'A' | 'B' | 'C';
  performance_metrics?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  open_rate: number;
  click_rate: number;
  response_rate: number;
  conversion_rate: number;
  last_updated: string;
}

export type TemplateCategory = EmailTemplate['category'];
export type TemplatePriority = EmailTemplate['priority'];
export type TemplateVariant = EmailTemplate['ab_test_variant'];