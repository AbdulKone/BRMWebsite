import { supabase } from './supabase';
import { useErrorStore } from '../stores/errorStore';

// Configuration des APIs publiques
interface ApiProvider {
  name: string;
  endpoint: string;
  rateLimit: number;
  fields: string[];
  active: boolean;
  apiKey?: string;
}

// Interface pour les filtres avancés
export interface ProspectFilter {
  id: string;
  name: string;
  type: 'industry' | 'location' | 'company_size' | 'domain' | 'keyword' | 'confidence';
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: string | string[] | number;
  active: boolean;
}

export interface FilterRule {
  id: string;
  name: string;
  description: string;
  filters: ProspectFilter[];
  logic: 'AND' | 'OR';
  priority: number;
}

export interface ProspectCriteria {
  keywords?: string[];
  domains?: string[];
  limit?: number;
  filterRules?: FilterRule[];
  quickFilters?: {
    industry?: string;
    location?: string;
    companySize?: string;
    minConfidence?: number;
  };
}

export class ProspectApiService {
  private static providers: ApiProvider[] = [];
  private static filterRules: FilterRule[] = [];
  private static industryKeywords: Map<string, string[]> = new Map();
  private static locationKeywords: Map<string, string[]> = new Map();
  private static companySizeRanges: Map<string, { min: number; max: number }> = new Map();

