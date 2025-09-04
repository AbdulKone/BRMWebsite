import { supabase } from './supabase';
import { useErrorStore } from '../stores/errorStore';
import { hunterCache } from './hunterCache';
import { apiUsageMonitor } from './apiUsageMonitor';
import {
  HunterProspect,
  HunterDomainSearchResponse,
  HunterDiscoverResponse,
  ProspectSearchCriteria,
  ApiUsageStats
} from './types/hunterTypes';

interface ApiProvider {
  name: string;
  endpoint: string;
  rateLimit: number;
  fields: string[];
  active: boolean;
}

export class ProspectApiService {
  private static providers: ApiProvider[] = [];
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    await this.loadProviders();
    this.initialized = true;
  }

  private static async loadProviders() {
    try {
      const { data, error } = await supabase
        .from('api_providers')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Aucun provider API configuré dans la base de données');
      }

      this.providers = data;
    } catch (error) {
      console.error('Erreur lors du chargement des providers:', error);
      throw new Error('Impossible de charger les providers API depuis la base de données');
    }
  }

  // Méthode principale de recherche optimisée
  static async fetchProspects(criteria: ProspectSearchCriteria): Promise<HunterProspect[]> {
    await this.initialize();
    
    if (!apiUsageMonitor.canMakeRequest()) {
      const remaining = apiUsageMonitor.getRemainingQuota();
      throw new Error(`Quota quotidien atteint. Restant: ${remaining.daily} appels`);
    }
    
    const prospects: HunterProspect[] = [];
    const { handleError } = useErrorStore.getState();

    const activeProviders = this.providers.slice(0, 1);

    for (const provider of activeProviders) {
      try {
        const apiProspects = await this.callProvider(provider, criteria);
        const validatedProspects = await this.validateProspects(apiProspects);
        prospects.push(...validatedProspects);
        
        if (prospects.length >= (criteria.limit || 25)) break;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        handleError(`Erreur API ${provider.name}`, errorMessage);
        continue;
      }
    }

    return this.deduplicateProspects(prospects.slice(0, criteria.limit || 25));
  }

  // Validation améliorée des prospects
  private static async validateProspects(prospects: HunterProspect[]): Promise<HunterProspect[]> {
    return prospects
      .filter(prospect => {
        return prospect.email && 
               prospect.email.includes('@') && 
               prospect.confidence >= 60 && 
               prospect.email.length > 5;
      })
      .map(prospect => ({
        ...prospect,
        score: this.calculateScore(prospect),
        validated_at: new Date().toISOString()
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // Calcul de score amélioré
  private static calculateScore(prospect: HunterProspect): number {
    let score = prospect.confidence || 50;
    
    if (prospect.first_name && prospect.last_name) score += 10;
    if (prospect.position) score += 15;
    if (prospect.linkedin) score += 10;
    if (prospect.department) score += 5;
    
    if (prospect.sources && prospect.sources > 1) score += prospect.sources * 2;
    
    return Math.min(100, score);
  }

  // Déduplication améliorée
  private static deduplicateProspects(prospects: HunterProspect[]): HunterProspect[] {
    const seen = new Set<string>();
    return prospects.filter(prospect => {
      const key = `${prospect.email.toLowerCase()}_${prospect.company?.toLowerCase() || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private static async callProvider(provider: ApiProvider, criteria: ProspectSearchCriteria): Promise<HunterProspect[]> {
    if (provider.name === 'Hunter.io') {
      return await this.callHunterApi(criteria);
    }
    return [];
  }

  // API Hunter.io optimisée avec cache
  private static async callHunterApi(criteria: ProspectSearchCriteria): Promise<HunterProspect[]> {
    const results: HunterProspect[] = [];
    
    if (criteria.domains && criteria.domains.length > 0) {
      for (const domain of criteria.domains.slice(0, 3)) {
        const domainResults = await this.searchHunterByDomain(domain);
        results.push(...domainResults);
        if (results.length >= 15) break;
      }
    }
    
    if (criteria.companyName && results.length < 10) {
      const companyResults = await this.searchHunterByCompany(criteria.companyName);
      results.push(...companyResults);
    }
    
    if (criteria.keywords && criteria.keywords.length > 0 && results.length < 15) {
      const dynamicResults = await this.searchHunterByDynamicCriteria(criteria);
      results.push(...dynamicResults);
    }
    
    if (criteria.naturalLanguageQuery && results.length < 10) {
      const nlResults = await this.searchHunterByNaturalLanguage(criteria.naturalLanguageQuery);
      results.push(...nlResults);
    }
    
    return results;
  }

  // Recherche par domaine optimisée avec cache
  private static async searchHunterByDomain(domain: string): Promise<HunterProspect[]> {
    const cacheKey = hunterCache.generateKey('domain-search', { domain });
    
    const cached = hunterCache.get(cacheKey);
    if (cached) {
      apiUsageMonitor.incrementUsage('cache', domain);
      return cached;
    }
    
    if (!apiUsageMonitor.canMakeRequest()) {
      console.warn('⚠️ Quota quotidien atteint, utilisation du cache uniquement');
      return [];
    }
    
    try {
      const response = await fetch('/api/hunter-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain,
          action: 'domain-search',
          limit: 5
        })
      });
      
      const data: HunterDomainSearchResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur API Hunter.io');
      }
      
      const results: HunterProspect[] = (data.data?.emails || []).map((email) => ({
        email: email.value,
        first_name: email.first_name,
        last_name: email.last_name,
        position: email.position,
        company: data.data?.organization || domain,
        confidence: email.confidence,
        sources: email.sources?.length || 0,
        department: email.department,
        seniority: email.seniority,
        linkedin: email.linkedin
      }));
      
      hunterCache.set(cacheKey, results, 24 * 60 * 60 * 1000);
      apiUsageMonitor.incrementUsage('api', domain);
      
      console.log(`✅ API Hunter.io: ${results.length} prospects trouvés pour ${domain}`);
      return results;
    } catch (error: unknown) {
      console.error(`Erreur recherche domaine ${domain}:`, error);
      return [];
    }
  }

  // Recherche par entreprise optimisée avec cache
  private static async searchHunterByCompany(companyName: string): Promise<HunterProspect[]> {
    const cacheKey = hunterCache.generateKey('company-search', { companyName });
    
    const cached = hunterCache.get(cacheKey);
    if (cached) {
      apiUsageMonitor.incrementUsage('cache', undefined, companyName);
      return cached;
    }
    
    if (!apiUsageMonitor.canMakeRequest()) {
      console.warn('⚠️ Quota quotidien atteint, utilisation du cache uniquement');
      return [];
    }
    
    try {
      const response = await fetch('/api/hunter-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'discover',
          query: `company name: ${companyName}`,
          limit: 3
        })
      });
      
      const data: HunterDiscoverResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur API Hunter.io Discover');
      }
      
      const prospects: HunterProspect[] = [];
      
      if (data.data?.companies) {
        for (const company of data.data.companies.slice(0, 2)) {
          if (company.domain) {
            const domainProspects = await this.searchHunterByDomain(company.domain);
            prospects.push(...domainProspects.map((p) => ({
              ...p,
              company: company.name || companyName,
              industry: company.industry,
              company_size: company.size
            })));
          }
        }
      }
      
      hunterCache.set(cacheKey, prospects, 24 * 60 * 60 * 1000);
      apiUsageMonitor.incrementUsage('api', undefined, companyName);
      
      console.log(`✅ API Hunter.io: ${prospects.length} prospects trouvés pour ${companyName}`);
      return prospects;
    } catch (error: unknown) {
      console.error(`Erreur recherche entreprise ${companyName}:`, error);
      return [];
    }
  }

  // Recherche par critères dynamiques optimisée
  private static async searchHunterByDynamicCriteria(criteria: ProspectSearchCriteria): Promise<HunterProspect[]> {
    const cacheKey = hunterCache.generateKey('dynamic-search', criteria);
    
    const cached = hunterCache.get(cacheKey);
    if (cached) {
      apiUsageMonitor.incrementUsage('cache');
      return cached;
    }
    
    if (!apiUsageMonitor.canMakeRequest()) {
      console.warn('⚠️ Quota quotidien atteint, utilisation du cache uniquement');
      return [];
    }
    
    try {
      const queryParts: string[] = [];
      
      if (criteria.keywords && criteria.keywords.length > 0) {
        queryParts.push(`keywords: ${criteria.keywords.slice(0, 2).join(' ')}`);
      }
      
      if (criteria.quickFilters?.industry) {
        queryParts.push(`industry: ${criteria.quickFilters.industry}`);
      }
      
      if (criteria.quickFilters?.location) {
        queryParts.push(`location: ${criteria.quickFilters.location}`);
      }
      
      const query = queryParts.join(' AND ');
      
      if (!query) return [];
      
      const response = await fetch('/api/hunter-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'discover',
          query: query,
          limit: 10
        })
      });
      
      const data: HunterDiscoverResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur API Hunter.io Discover');
      }
      
      const prospects: HunterProspect[] = [];
      
      if (data.data?.companies) {
        for (const company of data.data.companies.slice(0, 2)) {
          if (company.domain) {
            const domainProspects = await this.searchHunterByDomain(company.domain);
            prospects.push(...domainProspects.map((p) => ({
              ...p,
              company: company.name,
              industry: company.industry,
              company_size: company.size,
              match_criteria: query
            })));
          }
        }
      }
      
      hunterCache.set(cacheKey, prospects, 12 * 60 * 60 * 1000);
      apiUsageMonitor.incrementUsage('api');
      
      console.log(`✅ API Hunter.io: ${prospects.length} prospects trouvés pour critères dynamiques`);
      return prospects;
    } catch (error: unknown) {
      console.error('Erreur recherche critères dynamiques:', error);
      return [];
    }
  }

  // Recherche en langage naturel optimisée
  private static async searchHunterByNaturalLanguage(query: string): Promise<HunterProspect[]> {
    const cacheKey = hunterCache.generateKey('natural-language', { query });
    
    const cached = hunterCache.get(cacheKey);
    if (cached) {
      apiUsageMonitor.incrementUsage('cache');
      return cached;
    }
    
    if (!apiUsageMonitor.canMakeRequest()) {
      console.warn('⚠️ Quota quotidien atteint, utilisation du cache uniquement');
      return [];
    }
    
    try {
      const response = await fetch('/api/hunter-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'discover',
          query: query,
          limit: 2
        })
      });
      
      const data: HunterDiscoverResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur API Hunter.io Discover');
      }
      
      const prospects: HunterProspect[] = [];
      
      if (data.data?.companies) {
        for (const company of data.data.companies.slice(0, 1)) {
          if (company.domain) {
            const domainProspects = await this.searchHunterByDomain(company.domain);
            prospects.push(...domainProspects.map((p) => ({
              ...p,
              company: company.name,
              industry: company.industry,
              natural_query: query
            })));
          }
        }
      }
      
      hunterCache.set(cacheKey, prospects, 6 * 60 * 60 * 1000);
      apiUsageMonitor.incrementUsage('api');
      
      console.log(`✅ API Hunter.io: ${prospects.length} prospects trouvés pour requête naturelle`);
      return prospects;
    } catch (error: unknown) {
      console.error('Erreur recherche langage naturel:', error);
      return [];
    }
  }

  // Méthodes utilitaires pour le monitoring
  static getUsageStats(): ApiUsageStats {
    return {
      cache: hunterCache.getStats(),
      usage: apiUsageMonitor.getEfficiencyStats(),
      quota: apiUsageMonitor.getRemainingQuota()
    };
  }

  static clearCache(): void {
    hunterCache.clear();
    console.log('🧹 Cache Hunter.io vidé');
  }
}