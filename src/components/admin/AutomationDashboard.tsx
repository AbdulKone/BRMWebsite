import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Bot, Play, Pause, Settings, TrendingUp, Users, Mail, 
  Clock, BarChart3, Zap, Target,
  Activity, RefreshCw, Eye, Reply
} from 'lucide-react';

interface AutomationStats {
  prospectsAdded: number;
  emailsSent: number;
  openRate: number;
  responseRate: number;
  conversionRate: number;
  activeSequences: number;
  scheduledEmails: number;
  lastUpdate: string;
}

interface RecentActivity {
  id: string;
  type: 'prospect_added' | 'email_sent' | 'email_opened' | 'email_replied' | 'sequence_started';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface AutomationConfig {
  isActive: boolean;
  dailyLimit: number;
  followUpDelay: number;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
}

export default function AutomationDashboard() {
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [config, setConfig] = useState<AutomationConfig>({
    isActive: true,
    dailyLimit: 50,
    followUpDelay: 5,
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAutomationStats();
    fetchRecentActivity();
    fetchAutomationConfig();
  }, []);

  const fetchAutomationStats = async () => {
    try {
      // Récupérer les statistiques des 30 derniers jours
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      // Prospects ajoutés
      const { data: newProspects } = await supabase
        .from('prospects')
        .select('id')
        .gte('created_at', thirtyDaysAgo);

      // Emails envoyés
      const { data: emailTracking } = await supabase
        .from('email_tracking')
        .select('*')
        .gte('sent_at', thirtyDaysAgo);

      // Séquences actives
      const { data: activeSequences } = await supabase
        .from('automated_sequences')
        .select('id')
        .eq('status', 'active');

      // Emails programmés
      const { data: scheduledEmails } = await supabase
        .from('prospects')
        .select('id')
        .not('next_follow_up', 'is', null)
        .gte('next_follow_up', new Date().toISOString());

      const totalSent = emailTracking?.length || 0;
      const opened = emailTracking?.filter(e => e.opened_at).length || 0;
      const responded = emailTracking?.filter(e => e.responded_at).length || 0;
      const converted = emailTracking?.filter(e => e.email_status === 'converted').length || 0;

      setStats({
        prospectsAdded: newProspects?.length || 0,
        emailsSent: totalSent,
        openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
        responseRate: totalSent > 0 ? (responded / totalSent) * 100 : 0,
        conversionRate: totalSent > 0 ? (converted / totalSent) * 100 : 0,
        activeSequences: activeSequences?.length || 0,
        scheduledEmails: scheduledEmails?.length || 0,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Simuler des activités récentes (à remplacer par de vraies données)
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'prospect_added',
          description: 'Nouveau prospect ajouté: Studio Harmony',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '2',
          type: 'email_sent',
          description: 'Email d\'introduction envoyé à 5 prospects',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '3',
          type: 'email_opened',
          description: 'Email ouvert par Label Music Pro',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        },
        {
          id: '4',
          type: 'email_replied',
          description: 'Réponse reçue de Creative Agency',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'success'
        }
      ];
      
      setRecentActivity(activities);
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
    }
  };

  const fetchAutomationConfig = async () => {
    // Récupérer la configuration depuis localStorage ou base de données
    const savedConfig = localStorage.getItem('automation_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  };

  const toggleAutomation = async () => {
    const newConfig = { ...config, isActive: !config.isActive };
    setConfig(newConfig);
    localStorage.setItem('automation_config', JSON.stringify(newConfig));
    
    // Ici, vous pourriez aussi envoyer une requête à n8n pour activer/désactiver les workflows
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'prospect_added': return <Users className="w-4 h-4" />;
      case 'email_sent': return <Mail className="w-4 h-4" />;
      case 'email_opened': return <Eye className="w-4 h-4" />;
      case 'email_replied': return <Reply className="w-4 h-4" />;
      case 'sequence_started': return <Play className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-400/10';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10';
      case 'error': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'1h';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Automation Dashboard</h2>
            <p className="text-gray-400">Pilotez votre prospection automatisée</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            config.isActive ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`text-sm font-medium ${config.isActive ? 'text-green-300' : 'text-red-300'}`}>
              {config.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          
          <button
            onClick={toggleAutomation}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              config.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {config.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{config.isActive ? 'Suspendre' : 'Activer'}</span>
          </button>
        </div>
      </div>

      {/* Métriques principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-blue-300 bg-blue-400/10 px-2 py-1 rounded-full">30j</span>
            </div>
            <h3 className="text-sm text-blue-300 font-medium mb-1">Prospects Ajoutés</h3>
            <p className="text-3xl font-bold text-white">{stats.prospectsAdded}</p>
            <p className="text-xs text-blue-300 mt-2">+{Math.round(stats.prospectsAdded / 30 * 7)} cette semaine</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Mail className="w-8 h-8 text-green-400" />
              <span className="text-xs text-green-300 bg-green-400/10 px-2 py-1 rounded-full">30j</span>
            </div>
            <h3 className="text-sm text-green-300 font-medium mb-1">Emails Envoyés</h3>
            <p className="text-3xl font-bold text-white">{stats.emailsSent}</p>
            <p className="text-xs text-green-300 mt-2">Limite: {config.dailyLimit}/jour</p>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-yellow-400" />
              <TrendingUp className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="text-sm text-yellow-300 font-medium mb-1">Taux d'Ouverture</h3>
            <p className="text-3xl font-bold text-white">{stats.openRate.toFixed(1)}%</p>
            <p className="text-xs text-yellow-300 mt-2">
              {stats.openRate > 25 ? '↗ Excellent' : stats.openRate > 15 ? '→ Correct' : '↘ À améliorer'}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Reply className="w-8 h-8 text-purple-400" />
              <Target className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-sm text-purple-300 font-medium mb-1">Taux de Réponse</h3>
            <p className="text-3xl font-bold text-white">{stats.responseRate.toFixed(1)}%</p>
            <p className="text-xs text-purple-300 mt-2">
              {stats.responseRate > 5 ? '↗ Très bon' : stats.responseRate > 2 ? '→ Moyen' : '↘ Faible'}
            </p>
          </div>
        </div>
      )}

      {/* Métriques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-6 h-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Séquences Actives</h3>
          </div>
          <p className="text-2xl font-bold text-orange-400">{stats?.activeSequences || 0}</p>
          <p className="text-sm text-gray-400 mt-2">Prospects en cours de nurturing</p>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Emails Programmés</h3>
          </div>
          <p className="text-2xl font-bold text-blue-400">{stats?.scheduledEmails || 0}</p>
          <p className="text-sm text-gray-400 mt-2">À envoyer dans les prochains jours</p>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Taux de Conversion</h3>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats?.conversionRate.toFixed(1) || 0}%</p>
          <p className="text-sm text-gray-400 mt-2">Prospects → Clients</p>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Activité Récente</h3>
          <button
            onClick={fetchRecentActivity}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Actualiser</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-lg">
              <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{activity.description}</p>
                <p className="text-sm text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                {activity.status === 'success' ? 'Succès' : activity.status === 'warning' ? 'Attention' : 'Erreur'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration rapide */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-gray-400" />
          <h3 className="text-xl font-semibold text-white">Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Limite quotidienne d'emails
            </label>
            <input
              type="number"
              value={config.dailyLimit}
              onChange={(e) => setConfig({...config, dailyLimit: parseInt(e.target.value)})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Délai de relance (jours)
            </label>
            <input
              type="number"
              value={config.followUpDelay}
              onChange={(e) => setConfig({...config, followUpDelay: parseInt(e.target.value)})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => localStorage.setItem('automation_config', JSON.stringify(config))}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}