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
  }, [fetchBookings, fetchMessages, fetchProjects, fetchArtists, fetchServices, loadProspects]);

  if (location.pathname === '/backstage') {
    return <Navigate to="/backstage/bookings" replace />;
  }

  const navigationItems = [
    {
      path: '/backstage/bookings',
      label: 'Réservations',
      icon: Calendar
    },
    {
      path: '/backstage/messages',
      label: 'Messages',
      icon: MessageCircle
    },
    {
      path: '/backstage/projects',
      label: 'Projets',
      icon: FolderOpen
    },
    {
      path: '/backstage/artists',
      label: 'Artistes',
      icon: Users
    },
    {
      path: '/backstage/services',
      label: 'Services',
      icon: Settings
    },
    {
      path: '/backstage/prospection',
      label: 'Prospection',
      icon: TrendingUp
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
      {/* Header principal avec navigation */}
      <header className="fixed top-16 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Titre de la page */}
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {getCurrentPageTitle()}
              </h1>
            </div>
            
            {/* Menu burger mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:block border-t border-gray-700">
            <div className="flex space-x-8 py-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === location.pathname || 
                  (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Navigation mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === location.pathname || 
                  (item.path === '/backstage/prospection' && location.pathname.startsWith('/backstage/prospection'));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Contenu principal */}
      <main className={`transition-all duration-300 ${
        isMobileMenuOpen ? 'pt-80' : 'pt-32 md:pt-40'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50">
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
