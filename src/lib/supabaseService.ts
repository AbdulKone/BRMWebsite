import { supabase } from './supabase';
import type { Prospect, Project, Artist, Service } from './types';
import type { Database } from './database.types';

class SupabaseService {
  // ========== PROSPECTS ==========
  async getProspects() {
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(`Erreur chargement prospects: ${error.message}`);
    return data || [];
  }

  async saveProspect(prospect: Partial<Prospect>) {
    const now = new Date().toISOString();
    const prospectData = prospect.id 
      ? { ...prospect, updated_at: now }
      : { ...prospect, created_at: now, updated_at: now };

    const { data, error } = prospect.id 
      ? await supabase.from('prospects').update(prospectData).eq('id', prospect.id).select().single()
      : await supabase.from('prospects').insert([prospectData]).select().single();
    
    if (error) throw new Error(`Erreur sauvegarde prospect: ${error.message}`);
    return data;
  }

  async deleteProspect(id: string) {
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Erreur suppression prospect: ${error.message}`);
  }

  async updateProspectSegment(prospectId: string, segmentId: string) {
    const { error } = await supabase
      .from('prospects')
      .update({ segment_targeting: [segmentId] })
      .eq('id', prospectId);
    
    if (error) throw new Error(`Erreur mise à jour segment: ${error.message}`);
  }

  async bulkUpdateProspectStatus(prospectIds: string[], status: Prospect['status']) {
    const { error } = await supabase
      .from('prospects')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', prospectIds);
    
    if (error) throw new Error(`Erreur mise à jour statut en masse: ${error.message}`);
  }

  // ========== PROJECTS ==========
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) throw new Error(`Erreur chargement projets: ${error.message}`);
    return data || [];
  }

  async saveProject(project: Partial<Project>) {
    const { data, error } = project.id
      ? await supabase.from('projects').update(project).eq('id', project.id).select().single()
      : await supabase.from('projects').insert([project]).select().single();
    
    if (error) throw new Error(`Erreur sauvegarde projet: ${error.message}`);
    return data;
  }

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Erreur suppression projet: ${error.message}`);
  }

  // ========== ARTISTS ==========
  async getArtists() {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (error) throw new Error(`Erreur chargement artistes: ${error.message}`);
    return data || [];
  }

  async saveArtist(artist: Partial<Artist>) {
    const { data, error } = artist.id
      ? await supabase.from('artists').update(artist).eq('id', artist.id).select().single()
      : await supabase.from('artists').insert([artist]).select().single();
    
    if (error) throw new Error(`Erreur sauvegarde artiste: ${error.message}`);
    return data;
  }

  async deleteArtist(id: string) {
    const { error } = await supabase
      .from('artists')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Erreur suppression artiste: ${error.message}`);
  }

  // ========== SERVICES ==========
  async getServices() {
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });

    if (servicesError) throw new Error(`Erreur chargement services: ${servicesError.message}`);

    const { data: features, error: featuresError } = await supabase
      .from('service_features')
      .select('*');

    if (featuresError) throw new Error(`Erreur chargement features: ${featuresError.message}`);

    return (services || []).map(service => ({
      ...service,
      features: (features || [])
        .filter(f => f.service_id === service.id)
        .map(f => f.feature)
    }));
  }

  // ========== METRICS ==========
  async getProspectionMetrics() {
    const { data: prospects, error } = await supabase
      .from('prospects')
      .select('status, created_at, lead_score, conversion_probability');
    
    if (error) throw new Error(`Erreur chargement métriques: ${error.message}`);
    
    const total = prospects?.length || 0;
    const qualified = prospects?.filter(p => p.lead_score && p.lead_score > 70).length || 0;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyProspects = prospects?.filter(p => new Date(p.created_at) >= thisMonth).length || 0;
    
    return {
      total_prospects: total,
      qualified_prospects: qualified,
      monthly_growth: monthlyProspects,
      conversion_rate: total > 0 ? (qualified / total) * 100 : 0
    };
  }

  // ========== AUTH ==========
  async signIn(email: string, password: string) {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!user) throw new Error('No user returned after sign in');

    const isAdmin = user.app_metadata?.role === 'admin';
    if (!isAdmin) {
      await supabase.auth.signOut();
      throw new Error('Accès non autorisé. Seuls les administrateurs peuvent se connecter.');
    }

    return { user, isAdmin };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // ========== AUTOMATION CONFIG ==========
  async getAutomationConfig() {
    const { data, error } = await supabase
      .from('automation_config')
      .select('*')
      .eq('id', 'main')
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Erreur chargement config automation: ${error.message}`);
    }
    
    return data;
  }
  
  async saveAutomationConfig(isActive: boolean, config: any) {
    const { data, error } = await supabase
      .from('automation_config')
      .upsert({
        id: 'main',
        is_active: isActive,
        config: config,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw new Error(`Erreur sauvegarde config automation: ${error.message}`);
    return data;
  }
}

export const supabaseService = new SupabaseService();