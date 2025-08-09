import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './components/home/HomePage';
import ProjectsPage from './components/projects/ProjectsPage';
import ServicesPage from './components/services/ServicesPage';
import ContactPage from './components/contact/ContactPage';
import PrivacyPage from './components/legal/PrivacyPage';
import LegalNoticePage from './components/legal/LegalNoticePage';
import AdminDashboard from './components/admin/AdminDashboard';
import BookingPage from './components/booking/BookingPage';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UnsubscribeManager from './components/prospection/UnsubscribeManager';
import { useAuthStore } from './stores/authStore';
import { Toaster } from 'react-hot-toast';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projets" element={<ProjectsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/politique-de-confidentialite" element={<PrivacyPage />} />
        <Route path="/mentions-legales" element={<LegalNoticePage />} />
        <Route path="/reserver" element={<BookingPage />} />
        <Route path="/unsubscribe" element={<UnsubscribeManager />} />
        <Route path="/backstage/login" element={<LoginPage />} />
        <Route
          path="/backstage/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </Layout>
  );
}

export default App;