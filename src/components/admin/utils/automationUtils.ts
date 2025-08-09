import { RecentActivity, AutomationConfig } from '../types/automation.types';

// Formatage des nombres
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Formatage des pourcentages
export const formatPercentage = (rate: number): string => {
  return `${(rate * 100).toFixed(1)}%`;
};

// Configuration des couleurs pour éviter le hardcoding
export const STAT_COLORS = {
  blue: 'from-blue-600 to-blue-700 text-blue-100',
  green: 'from-green-600 to-green-700 text-green-100',
  purple: 'from-purple-600 to-purple-700 text-purple-100',
  orange: 'from-orange-600 to-orange-700 text-orange-100',
  red: 'from-red-600 to-red-700 text-red-100',
  indigo: 'from-indigo-600 to-indigo-700 text-indigo-100'
} as const;

// Configuration des statuts pour éviter le hardcoding
export const STATUS_COLORS = {
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  default: 'text-gray-400'
} as const;

export const STATUS_LABELS = {
  success: 'Succès',
  warning: 'Attention',
  error: 'Erreur'
} as const;

export const STATUS_BACKGROUNDS = {
  success: 'bg-green-900/30 text-green-400',
  warning: 'bg-yellow-900/30 text-yellow-400',
  error: 'bg-red-900/30 text-red-400'
} as const;

// Configuration des jours de travail
export const WORKING_DAYS_OPTIONS = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' }
] as const;

export const getPerformanceLabel = (rate: number, type: 'openRate' | 'responseRate', config: AutomationConfig | null) => {
  if (!config) return 'N/A';
  
  const thresholds = config.performanceThresholds[type];
  if (rate >= thresholds.excellent) return '↗ Excellent';
  if (rate >= thresholds.good) return '→ Correct';
  return '↘ À améliorer';
};

export const formatTrend = (trend: number) => {
  const sign = trend >= 0 ? '+' : '';
  return `${sign}${trend.toFixed(1)}%`;
};

export const getTrendColor = (trend: number) => {
  if (trend > 0) return 'text-green-300';
  if (trend < 0) return 'text-red-300';
  return 'text-gray-300';
};

// Retourne le nom de l'icône au lieu du composant JSX
export const getActivityIcon = (type: RecentActivity['type']): string => {
  const iconMap = {
    prospect_added: '👤',
    email_sent: '📧',
    email_opened: '👁️',
    email_replied: '💬',
    sequence_started: '🚀'
  } as const;
  
  return iconMap[type] || '📋';
};

export const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Il y a moins d\'1h';
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  return `Il y a ${Math.floor(diffInHours / 24)}j`;
};

// Fonction utilitaire pour obtenir les classes de couleur
export const getColorClasses = (color: keyof typeof STAT_COLORS) => {
  return STAT_COLORS[color] || STAT_COLORS.blue;
};

// Fonction utilitaire pour obtenir la couleur de statut
export const getStatusColor = (status: RecentActivity['status']) => {
  return STATUS_COLORS[status] || STATUS_COLORS.default;
};

// Fonction utilitaire pour obtenir le label de statut
export const getStatusLabel = (status: RecentActivity['status']) => {
  return STATUS_LABELS[status] || status;
};

// Fonction utilitaire pour obtenir le background de statut
export const getStatusBackground = (status: RecentActivity['status']) => {
  return STATUS_BACKGROUNDS[status] || 'bg-gray-900/30 text-gray-400';
};