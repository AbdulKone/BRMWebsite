import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useErrorStore, errorUtils } from './errorStore';

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
    location?: string;
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
    segment_breakdown?: {
      advertising: number;
      music: number;
      luxury: number;
      sports: number;
    };
    qualified_prospects?: number;
  };
  loading: boolean;
  // Suppression de: error: string | null;
}

// Ajouter ces nouvelles actions au store existant

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
  
  // Nouvelles actions pour l'import automatisé - SIGNATURE SEULEMENT
  importProspectsFromApi: (criteria: any) => Promise<any[]>;
  validateProspectData: (prospect: any) => boolean;
  getApiUsageStats: () => Promise<any>;
  scheduleAutoImport: (criteria: any, frequency: string) => Promise<void>;
}

// Constantes manquantes
const DEFAULT_SEGMENTS: ProspectSegment[] = [
  {
    id: 'music',
    name: 'Industrie Musicale',
    criteria: {
      industry: ['music', 'entertainment'],
      project_type: ['album_cover', 'music_video', 'concert_poster']
    },
    email_frequency: 7,
    conversion_rate: 0.15
  },
  {
    id: 'advertising',
    name: 'Publicité & Marketing',
    criteria: {
      industry: ['advertising', 'marketing'],
      project_type: ['campaign', 'branding', 'social_media']
    },
    email_frequency: 5,
    conversion_rate: 0.20
  },
  {
    id: 'luxury',
    name: 'Marques de Luxe',
    criteria: {
      industry: ['luxury', 'fashion'],
      budget_range: 'high',
      project_type: ['product_photography', 'brand_identity']
    },
    email_frequency: 10,
    conversion_rate: 0.25
  },
  {
    id: 'sports',
    name: 'Sport & Fitness',
    criteria: {
      industry: ['sports', 'fitness'],
      project_type: ['event_coverage', 'athlete_portraits']
    },
    email_frequency: 7,
    conversion_rate: 0.18
  }
];

const ENGAGEMENT_BOOST = {
  open: 5,
  click: 10,
  reply: 20
};

