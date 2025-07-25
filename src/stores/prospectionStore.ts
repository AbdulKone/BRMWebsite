import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Interfaces avancées pour la segmentation et le scoring
export interface ProspectSegment {
  id: string;
  name: string;
  criteria: {
    industry?: string[];
    company_size?: string;
    budget_range?: string;
    project_type?: string[];
    urgency_level?: 'low' | 'medium' | 'high';
  };
  email_frequency: number; // jours entre emails
  conversion_rate: number;
}

// Interface pour le score détaillé (calculs internes)
export interface DetailedLeadScore {
  total: number;
  factors: {
    engagement: number;
    company_fit: number;
    budget_potential: number;
    urgency: number;
    response_history: number;
  };
  last_calculated: string;
}

export interface EnrichedData {
  company_info?: {
    size: string;
    industry: string;
    revenue?: string;
    website?: string;
    social_media?: {
      linkedin?: string;
      instagram?: string;
      facebook?: string;
    };
  };
  contact_info?: {
    role: string;
    seniority_level: string;
    decision_maker: boolean;
  };
  project_history?: {
    previous_projects: number;
    avg_budget: number;
    preferred_style: string[];
  };
}

// Interface Prospect alignée avec la base de données
export interface Prospect {
  id: string;
  company_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  position?: string;
  website?: string;
  linkedin_url?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost';
  created_at: string;
  updated_at: string;
  last_contact_date?: string;
  last_email_sent?: string;
  engagement_score?: number;
  tags?: string[];
  source?: string;
  segment_targeting?: string[];
  next_follow_up?: string;
  lead_score?: number;
  conversion_probability?: number;
  enriched_data?: EnrichedData;
}

// Interface pour les prospects avec score détaillé
export interface ProspectWithDetailedScore extends Prospect {
  detailed_lead_score: DetailedLeadScore;
}

interface ProspectionState {
  prospects: Prospect[];
  segments: ProspectSegment[];
  metrics: {
    total_prospects: number;
    conversion_rate: number;
    avg_response_time: number;
    pipeline_value: number;
    monthly_growth: number;
  };
  loading: boolean;
  error: string | null;
}

interface ProspectionActions {
  // Actions CRUD de base
  loadProspects: () => Promise<void>;
  saveProspect: (prospect: Partial<Prospect>) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  
  // Actions avancées
  calculateDetailedLeadScore: (prospectId: string) => Promise<DetailedLeadScore>;
  updateProspectSegment: (prospectId: string, segmentId: string) => Promise<void>;
  scheduleFollowUp: (prospectId: string, date: string, type: string) => Promise<void>;
  getProspectsBySegment: (segmentId: string) => Prospect[];
  getHighValueProspects: (threshold?: number) => Prospect[];
  loadMetrics: () => Promise<void>;
  enrichProspectData: (prospectId: string) => Promise<EnrichedData>;
  bulkUpdateStatus: (prospectIds: string[], status: Prospect['status']) => Promise<void>;
  getOptimalContactTime: (prospectId: string) => Promise<string>;
  trackEmailEngagement: (prospectId: string, action: 'open' | 'click' | 'reply') => Promise<void>;
}

// Constantes pour les segments par défaut
const DEFAULT_SEGMENTS: ProspectSegment[] = [
  {
    id: 'enterprise',
    name: 'Grandes Entreprises',
    criteria: {
      company_size: 'large',
      budget_range: 'high',
      project_type: ['commercial', 'corporate']
    },
    email_frequency: 7,
    conversion_rate: 0.15
  },
  {
    id: 'startups',
    name: 'Startups & PME',
    criteria: {
      company_size: 'small',
      budget_range: 'medium',
      urgency_level: 'high'
    },
    email_frequency: 3,
    conversion_rate: 0.25
  },
  {
    id: 'creative_agencies',
    name: 'Agences Créatives',
    criteria: {
      industry: ['advertising', 'marketing', 'design'],
      project_type: ['creative', 'artistic']
    },
    email_frequency: 5,
    conversion_rate: 0.30
  }
];

// Constantes pour le scoring
const ENGAGEMENT_BOOST = {
  open: 1,
  click: 3,
  reply: 5
} as const;

