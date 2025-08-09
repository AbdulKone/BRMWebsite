import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useErrorStore } from './errorStore';

interface AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  // Suppression de l'état error local
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur de connexion', (error as Error).message);
      set({ 
        isAuthenticated: false,
        isAdmin: false 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ isAuthenticated: false, isAdmin: false });
    } catch (error) {
      const { handleError } = useErrorStore.getState();
      handleError('Erreur lors de la déconnexion', (error as Error).message);
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
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
      const { handleError } = useErrorStore.getState();
      handleError('Erreur de vérification d\'authentification', (error as Error).message);
      set({ 
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
      // Suppression du console.log
      
      if (event === 'SIGNED_OUT' || !session) {
        set({ 
          isAuthenticated: false, 
          isAdmin: false, 
          isLoading: false
        });
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const isAdmin = session.user.app_metadata?.role === 'admin';
        
        if (!isAdmin) {
          await supabase.auth.signOut();
          const { handleError } = useErrorStore.getState();
          handleError('Accès refusé', 'Seuls les administrateurs peuvent se connecter.');
          set({ 
            isAuthenticated: false, 
            isAdmin: false, 
            isLoading: false
          });
          return;
        }

        set({ 
          isAuthenticated: true, 
          isAdmin: true, 
          isLoading: false
        });
      }
    });
  },
}));