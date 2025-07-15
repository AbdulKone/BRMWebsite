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

export interface LeadScore {
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

export interface Prospect {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'interested' | 'proposal_sent' | 'negotiating' | 'won' | 'lost' | 'nurturing';
  last_contact?: string;
  created_at: string;
  updated_at: string;
  
  // Nouvelles propriétés avancées
  segment?: string;
  lead_score?: LeadScore;
  enriched_data?: EnrichedData;
  next_follow_up?: string;
  email_sequence_step?: number;
  conversion_probability?: number;
  source?: 'website' | 'referral' | 'cold_outreach' | 'social_media' | 'event' | 'partnership';
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  last_email_sent?: string;
  email_opens?: number;
  email_clicks?: number;
  response_rate?: number;
}

export interface EnrichedProspect extends Prospect {
  enriched_data: EnrichedData;
  lead_score: LeadScore;
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
  // Actions existantes
  loadProspects: () => Promise<void>;
  addProspect: (prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProspect: (id: string, updates: Partial<Prospect>) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  
  // Nouvelles actions avancées
  calculateLeadScore: (prospectId: string) => Promise<LeadScore>;
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

export const useProspectionStore = create<ProspectionState & ProspectionActions>((set, get) => ({
  prospects: [],
  segments: [
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
  ],
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

  addProspect: async (prospect) => {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .insert([{
          ...prospect,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({
        prospects: [data, ...state.prospects]
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateProspect: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({
        prospects: state.prospects.map(p => p.id === id ? data : p)
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteProspect: async (id) => {
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

  // Nouvelles actions avancées
  calculateLeadScore: async (prospectId: string): Promise<LeadScore> => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    if (!prospect) throw new Error('Prospect non trouvé');

    // Algorithme de scoring basé sur plusieurs facteurs
    const factors = {
      engagement: (prospect.email_opens || 0) * 10 + (prospect.email_clicks || 0) * 20,
      company_fit: prospect.enriched_data?.company_info?.size === 'large' ? 30 : 15,
      budget_potential: prospect.enriched_data?.project_history?.avg_budget || 0 > 10000 ? 25 : 10,
      urgency: prospect.priority === 'urgent' ? 20 : prospect.priority === 'high' ? 15 : 5,
      response_history: (prospect.response_rate || 0) * 100
    };

    const total = Object.values(factors).reduce((sum, score) => sum + score, 0);
    
    const leadScore: LeadScore = {
      total,
      factors,
      last_calculated: new Date().toISOString()
    };

    // Mettre à jour le prospect avec le nouveau score
    await get().updateProspect(prospectId, { lead_score: leadScore });
    
    return leadScore;
  },

  updateProspectSegment: async (prospectId: string, segmentId: string) => {
    await get().updateProspect(prospectId, { segment: segmentId });
  },

  scheduleFollowUp: async (prospectId: string, date: string, type: string) => {
    await get().updateProspect(prospectId, { 
      next_follow_up: date,
      notes: `${get().prospects.find(p => p.id === prospectId)?.notes || ''} [Follow-up ${type} prévu le ${date}]`
    });
  },

  getProspectsBySegment: (segmentId: string) => {
    return get().prospects.filter(p => p.segment === segmentId);
  },

  getHighValueProspects: (threshold = 70) => {
    return get().prospects.filter(p => (p.lead_score?.total || 0) >= threshold);
  },

  loadMetrics: async () => {
    try {
      const prospects = get().prospects;
      const totalProspects = prospects.length;
      const wonProspects = prospects.filter(p => p.status === 'won').length;
      const conversionRate = totalProspects > 0 ? wonProspects / totalProspects : 0;
      
      // Calcul de la croissance mensuelle
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const recentProspects = prospects.filter(p => new Date(p.created_at) > lastMonth).length;
      const monthlyGrowth = recentProspects / totalProspects;

      set({
        metrics: {
          total_prospects: totalProspects,
          conversion_rate: conversionRate,
          avg_response_time: 24, // À calculer avec les données réelles
          pipeline_value: prospects.length * 5000, // Estimation
          monthly_growth: monthlyGrowth
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  enrichProspectData: async (prospectId: string): Promise<EnrichedData> => {
    // Simulation d'enrichissement de données
    // En production, ceci ferait appel à des APIs externes
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

    await get().updateProspect(prospectId, { enriched_data: enrichedData });
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
    // Analyse des données d'engagement pour déterminer le meilleur moment
    // En production, ceci analyserait l'historique des ouvertures d'emails
    const prospect = get().prospects.find(p => p.id === prospectId);
    
    // Logique simplifiée basée sur le segment
    if (prospect?.segment === 'enterprise') {
      return '09:00'; // Entreprises : matin
    } else if (prospect?.segment === 'startups') {
      return '14:00'; // Startups : après-midi
    }
    return '10:00'; // Par défaut
  },

  trackEmailEngagement: async (prospectId: string, action: 'open' | 'click' | 'reply') => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    const updates: Partial<Prospect> = {};
    
    if (action === 'open') {
      updates.email_opens = (prospect.email_opens || 0) + 1;
    } else if (action === 'click') {
      updates.email_clicks = (prospect.email_clicks || 0) + 1;
    }

    await get().updateProspect(prospectId, updates);
  }
}));