// Dans l'implémentation du store
const useProspectionStore = create<ProspectionState & ProspectionActions>((set, get) => ({
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
  // Suppression de: error: null,

  loadProspects: async () => {
    set({ loading: true }); // Suppression de: error: null
    
    await errorUtils.withErrorHandling(
      async () => {
        const { data, error } = await supabase
          .from('prospects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        set({ prospects: data || [], loading: false });
      },
      'Erreur lors du chargement des prospects'
    );
    
    set({ loading: false });
  },

  saveProspect: async (prospect: Partial<Prospect>) => {
    await errorUtils.withErrorHandling(
      async () => {
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
        
        useErrorStore.getState().handleSuccess(
          prospect.id ? 'Prospect mis à jour' : 'Prospect créé'
        );
      },
      prospect.id ? 'Erreur lors de la mise à jour du prospect' : 'Erreur lors de la création du prospect'
    );
  },

  deleteProspect: async (id: string) => {
    await errorUtils.withErrorHandling(
      async () => {
        const { error } = await supabase
          .from('prospects')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        set(state => ({
          prospects: state.prospects.filter(p => p.id !== id)
        }));
        
        useErrorStore.getState().handleSuccess('Prospect supprimé avec succès');
      },
      'Erreur lors de la suppression du prospect'
    );
  },

  calculateDetailedLeadScore: async (prospectId: string): Promise<DetailedLeadScore> => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    if (!prospect) throw new Error('Prospect non trouvé');

    const factors = {
      engagement: (prospect.engagement_score || 0) * 2,
      company_fit: prospect.segment_targeting?.length ? 20 : 5,
      budget_potential: prospect.enriched_data?.company_info?.size === 'large' ? 25 : 10,
      urgency: prospect.status === 'interested' ? 20 : 10,
      response_history: prospect.last_contact_date ? 15 : 0
    };

    const total = Object.values(factors).reduce((sum, score) => sum + score, 0);

    const detailedScore: DetailedLeadScore = {
      total: Math.min(total, 100),
      factors,
      last_calculated: new Date().toISOString()
    };

    // Mettre à jour le prospect avec le nouveau score
    await get().saveProspect({ 
      id: prospectId, 
      lead_score: detailedScore.total 
    });

    return detailedScore;
  },

  updateProspectSegment: async (prospectId: string, segmentId: string) => {
    const segment = get().segments.find(s => s.id === segmentId);
    if (!segment) throw new Error('Segment non trouvé');

    await get().saveProspect({ 
      id: prospectId, 
      segment_targeting: [segmentId] 
    });
  },

  scheduleFollowUp: async (prospectId: string, date: string, type: string) => {
    await get().saveProspect({ 
      id: prospectId, 
      next_follow_up: date,
      notes: `Suivi programmé: ${type} le ${new Date(date).toLocaleDateString('fr-FR')}`
    });
  },

  getProspectsBySegment: (segmentId: string) => {
    return get().prospects.filter(p => 
      p.segment_targeting?.includes(segmentId)
    );
  },

  getHighValueProspects: (threshold: number = 70) => {
    return get().prospects.filter(p => 
      (p.lead_score || 0) >= threshold
    );
  },

  loadMetrics: async () => {
    await errorUtils.withErrorHandling(
      async () => {
        const prospects = get().prospects;
        
        // Calculs dynamiques basés sur les données réelles
        const totalProspects = prospects.length;
        const qualifiedProspects = prospects.filter(p => (p.lead_score || 0) >= 60).length;
        const wonProspects = prospects.filter(p => p.status === 'closed_won').length;
        const conversionRate = totalProspects > 0 ? wonProspects / totalProspects : 0;
        
        // Croissance mensuelle calculée dynamiquement
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const recentProspects = prospects.filter(p => new Date(p.created_at) > lastMonth).length;
        const monthlyGrowth = totalProspects > 0 ? recentProspects / totalProspects : 0;
        
        // Segmentation dynamique basée sur les données enrichies
        const segmentMetrics = {
          advertising: prospects.filter(p => 
            p.enriched_data?.company_info?.industry?.includes('advertising') ||
            p.segment_targeting?.includes('advertising')
          ).length,
          music: prospects.filter(p => 
            p.enriched_data?.company_info?.industry?.includes('music') ||
            p.segment_targeting?.includes('music')
          ).length,
          luxury: prospects.filter(p => 
            p.enriched_data?.company_info?.industry?.includes('luxury') ||
            p.segment_targeting?.includes('luxury')
          ).length,
          sports: prospects.filter(p => 
            p.enriched_data?.company_info?.industry?.includes('sports') ||
            p.segment_targeting?.includes('sports')
          ).length
        };
        
        // Valeur pipeline calculée dynamiquement
        const pipelineValue = prospects.reduce((total, prospect) => {
          const leadScore = prospect.lead_score || 0;
          const segment = prospect.segment_targeting?.[0] || 'general';
          
          // Valeurs de base ajustées selon le segment et le score
          const segmentMultipliers = {
            music: 1.0,
            advertising: 1.5,
            luxury: 2.0,
            sports: 1.2,
            general: 0.8
          };
          
          const baseValue = 5000; // Valeur de base
          const multiplier = segmentMultipliers[segment as keyof typeof segmentMultipliers] || 0.8;
          
          return total + (baseValue * multiplier * (leadScore / 100));
        }, 0);
        
        // Temps de réponse moyen calculé à partir des données réelles
        const avgResponseTime = prospects
          .filter(p => p.last_contact_date && p.created_at)
          .reduce((total, prospect, _, arr) => {
            const created = new Date(prospect.created_at).getTime();
            const contacted = new Date(prospect.last_contact_date!).getTime();
            const diffHours = (contacted - created) / (1000 * 60 * 60);
            return total + diffHours / arr.length;
          }, 0) || 24;
    
        set({
          metrics: {
            total_prospects: totalProspects,
            conversion_rate: conversionRate,
            avg_response_time: Math.round(avgResponseTime),
            pipeline_value: Math.round(pipelineValue),
            monthly_growth: monthlyGrowth,
            segment_breakdown: segmentMetrics,
            qualified_prospects: qualifiedProspects
          }
        });
      },
      'Erreur lors du chargement des métriques'
    );
  },

  enrichProspectData: async (prospectId: string): Promise<EnrichedData> => {
    // Récupérer les vraies données depuis la base
    const { data: prospect, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();
  
    if (error || !prospect) {
      throw new Error('Prospect non trouvé');
    }
  
    // Utiliser les données réelles du workflow n8n
    const enrichedData: EnrichedData = {
      company_info: {
        size: prospect.enriched_data?.company_info?.size || 'unknown',
        industry: prospect.enriched_data?.company_info?.industry || 'unknown',
        location: prospect.enriched_data?.company_info?.location || 'France',
        website: prospect.website || prospect.enriched_data?.company_info?.website
      },
      contact_info: {
        role: prospect.position || 'Contact',
        seniority_level: 'unknown',
        decision_maker: (prospect.lead_score || 0) > 70
      }
    };
  
    // Mettre à jour le prospect avec les données enrichies
    await get().saveProspect({ 
      id: prospectId, 
      enriched_data: enrichedData 
    });
  
    return enrichedData;
  },

  bulkUpdateStatus: async (prospectIds: string[], status: Prospect['status']) => {
    await errorUtils.withErrorHandling(
      async () => {
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
        
        useErrorStore.getState().handleSuccess(`${prospectIds.length} prospects mis à jour`);
      },
      'Erreur lors de la mise à jour en lot des prospects'
    );
  },

  getOptimalContactTime: async (prospectId: string): Promise<string> => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    if (!prospect) throw new Error('Prospect non trouvé');

    // Logique simple basée sur le segment
    const segment = prospect.segment_targeting?.[0];
    const optimalTimes = {
      music: '14:00', // Après-midi pour l'industrie musicale
      luxury: '10:00', // Matinée pour le luxe
      sports: '16:00', // Fin d'après-midi pour le sport
      advertising: '11:00' // Milieu de matinée pour la pub
    };

    return optimalTimes[segment as keyof typeof optimalTimes] || '10:00';
  },

  trackEmailEngagement: async (prospectId: string, action: 'open' | 'click' | 'reply') => {
    const prospect = get().prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    const currentScore = prospect.engagement_score || 0;
    const boost = ENGAGEMENT_BOOST[action];
    const newScore = Math.min(currentScore + boost, 100);

    await get().saveProspect({ 
      id: prospectId, 
      engagement_score: newScore,
      last_contact_date: new Date().toISOString()
    });
  },

  // Nouvelles actions pour l'import automatisé
  importProspectsFromApi: async (criteria: any) => {
    const result = await errorUtils.withErrorHandling(
      async () => {
        // Intégration avec ProspectApiService au lieu de données mockées
        const { ProspectApiService } = await import('../lib/prospectApiService');
        
        // Utiliser les vrais critères de recherche - FORMAT CORRIGÉ
        const prospects = await ProspectApiService.fetchProspects({
          limit: criteria.limit || 50,
          quickFilters: {
            industry: criteria.industry || undefined,
            location: criteria.location || undefined,
            companySize: criteria.companySize || undefined
          },
          keywords: criteria.keywords ? criteria.keywords.split(',').map((k: string) => k.trim()) : undefined
        });
        
        // Validation et nettoyage des données
        const validProspects = prospects.filter(p => get().validateProspectData(p));
        
        // Import en base avec transformation des données
        for (const prospect of validProspects) {
          const transformedProspect = {
            email: prospect.email,
            first_name: prospect.first_name,
            last_name: prospect.last_name,
            company_name: prospect.company_name,
            position: prospect.position,
            source: 'api_import',
            status: 'new' as const,
            lead_score: prospect.lead_score || 0,
            // Suppression de enriched_data car elle n'existe pas dans le type retourné
            // enriched_data: prospect.enriched_data
          };
          await get().saveProspect(transformedProspect);
        }
        
        // Recharger la liste
        await get().loadProspects();
        
        return validProspects;
      },
      'Erreur lors de l\'import automatisé'
    );
    
    // Retourner un tableau vide si le résultat est null
    return result || [];
  },

  validateProspectData: (prospect: any) => {
    return !!(
      prospect.email && 
      prospect.email.includes('@') && 
      prospect.company_name && 
      prospect.first_name
    );
  },

  getApiUsageStats: async () => {
    // Récupérer les stats d'utilisation des APIs
    const { data } = await supabase
      .from('api_usage_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    return {
      monthlyUsage: data?.length || 0,
      remainingQuota: 95 - (data?.length || 0),
      lastImport: data?.[0]?.created_at
    };
  },

  scheduleAutoImport: async (criteria: any, frequency: string) => {
    // Implémentation future pour la planification automatique
    console.log('Auto import scheduled:', { criteria, frequency });
  }
}));

export default useProspectionStore;