  // Initialisation dynamique des configurations
  static async initialize() {
    await this.loadProviders();
    await this.loadFilterRules();
    await this.loadIndustryMappings();
    await this.loadLocationMappings();
    await this.loadCompanySizeMappings();
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
          endpoint: 'https://api.hunter.io/v2/domain-search',
          rateLimit: 25,
          fields: ['email', 'first_name', 'last_name', 'position', 'company'],
          active: true,
          apiKey: import.meta.env.VITE_HUNTER_API_KEY // ✅ Correction
        }
      ];
    } catch (error) {
      console.warn('Utilisation des providers par défaut:', error);
    }
  }

  // Chargement des règles de filtrage
  private static async loadFilterRules() {
    try {
      const { data, error } = await supabase
        .from('filter_rules')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      this.filterRules = data || [];
    } catch (error) {
      console.warn('Aucune règle de filtrage chargée:', error);
    }
  }

  // Chargement des mappings industrie -> mots-clés
  private static async loadIndustryMappings() {
    try {
      const { data, error } = await supabase
        .from('industry_mappings')
        .select('*');

      if (error) throw error;

      this.industryKeywords.clear();
      data?.forEach(mapping => {
        this.industryKeywords.set(mapping.industry, mapping.keywords);
      });
    } catch (error) {
      // Fallback avec des mappings par défaut
      this.industryKeywords.set('music', ['music', 'label', 'studio', 'artist', 'sound']);
      this.industryKeywords.set('media', ['media', 'production', 'broadcast', 'tv', 'radio']);
      this.industryKeywords.set('advertising', ['advertising', 'marketing', 'agency', 'creative']);
      this.industryKeywords.set('luxury', ['luxury', 'fashion', 'premium', 'haute']);
      this.industryKeywords.set('sports', ['sport', 'fitness', 'athletic', 'gym']);
    }
  }

  // Chargement des mappings localisation
  private static async loadLocationMappings() {
    try {
      const { data, error } = await supabase
        .from('location_mappings')
        .select('*');

      if (error) throw error;

      this.locationKeywords.clear();
      data?.forEach(mapping => {
        this.locationKeywords.set(mapping.location, mapping.keywords);
      });
    } catch (error) {
      // Fallback
      this.locationKeywords.set('france', ['france', 'french', 'paris', 'lyon', 'marseille']);
      this.locationKeywords.set('europe', ['europe', 'european', 'eu']);
    }
  }

  // Chargement des tailles d'entreprise
  private static async loadCompanySizeMappings() {
    try {
      const { data, error } = await supabase
        .from('company_size_mappings')
        .select('*');

      if (error) throw error;

      this.companySizeRanges.clear();
      data?.forEach(mapping => {
        this.companySizeRanges.set(mapping.size_range, {
          min: mapping.min_employees,
          max: mapping.max_employees
        });
      });
    } catch (error) {
      // Fallback
      this.companySizeRanges.set('startup', { min: 1, max: 10 });
      this.companySizeRanges.set('small', { min: 11, max: 50 });
      this.companySizeRanges.set('medium', { min: 51, max: 200 });
      this.companySizeRanges.set('large', { min: 201, max: 1000 });
    }
  }

  // Méthode principale de recherche avec filtres dynamiques
  static async fetchProspects(criteria: ProspectCriteria) {
    await this.initialize();
    
    const prospects = [];
    const { handleError } = useErrorStore.getState();

    for (const provider of this.providers) {
      try {
        const apiProspects = await this.callProvider(provider, criteria);
        const filteredProspects = await this.applyFilters(apiProspects, criteria);
        prospects.push(...filteredProspects);
        
        if (prospects.length >= (criteria.limit || 50)) break;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        handleError(`Erreur API ${provider.name}`, errorMessage);
        continue;
      }
    }

    return prospects.slice(0, criteria.limit || 50);
  }

  // Application des filtres avec logique flexible
  private static async applyFilters(prospects: any[], criteria: ProspectCriteria) {
    let filtered = [...prospects];

    // Application des filtres rapides
    if (criteria.quickFilters) {
      filtered = this.applyQuickFilters(filtered, criteria.quickFilters);
    }

    // Application des règles de filtrage personnalisées
    if (criteria.filterRules && criteria.filterRules.length > 0) {
      for (const rule of criteria.filterRules) {
        filtered = this.applyFilterRule(filtered, rule);
      }
    }

    // Déduplication et validation finale
    return await this.deduplicateAndValidate(filtered);
  }

  // Filtres rapides intuitifs
  private static applyQuickFilters(prospects: any[], quickFilters: any) {
    return prospects.filter(prospect => {
      // Filtre par industrie
      if (quickFilters.industry) {
        const industry = this.detectIndustry(prospect);
        if (industry !== quickFilters.industry) return false;
      }

      // Filtre par localisation
      if (quickFilters.location) {
        const location = this.detectLocation(prospect);
        if (location !== quickFilters.location) return false;
      }

      // Filtre par taille d'entreprise
      if (quickFilters.companySize) {
        const size = this.detectCompanySize(prospect);
        if (size !== quickFilters.companySize) return false;
      }

      // Filtre par confiance minimale
      if (quickFilters.minConfidence && prospect.confidence) {
        if (prospect.confidence < quickFilters.minConfidence) return false;
      }

      return true;
    });
  }

  // Application d'une règle de filtrage complexe
  private static applyFilterRule(prospects: any[], rule: FilterRule) {
    return prospects.filter(prospect => {
      const results = rule.filters.map(filter => this.evaluateFilter(prospect, filter));
      
      return rule.logic === 'AND' 
        ? results.every(result => result)
        : results.some(result => result);
    });
  }

  // Évaluation d'un filtre individuel
  private static evaluateFilter(prospect: any, filter: ProspectFilter): boolean {
    if (!filter.active) return true;

    const prospectValue = this.getProspectValue(prospect, filter.type);
    
    switch (filter.operator) {
      case 'equals':
        return prospectValue === filter.value;
      case 'contains':
        return String(prospectValue).toLowerCase().includes(String(filter.value).toLowerCase());
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(prospectValue);
      case 'not_in':
        return Array.isArray(filter.value) && !filter.value.includes(prospectValue);
      case 'greater_than':
        return Number(prospectValue) > Number(filter.value);
      case 'less_than':
        return Number(prospectValue) < Number(filter.value);
      default:
        return true;
    }
  }

  // Extraction de valeur du prospect selon le type de filtre
  private static getProspectValue(prospect: any, type: string): any {
    switch (type) {
      case 'industry':
        return this.detectIndustry(prospect);
      case 'location':
        return this.detectLocation(prospect);
      case 'company_size':
        return this.detectCompanySize(prospect);
      case 'domain':
        return prospect.email?.split('@')[1] || '';
      case 'confidence':
        return prospect.confidence || 0;
      default:
        return '';
    }
  }

  // Détection intelligente de l'industrie
  private static detectIndustry(prospect: any): string {
    const text = `${prospect.company || ''} ${prospect.position || ''}`.toLowerCase();
    
    for (const [industry, keywords] of this.industryKeywords.entries()) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return industry;
      }
    }
    
    return 'general';
  }

  // Détection de la localisation
  private static detectLocation(prospect: any): string {
    const text = `${prospect.company || ''} ${prospect.location || ''}`.toLowerCase();
    
    for (const [location, keywords] of this.locationKeywords.entries()) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return location;
      }
    }
    
    return 'unknown';
  }

  // Détection de la taille d'entreprise
  private static detectCompanySize(prospect: any): string {
    // Logique basée sur des indicateurs dans le nom de l'entreprise ou la position
    const text = `${prospect.company || ''} ${prospect.position || ''}`.toLowerCase();
    
    if (text.includes('startup') || text.includes('founder')) return 'startup';
    if (text.includes('enterprise') || text.includes('corporation')) return 'large';
    if (text.includes('sme') || text.includes('pme')) return 'medium';
    
    return 'small'; // Par défaut
  }

  // Déduplication et validation finale
  private static async deduplicateAndValidate(prospects: any[]) {
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
        lead_score: this.calculateDynamicScore(prospect),
        confidence: prospect.confidence || null,
        metadata: {
          industry: this.detectIndustry(prospect),
          location: this.detectLocation(prospect),
          company_size: this.detectCompanySize(prospect)
        }
      });
    }
    
    return validated;
  }

  // Calcul dynamique du score
  private static calculateDynamicScore(prospect: any): number {
    let score = 30; // Score de base
    
    // Bonus pour les informations complètes
    if (prospect.first_name && prospect.last_name) score += 10;
    if (prospect.position) score += 15;
    if (prospect.company) score += 10;
    if (prospect.confidence) score += Math.round(prospect.confidence * 0.2);
    
    // Bonus pour les industries ciblées
    const industry = this.detectIndustry(prospect);
    if (this.industryKeywords.has(industry)) score += 20;
    
    return Math.min(score, 100);
  }

  // API pour gérer les règles de filtrage
  static async createFilterRule(rule: Omit<FilterRule, 'id'>) {
    const { data, error } = await supabase
      .from('filter_rules')
      .insert({ ...rule, id: crypto.randomUUID() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateFilterRule(id: string, updates: Partial<FilterRule>) {
    const { data, error } = await supabase
      .from('filter_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteFilterRule(id: string) {
    const { error } = await supabase
      .from('filter_rules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getFilterRules() {
    const { data, error } = await supabase
      .from('filter_rules')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Méthodes pour les providers
  private static async callProvider(provider: ApiProvider, criteria: ProspectCriteria) {
    switch (provider.name) {
      case 'Hunter.io':
        return await this.callHunterApi(provider, criteria);
      default:
        return [];
    }
  }

  private static async callHunterApi(provider: ApiProvider, criteria: ProspectCriteria) {
    if (!provider.apiKey) {
      console.warn('Clé API Hunter.io manquante');
      return [];
    }

    const prospects = [];
    
    // Recherche par domaines
    if (criteria.domains) {
      for (const domain of criteria.domains.slice(0, 3)) {
        const results = await this.searchHunterByDomain(domain, provider.apiKey);
        prospects.push(...results);
      }
    }
    
    // Recherche par mots-clés
    if (criteria.keywords) {
      for (const keyword of criteria.keywords.slice(0, 2)) {
        const results = await this.searchHunterByKeyword(keyword, provider.apiKey);
        prospects.push(...results);
      }
    }
    
    return prospects;
  }

  private static async searchHunterByDomain(domain: string, apiKey: string) {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=10`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.details || 'Erreur API Hunter.io');
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

  private static async searchHunterByKeyword(keyword: string, apiKey: string) {
    // Hunter.io ne supporte pas la recherche par mot-clé directement
    // On peut utiliser une logique de mapping keyword -> domaines connus
    const keywordToDomains: { [key: string]: string[] } = {
      'music': ['spotify.com', 'deezer.com', 'soundcloud.com'],
      'luxury': ['lvmh.com', 'kering.com', 'chanel.com'],
      'advertising': ['publicis.com', 'wpp.com', 'omnicom.com']
    };
    
    const domains = keywordToDomains[keyword.toLowerCase()] || [];
    const prospects = [];
    
    for (const domain of domains.slice(0, 2)) {
      const results = await this.searchHunterByDomain(domain, apiKey);
      prospects.push(...results);
    }
    
    return prospects;
  }
}