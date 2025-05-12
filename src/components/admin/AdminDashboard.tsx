import { useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdminStore } from '../../stores/adminStore';
import { useContentStore } from '../../stores/contentStore';
import BookingsList from './BookingsList';
import MessagesList from './MessagesList';
import ProjectsAdmin from './ProjectsAdmin';
import ArtistsAdmin from './ArtistsAdmin';
import ServicesAdmin from './ServicesAdmin';

const AdminDashboard = () => {
  const location = useLocation();
  const { fetchBookings, fetchMessages } = useAdminStore();
  const { fetchProjects, fetchArtists, fetchServices } = useContentStore();

  useEffect(() => {
    fetchBookings();
    fetchMessages();
    fetchProjects();
    fetchArtists();
    fetchServices();
  }, []);

  // Rediriger vers /backstage si on est à la racine de /backstage/*
  if (location.pathname === '/backstage') {
    return <Navigate to="/backstage/bookings" replace />;
  }

  return (
    <div className="pt-24 pb-20 bg-black min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-heading font-bold mb-8 gold-gradient">
            Dashboard Administrateur
          </h1>

          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              to="/backstage/bookings"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/backstage/bookings'
                  ? 'bg-accent-600 text-white'
                  : 'bg-primary-800 text-gray-300 hover:bg-primary-700'
              }`}
            >
              Réservations
            </Link>
            <Link
              to="/backstage/messages"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/backstage/messages'
                  ? 'bg-accent-600 text-white'
                  : 'bg-primary-800 text-gray-300 hover:bg-primary-700'
              }`}
            >
              Messages
            </Link>
            <Link
              to="/backstage/projects"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/backstage/projects'
                  ? 'bg-accent-600 text-white'
                  : 'bg-primary-800 text-gray-300 hover:bg-primary-700'
              }`}
            >
              Projets
            </Link>
            <Link
              to="/backstage/artists"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/backstage/artists'
                  ? 'bg-accent-600 text-white'
                  : 'bg-primary-800 text-gray-300 hover:bg-primary-700'
              }`}
            >
              Artistes
            </Link>
            <Link
              to="/backstage/services"
              className={`px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/backstage/services'
                  ? 'bg-accent-600 text-white'
                  : 'bg-primary-800 text-gray-300 hover:bg-primary-700'
              }`}
            >
              Services
            </Link>
          </div>

          <Routes>
            <Route path="/bookings" element={<BookingsList />} />
            <Route path="/messages" element={<MessagesList />} />
            <Route path="/projects" element={<ProjectsAdmin />} />
            <Route path="/artists" element={<ArtistsAdmin />} />
            <Route path="/services" element={<ServicesAdmin />} />
            <Route path="*" element={<Navigate to="/backstage/bookings" replace />} />
          </Routes>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;