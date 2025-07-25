import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StudioBooking, ContactMessage } from '../lib/types';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface AdminStore {
  bookings: StudioBooking[];
  messages: ContactMessage[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  setPagination: (pagination: Partial<PaginationState>) => void;
  fetchBookings: () => Promise<void>;
  fetchMessages: () => Promise<void>;
  updateBookingStatus: (id: string, status: StudioBooking['status']) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  updateMessageStatus: (id: string, status: ContactMessage['status']) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  bookings: [],
  messages: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },

  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  fetchBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { pagination } = get();
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const { data, error, count } = await supabase
        .from('studio_bookings')
        .select('*', { count: 'exact' })
        .order('date', { ascending: true })
        .range(from, to);

      if (error) throw error;
      set({ 
        bookings: data,
        pagination: { ...get().pagination, total: count || 0 }
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async () => {
    // Vérifier l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Utilisateur connecté:', user);
    console.log('🔑 Métadonnées utilisateur:', user?.user_metadata);
    
    console.log('🔍 Début de fetchMessages');
    set({ isLoading: true, error: null });
    try {
      const { pagination } = get();
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      console.log('📄 Pagination:', { from, to, page: pagination.page, pageSize: pagination.pageSize });
      
      const { data, error, count } = await supabase
        .from('contact_messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      console.log('📊 Résultat Supabase:', { data, error, count });
      console.log('📝 Nombre de messages récupérés:', data?.length || 0);
      
      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }
      
      set({ 
        messages: data || [],
        pagination: { ...get().pagination, total: count || 0 }
      });
      
      console.log('✅ Messages mis à jour dans le store:', data?.length || 0);
    } catch (error) {
      console.error('💥 Erreur dans fetchMessages:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateBookingStatus: async (id: string, status: StudioBooking['status']) => {
    try {
      const { error } = await supabase
        .from('studio_bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await get().fetchBookings();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteBooking: async (id: string) => {
    try {
      const { error } = await supabase
        .from('studio_bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchBookings();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateMessageStatus: async (id: string, status: ContactMessage['status']) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      await get().fetchMessages();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteMessage: async (id: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchMessages();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));