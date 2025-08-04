import { supabase } from './supabase';

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
      // Recherche d'informations sur l'entreprise
      const companyInfo = await this.getCompanyInfo(emailDomain);
      if (companyInfo) {
        enrichmentData.company_info = companyInfo;
      }

      // Recherche de profils sociaux
      const socialProfiles = await this.getSocialProfiles(prospect.company_name);
      if (socialProfiles) {
        enrichmentData.social_profiles = socialProfiles;
      }

    } catch (error) {
      console.error('Erreur enrichissement:', error);
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

  private static async getCompanyInfo(domain: string) {
    // Logique d'enrichissement via APIs externes basée sur le domaine
    // Clearbit, Hunter.io, etc.
    
    // Exemple d'utilisation du domaine pour déterminer l'industrie
    let industry = 'unknown';
    let size = 'small';
    let location = 'France';
    let website = `https://${domain}`;

    // Analyse du domaine pour déterminer l'industrie
    if (domain.includes('music') || domain.includes('label') || domain.includes('studio')) {
      industry = 'music';
    } else if (domain.includes('media') || domain.includes('prod')) {
      industry = 'media';
    }

    // Ici vous pourriez faire des appels API réels avec le domaine
    // const response = await fetch(`https://api.clearbit.com/v2/companies/find?domain=${domain}`);
    
    return {
      industry,
      size,
      location,
      website
    };
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