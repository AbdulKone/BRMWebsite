import React from 'react';
import { TrendingUp, TrendingDown, Users, Mail, Eye, MessageCircle, Target, Clock } from 'lucide-react';
import { AutomationStats, AutomationConfig } from '../types/automation.types';
import { formatNumber, formatPercentage, getColorClasses, STAT_COLORS } from '../utils/automationUtils';

interface StatsGridProps {
  stats: AutomationStats;
  config: AutomationConfig;
}

interface StatCard {
  title: string;
  value: string;
  trend: number;
  icon: React.ComponentType<{ className?: string }>;
  color: keyof typeof STAT_COLORS;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, config }) => {
  const statCards: StatCard[] = [
    {
      title: 'Prospects ajoutés',
      value: formatNumber(stats.prospectsAdded),
      trend: stats.prospectsAddedTrend,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'E-mails envoyés',
      value: formatNumber(stats.emailsSent),
      trend: stats.emailsSentTrend,
      icon: Mail,
      color: 'green'
    },
    {
      title: 'Taux d\'ouverture',
      value: formatPercentage(stats.openRate),
      trend: stats.openRateTrend,
      icon: Eye,
      color: 'purple'
    },
    {
      title: 'Taux de réponse',
      value: formatPercentage(stats.responseRate),
      trend: stats.responseRateTrend,
      icon: MessageCircle,
      color: 'orange'
    },
    {
      title: 'Taux de conversion',
      value: formatPercentage(stats.conversionRate),
      trend: 0,
      icon: Target,
      color: 'red'
    },
    {
      title: 'Séquences actives',
      value: formatNumber(stats.activeSequences),
      trend: 0,
      icon: Clock,
      color: 'indigo'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositiveTrend = stat.trend > 0;
        const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;
        
        return (
          <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${getColorClasses(stat.color)}`}>
                <Icon className="w-6 h-6" />
              </div>
              {stat.trend !== 0 && (
                <div className={`flex items-center space-x-1 text-sm ${
                  isPositiveTrend ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{Math.abs(stat.trend)}%</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};