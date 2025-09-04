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

// Constantes centralisées
const CONFIG = {
  MAX_RESULTS: 50,
  MAX_API_CALLS: 100,
  DOMAIN_LIMIT: 3,
  DOMAIN_RESULTS_LIMIT: 15,
  CACHE_DURATION: {
    DOMAIN: 24 * 60 * 60 * 1000, // 24h
    COMPANY: 24 * 60 * 60 * 1000, // 24h
    DYNAMIC: 12 * 60 * 60 * 1000, // 12h
    NATURAL_LANGUAGE: 6 * 60 * 60 * 1000 // 6h
  },
  API_CALLS: {
    DOMAIN: 5,
    COMPANY: 3,
    DYNAMIC: 10,
    NATURAL_LANGUAGE: 2
  }
} as const;

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return prospects
      .filter(prospect => {
        // Validation email plus robuste
        if (!prospect.email || !emailRegex.test(prospect.email)) return false;
        
        // Validation confidence
        if (typeof prospect.confidence !== 'number' || prospect.confidence < 60) return false;
        
        // Validation longueur email
        if (prospect.email.length < 6 || prospect.email.length > 254) return false;
        
        return true;
      })
      .map(prospect => ({
        ...prospect,
        score: this.calculateScore(prospect),
        validated_at: new Date().toISOString(),
        // Normalisation des données
        email: prospect.email.toLowerCase().trim(),
        first_name: prospect.first_name?.trim(),
        last_name: prospect.last_name?.trim(),
        company: prospect.company?.trim()
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
    const seenEmails = new Set<string>();
    const seenCombinations = new Set<string>();
    
    return prospects.filter(prospect => {
      const email = prospect.email.toLowerCase();
      const company = prospect.company?.toLowerCase() || '';
      const combination = `${email}_${company}`;
      
      // Déduplication par email d'abord
      if (seenEmails.has(email)) {
        return false;
      }
      
      // Puis par combinaison email + entreprise
      if (seenCombinations.has(combination)) {
        return false;
      }
      
      seenEmails.add(email);
      seenCombinations.add(combination);
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
    let apiCallsUsed = 0;
    
    const canMakeApiCall = (requestedCalls: number): boolean => {
      return (apiCallsUsed + requestedCalls) <= CONFIG.MAX_API_CALLS;
    };
    
    const addResults = (newResults: HunterProspect[], callsUsed: number): boolean => {
      results.push(...newResults);
      apiCallsUsed += callsUsed;
      return results.length >= CONFIG.MAX_RESULTS;
    };
    
    // Recherche par domaines (priorité haute)
    if (criteria.domains?.length && results.length < CONFIG.MAX_RESULTS) {
      for (const domain of criteria.domains.slice(0, CONFIG.DOMAIN_LIMIT)) {
        if (!canMakeApiCall(CONFIG.API_CALLS.DOMAIN)) break;
        
        try {
          const domainResults = await this.searchHunterByDomain(domain);
          if (addResults(domainResults, CONFIG.API_CALLS.DOMAIN)) break;
          if (results.length >= CONFIG.DOMAIN_RESULTS_LIMIT) break;
        } catch (error) {
          console.warn(`Échec recherche domaine ${domain}:`, error);
          continue;
        }
      }
    }
    
    // Recherche par critères dynamiques
    if ((criteria.keywords?.length || criteria.quickFilters) && 
        results.length < CONFIG.MAX_RESULTS && 
        canMakeApiCall(CONFIG.API_CALLS.DYNAMIC)) {
      try {
        const dynamicResults = await this.searchHunterByDynamicCriteria(criteria);
        addResults(dynamicResults, CONFIG.API_CALLS.DYNAMIC);
      } catch (error) {
        console.warn('Échec recherche critères dynamiques:', error);
      }
    }
    
    // Recherche en langage naturel
    if (criteria.naturalLanguageQuery && 
        results.length < CONFIG.MAX_RESULTS && 
        canMakeApiCall(CONFIG.API_CALLS.NATURAL_LANGUAGE)) {
      try {
        const nlResults = await this.searchHunterByNaturalLanguage(criteria.naturalLanguageQuery);
        addResults(nlResults, CONFIG.API_CALLS.NATURAL_LANGUAGE);
      } catch (error) {
        console.warn('Échec recherche langage naturel:', error);
      }
    }
    
    const finalResults = results.slice(0, CONFIG.MAX_RESULTS);
    console.log(`✅ API Hunter.io: ${finalResults.length} prospects trouvés (${apiCallsUsed}/${CONFIG.MAX_API_CALLS} appels API)`);
    
    return finalResults;
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
      
      hunterCache.set(cacheKey, results, CONFIG.CACHE_DURATION.DOMAIN);
      apiUsageMonitor.incrementUsage('api', domain);
      
      console.log(`✅ API Hunter.io: ${results.length} prospects trouvés pour ${domain}`);
      return results;
    } catch (error: unknown) {
      console.error(`Erreur recherche domaine ${domain}:`, error);
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
      
      hunterCache.set(cacheKey, prospects, CONFIG.CACHE_DURATION.DYNAMIC);
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
      
      hunterCache.set(cacheKey, prospects, CONFIG.CACHE_DURATION.NATURAL_LANGUAGE);
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