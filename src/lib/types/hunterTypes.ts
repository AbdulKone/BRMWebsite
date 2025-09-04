// Types spécifiques pour l'API Hunter.io

export interface HunterProspect {
  email: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  company: string;
  confidence: number;
  sources?: number;
  department?: string;
  seniority?: string;
  linkedin?: string;
  score?: number;
  validated_at?: string;
  industry?: string;
  company_size?: string;
  match_criteria?: string;
  natural_query?: string;
}

export interface HunterCompany {
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  country?: string;
  organization?: string;
}

export interface HunterEmailData {
  value: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  confidence: number;
  sources?: Array<{
    domain: string;
    uri: string;
    extracted_on: string;
    last_seen_on: string;
    still_on_page: boolean;
  }>;
  department?: string;
  seniority?: string;
  linkedin?: string;
}

export interface HunterDomainSearchResponse {
  data?: {
    domain: string;
    disposable: boolean;
    webmail: boolean;
    accept_all: boolean;
    pattern?: string;
    organization?: string;
    country?: string;
    state?: string;
    emails: HunterEmailData[];
  };
  meta?: {
    results: number;
    limit: number;
    offset: number;
    params: {
      domain: string;
      company?: string;
      type?: string;
      limit: number;
      offset: number;
    };
  };
  error?: string;
}

export interface HunterDiscoverResponse {
  data?: {
    companies: Array<{
      name: string;
      domain?: string;
      industry?: string;
      size?: string;
      country?: string;
      linkedin?: string;
      twitter?: string;
    }>;
  };
  meta?: {
    results: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

export interface HunterApiError {
  errors: Array<{
    id: string;
    code: number;
    details: string;
  }>;
}

export interface ProspectSearchCriteria {
  keywords?: string[];
  domains?: string[];
  limit?: number;
  quickFilters?: {
    industry?: string;
    location?: string;
    companySize?: string;
    minConfidence?: number;
  };
  companyName?: string;
  naturalLanguageQuery?: string;
}

export interface ApiUsageStats {
  cache: CacheStats;
  usage: {
    cacheHitRate: number;
    apiCallsSaved: number;
    totalRequests: number;
  };
  quota: {
    daily: number;
    monthly: number;
  };
}

export interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  apiCallsSaved: number;
}

// Interface HunterApiResponse complètement supprimée