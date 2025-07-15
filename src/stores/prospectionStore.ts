import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Prospect {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'interested' | 'not_interested';
  last_contact: string;
  notes: string;
  created_at: string;
}

interface ProspectionState {
  prospects: Prospect[];
  isLoading: boolean;
  error: string | null;
  fetchProspects: () => Promise<void>;
  addProspect: (prospect: Omit<Prospect, 'id' | 'created_at'>) => Promise<void>;
  updateProspect: (id: string, data: Partial<Prospect>) => Promise<void>;
  deleteProspect: (id: string) => Promise<void>;
}

export const useProspectionStore = create<ProspectionState>((set, get) => ({
  prospects: [],
  isLoading: false,
  error: null,

  fetchProspects: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ prospects: data });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addProspect: async (prospect) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('prospects')
        .insert([prospect]);

      if (error) throw error;
      get().fetchProspects();
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProspect: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('prospects')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      get().fetchProspects();
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProspect: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      get().fetchProspects();
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));