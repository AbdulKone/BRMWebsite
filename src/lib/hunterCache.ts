import { HunterProspect, ProspectSearchCriteria } from './types/hunterTypes';

interface HunterCacheItem {
  data: HunterProspect[];
  timestamp: number;
  ttl: number;
  requestCount: number;
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  apiCallsSaved: number;
}

class HunterCache {
  private cache = new Map<string, HunterCacheItem>();
  private readonly STORAGE_KEY = 'hunter_cache_v2';
  private readonly STATS_KEY = 'hunter_cache_stats';
  private stats: CacheStats;

  constructor() {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCallsSaved: 0
    };
    this.loadFromLocalStorage();
    this.loadStats();
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  generateKey(action: string, params: ProspectSearchCriteria | Record<string, unknown>): string {
    const normalizedParams = this.normalizeParams(params);
    return `hunter_${action}_${JSON.stringify(normalizedParams)}`;
  }

  private normalizeParams(params: ProspectSearchCriteria | Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...params };
    delete (normalized as Record<string, unknown>).timestamp;
    delete (normalized as Record<string, unknown>).requestId;
    
    return Object.keys(normalized)
      .sort()
      .reduce((result, key) => {
        result[key] = (normalized as Record<string, unknown>)[key];
        return result;
      }, {} as Record<string, unknown>);
  }

  set(key: string, data: HunterProspect[], ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      requestCount: 1
    });
    this.saveToLocalStorage();
  }

  get(key: string): HunterProspect[] | null {
    this.stats.totalRequests++;
    
    const item = this.cache.get(key);
    if (!item) {
      this.stats.cacheMisses++;
      this.saveStats();
      return null;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.cacheMisses++;
      this.saveToLocalStorage();
      this.saveStats();
      return null;
    }

    item.requestCount++;
    this.stats.cacheHits++;
    this.stats.apiCallsSaved++;
    this.saveStats();
    
    return item.data;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Impossible de sauvegarder les statistiques:', error);
    }
  }

  private loadStats(): void {
    try {
      const stored = localStorage.getItem(this.STATS_KEY);
      if (stored) {
        this.stats = { ...this.stats, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Impossible de charger les statistiques:', error);
    }
  }

  clear(): void {
    this.cache.clear();
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Impossible de sauvegarder le cache:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const cacheData = JSON.parse(stored) as [string, HunterCacheItem][];
        this.cache = new Map(cacheData);
      }
    } catch (error) {
      console.warn('Impossible de charger le cache:', error);
      this.cache = new Map();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
    this.saveToLocalStorage();
  }
}

export const hunterCache = new HunterCache();