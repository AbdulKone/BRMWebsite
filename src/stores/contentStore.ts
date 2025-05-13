import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Project, Artist, Service } from '../lib/types';

interface ContentStore {
  projects: Project[];
  artists: Artist[];
  services: Service[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchArtists: () => Promise<void>;
  fetchServices: () => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'display_order'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProjectOrder: (id: string, newOrder: number) => Promise<void>;
  createArtist: (artist: Omit<Artist, 'id' | 'created_at' | 'display_order'>) => Promise<void>;
  updateArtist: (id: string, artist: Partial<Artist>) => Promise<void>;
  deleteArtist: (id: string) => Promise<void>;
  updateArtistOrder: (id: string, newOrder: number) => Promise<void>;
  createService: (service: Omit<Service, 'id' | 'created_at'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

export const useContentStore = create<ContentStore>((set, get) => ({
  projects: [],
  artists: [],
  services: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      set({ projects: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchArtists: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      set({ artists: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchServices: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;

      const { data: features, error: featuresError } = await supabase
        .from('service_features')
        .select('*');

      if (featuresError) throw featuresError;

      const servicesWithFeatures = (services || []).map(service => ({
        ...service,
        features: (features || [])
          .filter(f => f.service_id === service.id)
          .map(f => f.feature)
      }));

      set({ services: servicesWithFeatures });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (project) => {
    set({ isLoading: true, error: null });
    try {
      // Get max display_order
      const { data: maxOrder } = await supabase
        .from('projects')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const newOrder = (maxOrder?.display_order || 0) + 1;

      const { error } = await supabase
        .from('projects')
        .insert([{ ...project, display_order: newOrder }])
        .select()
        .single();

      if (error) throw error;
      await get().fetchProjects();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (id, project) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('projects')
        .update(project)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await get().fetchProjects();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchProjects();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProjectOrder: async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      await get().fetchProjects();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  createArtist: async (artist) => {
    try {
      // Get max display_order
      const { data: maxOrder } = await supabase
        .from('artists')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const newOrder = (maxOrder?.display_order || 0) + 1;

      const { error } = await supabase
        .from('artists')
        .insert([{ ...artist, display_order: newOrder }]);

      if (error) throw error;
      await get().fetchArtists();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateArtist: async (id, artist) => {
    try {
      const { error } = await supabase
        .from('artists')
        .update(artist)
        .eq('id', id);

      if (error) throw error;
      await get().fetchArtists();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteArtist: async (id) => {
    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchArtists();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateArtistOrder: async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('artists')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      await get().fetchArtists();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  createService: async (service) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{
          title: service.title,
          description: service.description,
          icon: service.icon
        }])
        .select()
        .single();

      if (error) throw error;

      if (service.features && service.features.length > 0) {
        const features = service.features.map(feature => ({
          service_id: data.id,
          feature
        }));

        const { error: featuresError } = await supabase
          .from('service_features')
          .insert(features);

        if (featuresError) throw featuresError;
      }

      await get().fetchServices();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateService: async (id, service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({
          title: service.title,
          description: service.description,
          icon: service.icon
        })
        .eq('id', id);

      if (error) throw error;

      if (service.features) {
        const { error: deleteError } = await supabase
          .from('service_features')
          .delete()
          .eq('service_id', id);

        if (deleteError) throw deleteError;

        const features = service.features.map(feature => ({
          service_id: id,
          feature
        }));

        const { error: featuresError } = await supabase
          .from('service_features')
          .insert(features);

        if (featuresError) throw featuresError;
      }

      await get().fetchServices();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteService: async (id) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchServices();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));