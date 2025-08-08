import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { NavigationItem } from '../constants/navigationItems';

interface AdminHeaderProps {
  currentPageTitle: string;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  navigationItems: NavigationItem[];
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentPageTitle,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  navigationItems
}) => {
  const location = useLocation();

  return (
    <header className="fixed top-16 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre de la page */}
        <div className="flex items-center justify-between h-16">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {currentPageTitle}
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
  );
};

export default AdminHeader;