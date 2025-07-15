import { useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import { useContentStore } from '../../stores/contentStore';
import { useProspectionStore } from '../../stores/prospectionStore';
import BookingsList from './BookingsList';
import MessagesList from './MessagesList';
import ProjectsAdmin from './ProjectsAdmin';
import ArtistsAdmin from './ArtistsAdmin';
import ServicesAdmin from './ServicesAdmin';
import ProspectionDashboard from '../prospection/ProspectionDashboard';
import { Calendar, MessageCircle, FolderOpen, Users, Settings, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();
  const { fetchBookings, fetchMessages } = useAdminStore();
  const { fetchProjects, fetchArtists, fetchServices } = useContentStore();
  const { loadProspects } = useProspectionStore();

  useEffect(() => {
    fetchBookings();
    fetchMessages();
    fetchProjects();
    fetchArtists();
    fetchServices();
    loadProspects();
  }, []);

  if (location.pathname === '/backstage') {
    return <Navigate to="/backstage/bookings" replace />;
  }

  const navigationItems = [
    {
      path: '/backstage/bookings',
      label: 'Réservations',
      icon: Calendar,
      description: 'Gérer les réservations'
    },
    {
      path: '/backstage/messages',
      label: 'Messages',
      icon: MessageCircle,
      description: 'Messages clients'
    },
    {
      path: '/backstage/projects',
      label: 'Projets',
      icon: FolderOpen,
      description: 'Portfolio projets'
    },
    {
      path: '/backstage/artists',
      label: 'Artistes',
      icon: Users,
      description: 'Équipe artistique'
    },
    {
      path: '/backstage/services',
      label: 'Services',
      icon: Settings,
      description: 'Offres de services'
    },
    {
      path: '/backstage/prospection',
      label: 'Prospection',
      icon: TrendingUp,
      description: 'CRM & Campagnes'
    }
  ];

  const getCurrentPageTitle = () => {
    const currentItem = navigationItems.find(item => 
      item.path === location.pathname || 
      (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'))
    );
    return currentItem ? currentItem.label : 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header Dashboard avec titre dynamique */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {getCurrentPageTitle()}
              </h1>
              <p className="text-sm text-gray-400">
                {navigationItems.find(item => 
                  item.path === location.pathname || 
                  (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'))
                )?.description || 'Tableau de bord administrateur'}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation moderne avec icônes */}
      <nav className="fixed top-32 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === location.pathname || 
                (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap min-w-fit ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25 scale-105'
                      : 'text-gray-300 hover:bg-gray-800/80 hover:text-white hover:scale-102'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  
                  {/* Indicateur actif */}
                  {isActive && (
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  )}
                  
                  {/* Tooltip au hover */}
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.description}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Contenu principal avec espacement optimisé */}
      <main className="pt-44 pb-8">
        <div className="container mx-auto px-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
            <Routes>
              <Route path="/bookings" element={<BookingsList />} />
              <Route path="/messages" element={<MessagesList />} />
              <Route path="/projects" element={<ProjectsAdmin />} />
              <Route path="/artists" element={<ArtistsAdmin />} />
              <Route path="/services" element={<ServicesAdmin />} />
              <Route path="/prospection" element={<ProspectionDashboard />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;