import { useEffect, useState } from 'react';
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
import { Calendar, MessageCircle, FolderOpen, Users, Settings, TrendingUp, Menu, X } from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();
  const { fetchBookings, fetchMessages } = useAdminStore();
  const { fetchProjects, fetchArtists, fetchServices } = useContentStore();
  const { loadProspects } = useProspectionStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      shortLabel: 'Réserv.',
      icon: Calendar,
      description: 'Gérer les réservations'
    },
    {
      path: '/backstage/messages',
      label: 'Messages',
      shortLabel: 'Msg',
      icon: MessageCircle,
      description: 'Messages clients'
    },
    {
      path: '/backstage/projects',
      label: 'Projets',
      shortLabel: 'Proj.',
      icon: FolderOpen,
      description: 'Portfolio projets'
    },
    {
      path: '/backstage/artists',
      label: 'Artistes',
      shortLabel: 'Art.',
      icon: Users,
      description: 'Équipe artistique'
    },
    {
      path: '/backstage/services',
      label: 'Services',
      shortLabel: 'Serv.',
      icon: Settings,
      description: 'Offres de services'
    },
    {
      path: '/backstage/prospection',
      label: 'Prospection',
      shortLabel: 'CRM',
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
      {/* Header Dashboard avec titre dynamique - Responsive */}
      <div className="fixed top-16 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white mb-1 truncate">
                {getCurrentPageTitle()}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                {navigationItems.find(item => 
                  item.path === location.pathname || 
                  (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'))
                )?.description || 'Tableau de bord administrateur'}
              </p>
            </div>
            
            {/* Menu burger pour mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Date - cachée sur mobile */}
            <div className="text-xs text-gray-500 hidden md:block ml-4">
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

      {/* Navigation Desktop */}
      <nav className="hidden md:block fixed top-24 sm:top-28 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === location.pathname || 
                (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 whitespace-nowrap min-w-fit ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25 scale-105'
                      : 'text-gray-300 hover:bg-gray-800/80 hover:text-white hover:scale-102'
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  <span className="font-medium text-xs sm:text-sm">
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.shortLabel}</span>
                  </span>
                  
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

      {/* Navigation Mobile - Menu déroulant */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-20 sm:top-24 left-0 right-0 z-40 bg-gray-900/98 backdrop-blur-sm shadow-xl border-b border-gray-700">
          <div className="container mx-auto px-3 py-4">
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === location.pathname || 
                  (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-6 h-6 transition-transform duration-300 ${
                      isActive ? 'scale-110' : ''
                    }`} />
                    <span className="font-medium text-xs text-center">{item.shortLabel}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal avec espacement optimisé - Responsive */}
      <main className={`pb-8 transition-all duration-300 ${
        isMobileMenuOpen 
          ? 'pt-48 sm:pt-52' 
          : 'pt-32 sm:pt-40 md:pt-44'
      }`}>
        <div className="container mx-auto px-3 sm:px-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
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