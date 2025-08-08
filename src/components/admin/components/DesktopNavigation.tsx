import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationItem } from '../constants/navigationItems';

interface DesktopNavigationProps {
  navigationItems: NavigationItem[];
}

const DesktopNavigation: React.FC<DesktopNavigationProps> = ({ navigationItems }) => {
  const location = useLocation();

  return (
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
  );
};

export default DesktopNavigation;