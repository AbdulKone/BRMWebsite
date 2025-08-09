import { create } from 'zustand';
import toast from 'react-hot-toast';

interface ErrorState {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  // Nouvelles fonctions utilitaires
  getErrorMessage: (error: unknown) => string;
  handleError: (error: unknown, prefix?: string) => string;
  handleSuccess: (message: string) => void;
  handleWarning: (message: string) => void;
}

/**
 * Extrait un message d'erreur lisible depuis une erreur unknown
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Erreur inconnue';
};

export const useErrorStore = create<ErrorState>(() => ({
  showError: (message: string) => {
    toast.error(message);
  },
  showSuccess: (message: string) => {
    toast.success(message);
  },
  showWarning: (message: string) => {
    toast(message, { icon: '⚠️' });
  },
  
  // Nouvelles fonctions utilitaires
  getErrorMessage,
  
  handleError: (error: unknown, prefix?: string) => {
    const message = getErrorMessage(error);
    const fullMessage = prefix ? `${prefix}: ${message}` : message;
    toast.error(fullMessage);
    return message;
  },
  
  handleSuccess: (message: string) => {
    toast.success(message);
  },
  
  handleWarning: (message: string) => {
    toast(message, { icon: '⚠️' });
  }
}));

// Fonctions utilitaires exportées pour usage direct
export const errorUtils = {
  getErrorMessage,
  
  /**
   * Wrapper pour les fonctions async avec gestion d'erreur automatique
   */
  withErrorHandling: async <T>(
    fn: () => Promise<T>,
    errorPrefix?: string
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error: unknown) {
      useErrorStore.getState().handleError(error, errorPrefix);
      return null;
    }
  }
};