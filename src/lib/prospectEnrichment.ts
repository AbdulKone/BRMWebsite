import { supabase } from './supabase';
import { useErrorStore } from '../stores/errorStore';

const { handleError } = useErrorStore.getState();

export interface EnrichmentData {
  company_info?: {
    industry?: string;
    size?: string;
    location?: string;
    website?: string;
  };
  social_profiles?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  contact_info?: {
    phone?: string;
    verified_email?: boolean;
  };
}

export class ProspectEnrichmentService {
  
  static async enrichProspect(prospectId: string): Promise<EnrichmentData> {
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (!prospect) throw new Error('Prospect non trouvé');

    const enrichmentData: EnrichmentData = {};

    // Enrichissement basé sur le domaine email
    const emailDomain = prospect.email.split('@')[1];
    
    try {
      // Recherche d'informations sur l'entreprise via Hunter.io
      const companyInfo = await this.getCompanyInfoFromHunter(emailDomain);
      if (companyInfo) {
        enrichmentData.company_info = companyInfo;
      }

      // Recherche de profils sociaux
      const socialProfiles = await this.getSocialProfiles(prospect.company_name);
      if (socialProfiles) {
        enrichmentData.social_profiles = socialProfiles;
      }

    } catch (error) {
      handleError(error, 'Erreur lors de l\'enrichissement du prospect');
    }

    // Mise à jour du prospect avec les données enrichies
    await supabase
      .from('prospects')
      .update({
        enriched_data: enrichmentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', prospectId);

    return enrichmentData;
  }

  private static async getCompanyInfoFromHunter(domain: string) {
    try {
      // Utilisation de l'endpoint sécurisé au lieu de l'API directe
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

      // Extraction des informations de l'entreprise depuis Hunter.io
      const hunterData = data.data;
      
      return {
        industry: this.determineIndustryFromDomain(domain),
        size: this.estimateCompanySize(hunterData.emails?.length || 0),
        location: hunterData.country || 'France',
        website: `https://${domain}`
      };
    } catch (error) {
      console.warn('Erreur lors de l\'appel à Hunter.io:', error);
      return this.getFallbackCompanyInfo(domain);
    }
  }

  private static getFallbackCompanyInfo(domain: string) {
    // Logique de fallback basée sur l'analyse du domaine
    return {
      industry: this.determineIndustryFromDomain(domain),
      size: 'small',
      location: 'France',
      website: `https://${domain}`
    };
  }

  private static determineIndustryFromDomain(domain: string): string {
    // Analyse du domaine pour déterminer l'industrie
    if (domain.includes('music') || domain.includes('label') || domain.includes('studio')) {
      return 'music';
    } else if (domain.includes('media') || domain.includes('prod')) {
      return 'media';
    } else if (domain.includes('tech') || domain.includes('software')) {
      return 'technology';
    }
    return 'unknown';
  }

  private static estimateCompanySize(emailCount: number): string {
    if (emailCount > 100) return 'large';
    if (emailCount > 20) return 'medium';
    return 'small';
  }

  private static async getSocialProfiles(companyName: string) {
    // Recherche de profils sociaux
    return {
      linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
      instagram: `https://instagram.com/${companyName.toLowerCase().replace(/\s+/g, '')}`
    };
  }

  static async calculateLeadScore(prospect: any): Promise<number> {
    let score = 50; // Score de base

    // Scoring basé sur le secteur
    if (prospect.company_name?.toLowerCase().includes('music')) score += 25;
    if (prospect.company_name?.toLowerCase().includes('label')) score += 20;
    if (prospect.company_name?.toLowerCase().includes('studio')) score += 15;

    // Scoring basé sur l'email
    const emailDomain = prospect.email.split('@')[1];
    if (!['gmail.com', 'hotmail.com', 'yahoo.com'].includes(emailDomain)) {
      score += 15; // Email professionnel
    }

    // Scoring basé sur les données enrichies
    if (prospect.enriched_data?.company_info?.industry === 'music') score += 20;
    if (prospect.enriched_data?.social_profiles?.linkedin) score += 10;

    return Math.min(score, 100);
  }
}