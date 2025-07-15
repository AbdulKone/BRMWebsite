import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!user) throw new Error('No user returned after sign in');

      // Vérifier le rôle dans app_metadata
      const isAdmin = user.app_metadata?.role === 'admin';

      if (!isAdmin) {
        await supabase.auth.signOut();
        throw new Error('Accès non autorisé. Seuls les administrateurs peuvent se connecter.');
      }

      set({ isAuthenticated: true, isAdmin: true });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        isAuthenticated: false,
        isAdmin: false 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ isAuthenticated: false, isAdmin: false });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ isAuthenticated: false, isAdmin: false });
        return;
      }

      // Vérifier le rôle dans app_metadata
      const isAdmin = session.user.app_metadata?.role === 'admin';
      
      set({ 
        isAuthenticated: !!session,
        isAdmin: isAdmin
      });
    } catch (error) {
      set({ 
        error: (error as Error).message,
        isAuthenticated: false,
        isAdmin: false 
      });
    } finally {
      set({ isLoading: false });
    }
  },

  initialize: () => {
    // Vérifier la session actuelle
    get().checkAuth();

    // Écouter les changements d'état d'authentification
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT' || !session) {
        set({ 
          isAuthenticated: false, 
          isAdmin: false, 
          isLoading: false,
          error: null 
        });
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const isAdmin = session.user.app_metadata?.role === 'admin';
        
        if (!isAdmin) {
          await supabase.auth.signOut();
          set({ 
            isAuthenticated: false, 
            isAdmin: false, 
            isLoading: false,
            error: 'Accès non autorisé. Seuls les administrateurs peuvent se connecter.' 
          });
          return;
        }

        set({ 
          isAuthenticated: true, 
          isAdmin: true, 
          isLoading: false,
          error: null 
        });
      }
    });
  },
}));