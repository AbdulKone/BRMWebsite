import { supabase } from './supabase';
import { useErrorStore } from '../stores/errorStore';

// Configuration des APIs publiques
interface ApiProvider {
  name: string;
  endpoint: string;
  rateLimit: number;
  fields: string[];
  active: boolean;
}

// Interface simplifiée pour les critères de prospection
export interface ProspectCriteria {
  keywords?: string[];
  domains?: string[];
  limit?: number;
  quickFilters?: {
    industry?: string;
    location?: string;
    companySize?: string;
    minConfidence?: number;
  };
}

export class ProspectApiService {
  private static providers: ApiProvider[] = [];

  // Initialisation simplifiée
  static async initialize() {
    await this.loadProviders();
  }

  // Chargement des providers depuis la base
  private static async loadProviders() {
    try {
      const { data, error } = await supabase
        .from('api_providers')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      this.providers = data || [
        {
          name: 'Hunter.io',
          endpoint: '/api/hunter-proxy',
          rateLimit: 25,
          fields: ['email', 'first_name', 'last_name', 'position', 'company'],
          active: true
        }
      ];
    } catch (error) {
      console.warn('Utilisation des providers par défaut:', error);
      this.providers = [
        {
          name: 'Hunter.io',
          endpoint: '/api/hunter-proxy',
          rateLimit: 25,
          fields: ['email', 'first_name', 'last_name', 'position', 'company'],
          active: true
        }
      ];
    }
  }

  // Méthode principale de recherche simplifiée
  static async fetchProspects(criteria: ProspectCriteria) {
    await this.initialize();
    
    const prospects = [];
    const { handleError } = useErrorStore.getState();

    for (const provider of this.providers) {
      try {
        const apiProspects = await this.callProvider(provider, criteria);
        const validatedProspects = await this.validateProspects(apiProspects);
        prospects.push(...validatedProspects);
        
        if (prospects.length >= (criteria.limit || 50)) break;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        handleError(`Erreur API ${provider.name}`, errorMessage);
        continue;
      }
    }

    return prospects.slice(0, criteria.limit || 50);
  }

  // Validation simplifiée des prospects
  private static async validateProspects(prospects: any[]) {
    const validated = [];
    
    for (const prospect of prospects) {
      // Vérification des doublons en base
      const { data: existing } = await supabase
        .from('prospects')
        .select('id')
        .eq('email', prospect.email)
        .single();
      
      if (existing) continue;
      
      // Validation des données essentielles
      if (!prospect.email || !prospect.email.includes('@')) continue;
      if (!prospect.company && !prospect.first_name) continue;
      
      validated.push({
        email: prospect.email,
        first_name: prospect.first_name || '',
        last_name: prospect.last_name || '',
        company_name: prospect.company || '',
        position: prospect.position || '',
        source: 'api_import',
        status: 'new',
        lead_score: this.calculateScore(prospect),
        confidence: prospect.confidence || null
      });
    }
    
    return validated;
  }

  // Calcul de score simplifié
  private static calculateScore(prospect: any): number {
    let score = 30;
    
    if (prospect.first_name && prospect.last_name) score += 10;
    if (prospect.position) score += 15;
    if (prospect.company) score += 10;
    if (prospect.confidence) score += Math.round(prospect.confidence * 0.2);
    
    return Math.min(score, 100);
  }

  // Méthodes pour les providers
  private static async callProvider(provider: ApiProvider, criteria: ProspectCriteria) {
    switch (provider.name) {
      case 'Hunter.io':
        return await this.callHunterApi(criteria);
      default:
        return [];
    }
  }

  private static async callHunterApi(criteria: ProspectCriteria) {
    const prospects = [];
    
    // Recherche par domaines
    if (criteria.domains) {
      for (const domain of criteria.domains.slice(0, 3)) {
        const results = await this.searchHunterByDomain(domain);
        prospects.push(...results);
      }
    }
    
    // Recherche par mots-clés
    if (criteria.keywords) {
      for (const keyword of criteria.keywords.slice(0, 2)) {
        const results = await this.searchHunterByKeyword(keyword);
        prospects.push(...results);
      }
    }
    
    return prospects;
  }

  private static async searchHunterByDomain(domain: string) {
    try {
      const response = await fetch('/api/hunter-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain,
          action: 'domain-search'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur API Hunter.io');
      }
      
      return (data.data?.emails || []).map((email: any) => ({
        email: email.value,
        first_name: email.first_name,
        last_name: email.last_name,
        position: email.position,
        company: data.data?.domain,
        confidence: email.confidence,
        sources: email.sources?.length || 0
      }));
    } catch (error: unknown) {
      console.error(`Erreur recherche domaine ${domain}:`, error);
      return [];
    }
  }

  private static async searchHunterByKeyword(keyword: string) {
    // Mapping simplifié keyword -> domaines
    const keywordToDomains: { [key: string]: string[] } = {
      'music': ['spotify.com', 'deezer.com', 'soundcloud.com'],
      'luxury': ['lvmh.com', 'kering.com', 'chanel.com'],
      'advertising': ['publicis.com', 'wpp.com', 'omnicom.com']
    };
    
    const domains = keywordToDomains[keyword.toLowerCase()] || [];
    const prospects = [];
    
    for (const domain of domains.slice(0, 2)) {
      const results = await this.searchHunterByDomain(domain);
      prospects.push(...results);
    }
    
    return prospects;
  }
}