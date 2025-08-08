import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationItem } from '../constants/navigationItems';

interface MobileNavigationProps {
  isOpen: boolean;
  navigationItems: NavigationItem[];
  onItemClick: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  isOpen, 
  navigationItems, 
  onItemClick 
}) => {
  const location = useLocation();

  if (!isOpen) return null;

  return (
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
              onClick={onItemClick}
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
  );
};

export default MobileNavigation;