import { useState, useMemo, useCallback } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import { 
  TrendingUp, Users, Target, 
  Calendar, Clock, DollarSign, Zap, AlertTriangle 
} from 'lucide-react';

// Constantes externalisées
const STATUS_LABELS = {
  new: 'Nouveau',
  contacted: 'Contacté',
  interested: 'Intéressé',
  qualified: 'Qualifié',
  proposal_sent: 'Proposition envoyée',
  negotiation: 'Négociation',
  closed_won: 'Gagné',
  closed_lost: 'Perdu'
} as const;

const STATUS_COLORS = {
  new: '#3B82F6',
  contacted: '#F59E0B',
  interested: '#10B981',
  qualified: '#8B5CF6',
  proposal_sent: '#F97316',
  negotiation: '#EF4444',
  closed_won: '#059669',
  closed_lost: '#6B7280'
} as const;

interface ChartDataPoint {
  date: string;
  prospects: number;
  qualified: number;
  converted: number;
}

interface StatusDataPoint {
  name: string;
  value: number;
  color: string;
}

interface SourceDataPoint {
  source: string;
  count: number;
}

const ProspectionMetrics = () => {
  const { prospects, metrics } = useProspectionStore();
  const [timeRange, setTimeRange] = useState('30');

  // Fonction utilitaire mémorisée
  const getStatusLabel = useCallback((status: string) => {
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
  }, []);

  // Calculs principaux optimisés avec useMemo
  const calculatedData = useMemo(() => {
    const days = parseInt(timeRange);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoTime = weekAgo.getTime();

    // Génération des données de graphique
    const chartData: ChartDataPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayProspects = prospects.filter(p => {
        const createdDate = new Date(p.created_at);
        return createdDate.toDateString() === date.toDateString();
      });
      
      chartData.push({
        date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        prospects: dayProspects.length,
        qualified: dayProspects.filter(p => p.status === 'qualified').length,
        converted: dayProspects.filter(p => p.status === 'closed_won').length
      });
    }

    // Comptage des statuts
    const statusCounts = prospects.reduce((acc, prospect) => {
      acc[prospect.status] = (acc[prospect.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Données de statut
    const statusData: StatusDataPoint[] = Object.entries(statusCounts).map(([status, count]) => ({
      name: getStatusLabel(status),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280'
    }));

    // Comptage des sources
    const sourceCounts = prospects.reduce((acc, prospect) => {
      const source = prospect.source || 'Non défini';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Données de source
    const sourceData: SourceDataPoint[] = Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count
    }));

    // Métriques calculées
    const highValueProspects = prospects.filter(p => (p.lead_score || 0) > 70);
    const recentProspects = prospects.filter(p => {
      const created = new Date(p.created_at);
      return created.getTime() > weekAgoTime;
    });
    const prospectsNeedingAttention = prospects.filter(p => {
      const lastContact = p.last_contact_date ? new Date(p.last_contact_date) : null;
      return !lastContact || lastContact.getTime() < weekAgoTime;
    });

    // Valeurs maximales pour les graphiques
    const maxChartValue = Math.max(...chartData.map(d => d.prospects), 1);
    const totalStatusValue = statusData.reduce((sum, item) => sum + item.value, 0);
    const maxSourceValue = Math.max(...sourceData.map(d => d.count), 1);

    return {
      chartData,
      statusData,
      sourceData,
      highValueProspects,
      recentProspects,
      prospectsNeedingAttention,
      maxChartValue,
      totalStatusValue,
      maxSourceValue
    };
  }, [prospects, timeRange, getStatusLabel]);

  return (
    <div className="p-6 space-y-8">
      {/* Header avec filtres */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analytics & Métriques</h2>
          <p className="text-gray-400">Vue d'ensemble de vos performances de prospection</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Total Prospects</h3>
          <p className="text-3xl font-bold text-blue-400">{prospects.length}</p>
          <p className="text-sm text-gray-400 mt-2">+{calculatedData.recentProspects.length} cette semaine</p>
        </div>

        <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600/20 rounded-lg">
              <Target className="w-6 h-6 text-green-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Taux de Conversion</h3>
          <p className="text-3xl font-bold text-green-400">{(metrics.conversion_rate * 100).toFixed(1)}%</p>
          <p className="text-sm text-gray-400 mt-2">Objectif: 15%</p>
        </div>

        <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Valeur Pipeline</h3>
          <p className="text-3xl font-bold text-purple-400">{metrics.pipeline_value.toLocaleString()}€</p>
          <p className="text-sm text-gray-400 mt-2">Potentiel estimé</p>
        </div>

        <div className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600/20 rounded-lg">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Prospects Qualifiés</h3>
          <p className="text-3xl font-bold text-orange-400">{calculatedData.highValueProspects.length}</p>
          <p className="text-sm text-gray-400 mt-2">Score {'>'} 70</p>
        </div>
      </div>

      {/* Graphiques CSS simples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Évolution des prospects */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Évolution des Prospects</h3>
          <div className="space-y-4">
            {calculatedData.chartData.slice(-7).map((item, index) => (
              <div key={`${item.date}-${index}`} className="flex items-center space-x-4">
                <div className="w-16 text-sm text-gray-400">{item.date}</div>
                <div className="flex-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2 relative">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(item.prospects / calculatedData.maxChartValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-white w-8">{item.prospects}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400">Prospects</span>
            </div>
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Répartition par Statut</h3>
          <div className="space-y-3">
            {calculatedData.statusData.map((item, index) => {
              const percentage = calculatedData.totalStatusValue > 0 ? (item.value / calculatedData.totalStatusValue) * 100 : 0;
              return (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-gray-300 text-sm">{item.name}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2 mx-3">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          backgroundColor: item.color, 
                          width: `${percentage}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{item.value}</div>
                    <div className="text-gray-400 text-xs">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sources de prospects */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Sources de Prospects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculatedData.sourceData.map((item, index) => (
            <div key={`${item.source}-${index}`} className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 font-medium">{item.source}</span>
                <span className="text-white font-bold">{item.count}</span>
              </div>
              <div className="bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${(item.count / calculatedData.maxSourceValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-600/10 to-blue-800/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
            <h4 className="text-lg font-semibold text-white">Suivis Programmés</h4>
          </div>
          <p className="text-2xl font-bold text-blue-400 mb-2">
            {prospects.filter(p => p.next_follow_up).length}
          </p>
          <p className="text-sm text-gray-400">Prospects avec suivi planifié</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-600/10 to-yellow-800/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-yellow-400" />
            <h4 className="text-lg font-semibold text-white">Temps de Réponse</h4>
          </div>
          <p className="text-2xl font-bold text-yellow-400 mb-2">
            {metrics.avg_response_time.toFixed(1)}h
          </p>
          <p className="text-sm text-gray-400">Temps moyen de réponse</p>
        </div>

        <div className="bg-gradient-to-r from-red-600/10 to-red-800/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h4 className="text-lg font-semibold text-white">Attention Requise</h4>
          </div>
          <p className="text-2xl font-bold text-red-400 mb-2">
            {calculatedData.prospectsNeedingAttention.length}
          </p>
          <p className="text-sm text-gray-400">Prospects sans contact récent</p>
        </div>
      </div>
    </div>
  );
};

export default ProspectionMetrics;