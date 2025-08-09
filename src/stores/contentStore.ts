import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Project, Artist, Service } from '../lib/types';
import { useErrorStore } from './errorStore';

interface ContentStore {
  projects: Project[];
  artists: Artist[];
  services: Service[];
  isLoading: boolean;
  // Suppression de l'état error local
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
  updateServiceOrder: (id: string, newOrder: number) => Promise<void>;
  reorderItems: <T extends { id: string; display_order?: number }>(
    items: T[],
    startIndex: number,
    endIndex: number,
    updateFunction: (id: string, order: number) => Promise<void>
  ) => Promise<T[]>;
}

export const useContentStore = create<ContentStore>((set, get) => ({
  projects: [],
  artists: [],
  services: [],
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      set({ projects: data || [] });
    } catch (error) {
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors du chargement des projets', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchArtists: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      set({ artists: data || [] });
    } catch (error) {
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors du chargement des artistes', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchServices: async () => {
    set({ isLoading: true });
    try {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });

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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors du chargement des services', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (project) => {
    set({ isLoading: true });
    try {
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la création du projet', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (id, project) => {
    set({ isLoading: true });
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la mise à jour du projet', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchProjects();
    } catch (error) {
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la suppression du projet', (error as Error).message);
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors du réordonnancement du projet', (error as Error).message);
    }
  },

  createArtist: async (artist) => {
    set({ isLoading: true });
    try {
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la création de l\'artiste', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  updateArtist: async (id, artist) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('artists')
        .update(artist)
        .eq('id', id);

      if (error) throw error;
      await get().fetchArtists();
    } catch (error) {
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la mise à jour de l\'artiste', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteArtist: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchArtists();
    } catch (error) {
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la suppression de l\'artiste', (error as Error).message);
    } finally {
      set({ isLoading: false });
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors du réordonnancement de l\'artiste', (error as Error).message);
    }
  },

  createService: async (service) => {
    set({ isLoading: true });
    try {
      const { data: maxOrder } = await supabase
        .from('services')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      const newOrder = (maxOrder?.display_order || 0) + 1;

      const { data, error } = await supabase
        .from('services')
        .insert([{
          title: service.title,
          description: service.description,
          icon: service.icon,
          price: service.price,
          display_order: newOrder
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la création du service', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  updateService: async (id, service) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('services')
        .update({
          title: service.title,
          description: service.description,
          icon: service.icon,
          price: service.price
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la mise à jour du service', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteService: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchServices();
    } catch (error) {
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la suppression du service', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  updateServiceOrder: async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ display_order: newOrder })
        .eq('id', id);

      if (error) throw error;
      await get().fetchServices();
    } catch (error) {
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors du réordonnancement du service', (error as Error).message);
    }
  },

  reorderItems: async <T extends { id: string; display_order?: number }>(
    items: T[],
    startIndex: number,
    endIndex: number,
    updateFunction: (id: string, order: number) => Promise<void>
  ) => {
    const result = Array.from(items);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Mettre à jour l'ordre dans la base de données
    for (let i = 0; i < result.length; i++) {
      if (result[i].display_order !== i + 1) {
        await updateFunction(result[i].id, i + 1);
      }
    }

    return result;
  },
}));