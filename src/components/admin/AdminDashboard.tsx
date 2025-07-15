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
      <nav className="bg-gray-900 p-4 sticky top-20 z-40">
        <div className="container mx-auto flex space-x-4 overflow-x-auto">
          <Link
            to="/backstage/bookings"
            className={`px-4 py-2 rounded whitespace-nowrap ${location.pathname === '/backstage/bookings' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            Réservations
          </Link>
          <Link
            to="/backstage/messages"
            className={`px-4 py-2 rounded whitespace-nowrap ${location.pathname === '/backstage/messages' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            Messages
          </Link>
          <Link
            to="/backstage/projects"
            className={`px-4 py-2 rounded whitespace-nowrap ${location.pathname === '/backstage/projects' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            Projets
          </Link>
          <Link
            to="/backstage/artists"
            className={`px-4 py-2 rounded whitespace-nowrap ${location.pathname === '/backstage/artists' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            Artistes
          </Link>
          <Link
            to="/backstage/services"
            className={`px-4 py-2 rounded whitespace-nowrap ${location.pathname === '/backstage/services' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            Services
          </Link>
          <Link
            to="/backstage/prospection"
            className={`px-4 py-2 rounded whitespace-nowrap ${location.pathname.startsWith('/backstage/prospection') ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
          >
            Prospection
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
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