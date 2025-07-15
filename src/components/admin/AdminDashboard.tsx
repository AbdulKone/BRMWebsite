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

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Navigation fixe avec z-index élevé */}
      <nav className="fixed top-20 left-0 right-0 bg-gray-900 p-4 z-50 shadow-lg border-b border-gray-700">
        <div className="container mx-auto flex space-x-4 overflow-x-auto">
          <Link
            to="/backstage/bookings"
            className={`px-4 py-2 rounded whitespace-nowrap transition-colors duration-200 ${
              location.pathname === '/backstage/bookings' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Réservations
          </Link>
          <Link
            to="/backstage/messages"
            className={`px-4 py-2 rounded whitespace-nowrap transition-colors duration-200 ${
              location.pathname === '/backstage/messages' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Messages
          </Link>
          <Link
            to="/backstage/projects"
            className={`px-4 py-2 rounded whitespace-nowrap transition-colors duration-200 ${
              location.pathname === '/backstage/projects' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Projets
          </Link>
          <Link
            to="/backstage/artists"
            className={`px-4 py-2 rounded whitespace-nowrap transition-colors duration-200 ${
              location.pathname === '/backstage/artists' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Artistes
          </Link>
          <Link
            to="/backstage/services"
            className={`px-4 py-2 rounded whitespace-nowrap transition-colors duration-200 ${
              location.pathname === '/backstage/services' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Services
          </Link>
          <Link
            to="/backstage/prospection"
            className={`px-4 py-2 rounded whitespace-nowrap transition-colors duration-200 ${
              location.pathname.startsWith('/backstage/prospection') 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            Prospection
          </Link>
        </div>
      </nav>

      {/* Contenu principal avec padding-top pour compenser la navigation fixe */}
      <main className="container mx-auto px-4 py-8 pt-32">
        <Routes>
          <Route path="/bookings" element={<BookingsList />} />
          <Route path="/messages" element={<MessagesList />} />
          <Route path="/projects" element={<ProjectsAdmin />} />
          <Route path="/artists" element={<ArtistsAdmin />} />
          <Route path="/services" element={<ServicesAdmin />} />
          <Route path="/prospection" element={<ProspectionDashboard />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;