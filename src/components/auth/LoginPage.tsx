import { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { Lock } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Suppression de: error
  const { signIn, isAuthenticated, isAdmin, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      // Rediriger vers la page demandée ou /backstage/bookings par défaut
      const from = (location.state as any)?.from || '/backstage/bookings';
      navigate(from, { replace: true });
    } catch (error) {
      // Error is already handled in the store
    }
  };

  if (isAuthenticated && isAdmin) {
    const from = (location.state as any)?.from || '/backstage/bookings';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="pt-24 pb-20 bg-black min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-600/10 mb-4">
              <Lock className="w-8 h-8 text-accent-400" />
            </div>
            <h1 className="text-4xl font-heading font-bold mb-4 gold-gradient">
              Espace Administration
            </h1>
            <p className="text-gray-400">
              Accédez à votre espace de gestion sécurisé
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-primary-900 rounded-xl p-8 space-y-6">
            {/* Suppression du bloc d'affichage d'erreur */}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg focus:ring-2 focus:ring-accent-500 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg focus:ring-2 focus:ring-accent-500 text-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isLoading
                  ? 'bg-accent-700 cursor-not-allowed'
                  : 'bg-accent-600 hover:bg-accent-700'
              } text-white`}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;