export const useProspectionStore = create<ProspectionState & ProspectionActions>((set, get) => ({
  prospects: [],
  segments: DEFAULT_SEGMENTS,
  metrics: {
    total_prospects: 0,
    conversion_rate: 0,
    avg_response_time: 0,
    pipeline_value: 0,
    monthly_growth: 0
  },
  loading: false,
  error: null,

  loadProspects: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ prospects: data || [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Fonction unifiée pour créer et mettre à jour
  saveProspect: async (prospect: Partial<Prospect>) => {
    try {
      const now = new Date().toISOString();
      const prospectData = prospect.id 
        ? { ...prospect, updated_at: now }
        : { ...prospect, created_at: now, updated_at: now };

      const { data, error } = prospect.id 
        ? await supabase.from('prospects').update(prospectData).eq('id', prospect.id).select().single()
        : await supabase.from('prospects').insert([prospectData]).select().single();
      
      if (error) throw error;
      
      set(state => ({
        prospects: prospect.id 
          ? state.prospects.map(p => p.id === prospect.id ? data : p)
          : [data, ...state.prospects]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteProspect: async (id: string) => {
    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      set(state => ({
        prospects: state.prospects.filter(p => p.id !== id)
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  calculateDetailedLeadScore: async (prospectId: string): Promise<DetailedLeadScore> => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    if (!prospect) throw new Error('Prospect non trouvé');

    const factors = {
      engagement: (prospect.engagement_score || 0) * 2,
      company_fit: prospect.enriched_data?.company_info?.size === 'large' ? 30 : 15,
      budget_potential: (prospect.enriched_data?.project_history?.avg_budget || 0) > 10000 ? 25 : 10,
      urgency: 15,
      response_history: (prospect.engagement_score || 0) * 0.5
    };

    const total = Object.values(factors).reduce((sum, score) => sum + score, 0);
    
    const detailedScore: DetailedLeadScore = {
      total,
      factors,
      last_calculated: new Date().toISOString()
    };

    await get().saveProspect({ id: prospectId, lead_score: total });
    
    return detailedScore;
  },

  updateProspectSegment: async (prospectId: string, segmentId: string) => {
    await get().saveProspect({ id: prospectId, segment_targeting: [segmentId] });
  },

  scheduleFollowUp: async (prospectId: string, date: string, type: string) => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    await get().saveProspect({ 
      id: prospectId,
      next_follow_up: date,
      notes: `${prospect?.notes || ''} [Follow-up ${type} prévu le ${date}]`
    });
  },

  getProspectsBySegment: (segmentId: string) => {
    return get().prospects.filter(p => 
      p.segment_targeting?.includes(segmentId)
    );
  },

  getHighValueProspects: (threshold = 70) => {
    return get().prospects.filter(p => (p.lead_score || 0) >= threshold);
  },

  loadMetrics: async () => {
    try {
      const prospects = get().prospects;
      const totalProspects = prospects.length;
      const wonProspects = prospects.filter(p => p.status === 'closed_won').length;
      const conversionRate = totalProspects > 0 ? wonProspects / totalProspects : 0;
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const recentProspects = prospects.filter(p => new Date(p.created_at) > lastMonth).length;
      const monthlyGrowth = totalProspects > 0 ? recentProspects / totalProspects : 0;

      set({
        metrics: {
          total_prospects: totalProspects,
          conversion_rate: conversionRate,
          avg_response_time: 24,
          pipeline_value: prospects.length * 5000,
          monthly_growth: monthlyGrowth
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  enrichProspectData: async (prospectId: string): Promise<EnrichedData> => {
    const enrichedData: EnrichedData = {
      company_info: {
        size: 'medium',
        industry: 'technology',
        website: 'https://example.com'
      },
      contact_info: {
        role: 'Marketing Director',
        seniority_level: 'senior',
        decision_maker: true
      }
    };

    await get().saveProspect({ id: prospectId, enriched_data: enrichedData });
    return enrichedData;
  },

  bulkUpdateStatus: async (prospectIds: string[], status: Prospect['status']) => {
    try {
      const { error } = await supabase
        .from('prospects')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', prospectIds);

      if (error) throw error;
      
      set(state => ({
        prospects: state.prospects.map(p => 
          prospectIds.includes(p.id) ? { ...p, status } : p
        )
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  getOptimalContactTime: async (prospectId: string): Promise<string> => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    
    if (prospect?.segment_targeting?.includes('enterprise')) {
      return '09:00';
    } else if (prospect?.segment_targeting?.includes('startups')) {
      return '14:00';
    }
    return '10:00';
  },

  trackEmailEngagement: async (prospectId: string, action: 'open' | 'click' | 'reply') => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    const engagementBoost = ENGAGEMENT_BOOST[action];
    const newEngagementScore = (prospect.engagement_score || 0) + engagementBoost;

    await get().saveProspect({ 
      id: prospectId, 
      engagement_score: newEngagementScore 
    });
  }
}));