import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MenuIcon, X, ChevronDown, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Menu } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, signOut } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.classList.toggle('mobile-menu-open');
  };

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('mobile-menu-open');
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setServicesOpen(false);
    document.body.classList.remove('mobile-menu-open');
  }, [location]);

  const navigationItems = [
    { name: 'Accueil', path: '/' },
    { name: 'Projets', path: '/projets' },
  ];

  const menuVariants = {
    closed: {
      opacity: 0,
      transition: { duration: 0.2 }
    },
    open: {
      opacity: 1,
      transition: { duration: 0.2 }
    }
  };

  const containerVariants = {
    closed: {
      transition: { staggerChildren: 0.05, staggerDirection: -1 }
    },
    open: {
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    closed: { opacity: 0, x: -20 },
    open: { opacity: 1, x: 0 }
  };

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? 'bg-black shadow-md'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center z-50">
            <span className="text-2xl md:text-3xl font-heading font-bold gold-gradient">
              BlackRoadMusic
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`link-underline font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-accent-400'
                      : 'text-white hover:text-accent-400'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Services Dropdown */}
              <Menu as="div" className="relative">
                {({ open }) => (
                  <>
                    <Menu.Button 
                      className="flex items-center space-x-1 font-medium text-white hover:text-accent-400 transition-colors"
                    >
                      <span>Services</span>
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          open ? 'rotate-180' : ''
                        }`} 
                      />
                    </Menu.Button>
                    <Menu.Items 
                      className="absolute right-0 mt-2 w-56 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg py-2 focus:outline-none"
                    >
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/services"
                            className={`block px-4 py-2 text-sm ${
                              active ? 'bg-accent-600/10 text-accent-400' : 'text-white'
                            }`}
                          >
                            Nos services
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/reserver"
                            className={`block px-4 py-2 text-sm ${
                              active ? 'bg-accent-600/10 text-accent-400' : 'text-white'
                            }`}
                          >
                            Réserver
                          </Link>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </>
                )}
              </Menu>

              <Link
                to="/contact"
                className={`link-underline font-medium transition-colors ${
                  location.pathname === '/contact'
                    ? 'text-accent-400'
                    : 'text-white hover:text-accent-400'
                }`}
              >
                Contact
              </Link>
            </div>

            {isAuthenticated && isAdmin && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/backstage"
                  className={`font-medium transition-colors ${
                    location.pathname.startsWith('/backstage')
                      ? 'text-accent-400'
                      : 'text-white hover:text-accent-400'
                  }`}
                >
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-white hover:text-accent-400 transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex items-center text-white p-2 z-50"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-6 w-6 text-accent-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <MenuIcon className="h-6 w-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuVariants}
              className="fixed inset-0 top-[72px] bg-black z-40"
            >
              <motion.nav
                variants={containerVariants}
                className="flex flex-col w-full h-full overflow-auto py-6"
              >
                {navigationItems.map((item) => (
                  <motion.div key={item.name} variants={itemVariants}>
                    <Link
                      to={item.path}
                      className={`block py-3 px-6 text-xl font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'text-accent-400'
                          : 'text-white hover:text-accent-400'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}

                <motion.div variants={itemVariants}>
                  <button
                    onClick={() => setServicesOpen(!servicesOpen)}
                    className="w-full py-3 px-6 text-xl font-medium text-left flex items-center justify-between text-white hover:text-accent-400 transition-colors"
                  >
                    <span>Services</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-200 ${
                        servicesOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {servicesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-primary-900/50"
                      >
                        <Link
                          to="/services"
                          className="block py-2 px-8 text-sm text-gray-300 hover:text-accent-400 transition-colors"
                        >
                          Nos services
                        </Link>
                        <Link
                          to="/reserver"
                          className="block py-2 px-8 text-sm text-gray-300 hover:text-accent-400 transition-colors"
                        >
                          Réserver
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Link
                    to="/contact"
                    className={`block py-3 px-6 text-xl font-medium transition-colors ${
                      location.pathname === '/contact'
                        ? 'text-accent-400'
                        : 'text-white hover:text-accent-400'
                    }`}
                  >
                    Contact
                  </Link>
                </motion.div>

                {isAuthenticated && isAdmin && (
                  <>
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/backstage"
                        className={`block py-3 px-6 text-xl font-medium transition-colors ${
                          location.pathname.startsWith('/backstage')
                            ? 'text-accent-400'
                            : 'text-white hover:text-accent-400'
                        }`}
                      >
                        Admin
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <button
                        onClick={handleLogout}
                        className="w-full py-3 px-6 text-xl font-medium text-left flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Se déconnecter</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;