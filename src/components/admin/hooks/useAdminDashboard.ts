import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdminStore } from '../../../stores/adminStore';
import { useContentStore } from '../../../stores/contentStore';
import { useProspectionStore } from '../../../stores/prospectionStore';
import { navigationItems } from '../constants/navigationItems';
import { useErrorStore } from '../../../stores/errorStore';

export const useAdminDashboard = () => {
  const location = useLocation();
  const { fetchBookings, fetchMessages } = useAdminStore();
  const { fetchProjects, fetchArtists, fetchServices } = useContentStore();
  const { loadProspects } = useProspectionStore();
  const { handleError } = useErrorStore();

  const getCurrentPageTitle = useCallback(() => {
    const currentItem = navigationItems.find(item => 
      item.path === location.pathname || 
      (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'))
    );
    return currentItem ? currentItem.label : 'Dashboard';
  }, [location.pathname]);

  const handleDataFetching = useCallback(async () => {
    try {
      await Promise.all([
        fetchBookings(),
        fetchMessages(),
        fetchProjects(),
        fetchArtists(),
        fetchServices(),
        loadProspects()
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      handleError('Erreur lors du chargement des données du dashboard', errorMessage);
    }
  }, [fetchBookings, fetchMessages, fetchProjects, fetchArtists, fetchServices, loadProspects, handleError]);

  return {
    currentPageTitle: getCurrentPageTitle(),
    handleDataFetching
  };
};