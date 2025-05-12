import { Link } from 'react-router-dom';
import { Instagram, Youtube, Music, Video } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import socialLinks from '../../data/social';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuthStore();

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />;
      case 'youtube':
        return <Youtube className="h-5 w-5" />;
      case 'music':
        return <Music className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <footer className="bg-primary-950 pt-12 pb-6">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="text-2xl font-heading font-bold gold-gradient mb-4">
              BlackRoadMusic
            </h4>
            <p className="text-gray-400 max-w-md">
              Label de production musicale et visuelle spécialisé dans les musiques
              urbaines et l'accompagnement artistique complet.
            </p>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-4">Navigation</h5>
            <ul className="space-y-2">
              {[
                { name: 'Accueil', path: '/' },
                { name: 'Projets', path: '/projets' },
                { name: 'Services', path: '/services' },
                { name: 'Contact', path: '/contact' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-gray-400 hover:text-accent-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-4">Suivez-nous</h5>
            <div className="flex flex-wrap gap-4 mb-6">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-800 p-2.5 rounded-full text-white hover:bg-accent-700 transition-colors"
                  aria-label={link.platform}
                >
                  {getIconComponent(link.icon)}
                </a>
              ))}
            </div>
            <p className="text-gray-400">
              Email: contact@blackroadmusic.com
            </p>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-4">Informations Légales</h5>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/mentions-legales"
                  className="text-gray-400 hover:text-accent-400 transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  to="/politique-de-confidentialite"
                  className="text-gray-400 hover:text-accent-400 transition-colors"
                >
                  Politique de confidentialité
                </Link>
              </li>
              {!isAuthenticated && (
                <li>
                  <Link
                    to="/backstage/login"
                    className="text-gray-500 hover:text-accent-400 transition-colors text-sm"
                  >
                    Espace administration
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              &copy; {currentYear} Black Road Music. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link to="/mentions-legales" className="hover:text-accent-400 transition-colors">
                Mentions légales
              </Link>
              <Link to="/politique-de-confidentialite" className="hover:text-accent-400 transition-colors">
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;