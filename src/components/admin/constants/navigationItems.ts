import { Calendar, MessageCircle, FolderOpen, Users, Settings, TrendingUp } from 'lucide-react';

export interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const navigationItems: NavigationItem[] = [
  {
    path: '/backstage/bookings',
    label: 'Réservations',
    icon: Calendar
  },
  {
    path: '/backstage/messages',
    label: 'Messages',
    icon: MessageCircle
  },
  {
    path: '/backstage/projects',
    label: 'Projets',
    icon: FolderOpen
  },
  {
    path: '/backstage/artists',
    label: 'Artistes',
    icon: Users
  },
  {
    path: '/backstage/services',
    label: 'Services',
    icon: Settings
  },
  {
    path: '/backstage/prospection',
    label: 'Prospection',
    icon: TrendingUp
  }
];