import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Prospect {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'interested' | 'not_interested';
  last_contact: string;
  created_at: string;
  updated_at: string;
}

interface ProspectionState {
  prospects: Prospect[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProspects: () => Promise<void>;
  addProspect: (prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProspect: (id: string, updates: Partial<Prospect>) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProspectionStore = create<ProspectionState>((set, get) => ({
  prospects: [],
  isLoading: false,
  error: null,

  loadProspects: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ prospects: data || [], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des prospects',
        isLoading: false 
      });
    }
  },

  addProspect: async (prospectData) => {
    set({ error: null });
    try {
      const { data, error } = await supabase
        .from('prospects')
        .insert([prospectData])
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({
        prospects: [data, ...state.prospects]
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du prospect'
      });
      throw error;
    }
  },

  updateProspect: async (id, updates) => {
    set({ error: null });
    try {
      const { data, error } = await supabase
        .from('prospects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({
        prospects: state.prospects.map(p => p.id === id ? data : p)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du prospect'
      });
      throw error;
    }
  },

  deleteProspect: async (id) => {
    set({ error: null });
    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      set(state => ({
        prospects: state.prospects.filter(p => p.id !== id)
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la suppression du prospect'
      });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));