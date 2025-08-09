import { useState, useEffect, useCallback } from 'react';
import { useErrorStore } from '../../stores/errorStore';
import { supabase } from '../../lib/supabase';
import { Mail, TrendingUp, AlertTriangle, Eye, MousePointer } from 'lucide-react';

interface EmailStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_complained: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
}

interface RecentEmail {
  id: string;
  subject: string;
  status: string;
  sent_at: string;
  prospect_company: string;
}

interface EmailTrackingData {
  id: string;
  subject: string | null;
  email_status: string;
  sent_at: string;
  prospects: { company_name: string }[] | null; // Changed from single object to array
}

const EmailStatsDashboard = () => {
  const { handleError } = useErrorStore();
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Suppression de: const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30');

  const loadStats = useCallback(async () => {
    try {
      const dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from('email_tracking')
        .select('email_status')
        .gte('sent_at', dateFilter.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) {
        setStats({
          total_sent: 0,
          total_delivered: 0,
          total_opened: 0,
          total_clicked: 0,
          total_bounced: 0,
          total_complained: 0,
          delivery_rate: 0,
          open_rate: 0,
          click_rate: 0,
          bounce_rate: 0,
        });
        return;
      }

      const statusCounts = data.reduce((acc, email) => {
        acc[email.email_status] = (acc[email.email_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total_sent = data.length;
      const total_delivered = statusCounts.delivered || 0;
      const total_opened = statusCounts.opened || 0;
      const total_clicked = statusCounts.clicked || 0;
      const total_bounced = statusCounts.bounced || 0;
      const total_complained = statusCounts.complained || 0;

      setStats({
        total_sent,
        total_delivered,
        total_opened,
        total_clicked,
        total_bounced,
        total_complained,
        delivery_rate: total_sent > 0 ? (total_delivered / total_sent) * 100 : 0,
        open_rate: total_delivered > 0 ? (total_opened / total_delivered) * 100 : 0,
        click_rate: total_opened > 0 ? (total_clicked / total_opened) * 100 : 0,
        bounce_rate: total_sent > 0 ? (total_bounced / total_sent) * 100 : 0,
      });
    } catch (error) {
      handleError('Erreur lors du chargement des statistiques', error instanceof Error ? error.message : 'Erreur inconnue');
      // Suppression de: setError('Erreur lors du chargement des statistiques');
    }
  }, [dateRange, handleError]);

  const loadRecentEmails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('email_tracking')
        .select(`
          id,
          subject,
          email_status,
          sent_at,
          prospects!inner(
            company_name
          )
        `)
        .order('sent_at', { ascending: false })
        .limit(10);
  
      if (error) throw error;
  
      if (!data || data.length === 0) {
        setRecentEmails([]);
        return;
      }
  
      const formattedData = (data as EmailTrackingData[]).map(email => ({
        id: email.id,
        subject: email.subject || 'Sans objet',
        status: email.email_status,
        sent_at: email.sent_at,
        prospect_company: email.prospects?.[0]?.company_name || 'Entreprise inconnue'
      }));
  
      setRecentEmails(formattedData);
    } catch (error) {
      handleError('Erreur lors du chargement des emails récents', error instanceof Error ? error.message : 'Erreur inconnue');
      // Suppression de: console.error('Erreur lors du chargement des emails récents:', error);
      // Suppression de: setError('Erreur lors du chargement des emails récents');
    }
  }, [handleError]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Suppression de: setError(null);
      try {
        await Promise.all([loadStats(), loadRecentEmails()]);
      } catch (err) {
        handleError('Erreur lors du chargement des données', err instanceof Error ? err.message : 'Erreur inconnue');
        // Suppression de: console.error('Erreur lors du chargement des données:', err);
        // Suppression de: setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [loadStats, loadRecentEmails, handleError]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-400';
      case 'delivered': return 'text-green-400';
      case 'opened': return 'text-purple-400';
      case 'clicked': return 'text-yellow-400';
      case 'bounced': return 'text-red-400';
      case 'complained': return 'text-red-600';
      default: return 'text-gray-400';
    }
  }, []);

  // Suppression de la fonction handleRetry non utilisée
  // const handleRetry = useCallback(() => { ... }, [loadStats, loadRecentEmails, handleError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Suppression complète du bloc d'erreur car géré par les toasts
  // if (error) { ... }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Statistiques Email</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-blue-500 focus:outline-none"
        >
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
          <option value="365">Année complète</option>
        </select>
      </div>

      {stats && (
        <>
          {/* Cartes de statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_sent}</p>
                  <p className="text-gray-400 text-sm">Emails envoyés</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.delivery_rate.toFixed(1)}%</p>
                  <p className="text-gray-400 text-sm">Taux de livraison</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.open_rate.toFixed(1)}%</p>
                  <p className="text-gray-400 text-sm">Taux d'ouverture</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <MousePointer className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold">{stats.click_rate.toFixed(1)}%</p>
                  <p className="text-gray-400 text-sm">Taux de clic</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Détails des envois</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Livrés:</span>
                  <span className="text-green-400">{stats.total_delivered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ouverts:</span>
                  <span className="text-purple-400">{stats.total_opened}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cliqués:</span>
                  <span className="text-yellow-400">{stats.total_clicked}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Problèmes</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Rebonds:</span>
                  <span className="text-red-400">{stats.total_bounced}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plaintes:</span>
                  <span className="text-red-600">{stats.total_complained}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Taux de rebond:</span>
                  <span className="text-red-400">{stats.bounce_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertes */}
          {(stats.bounce_rate > 5 || stats.delivery_rate < 95) && (
            <div className="bg-yellow-900 border border-yellow-700 text-yellow-100 px-4 py-3 rounded">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Attention</span>
              </div>
              <div className="mt-2 text-sm">
                {stats.bounce_rate > 5 && (
                  <p>• Taux de rebond élevé ({stats.bounce_rate.toFixed(1)}%) - Vérifiez la qualité de vos listes</p>
                )}
                {stats.delivery_rate < 95 && (
                  <p>• Taux de livraison faible ({stats.delivery_rate.toFixed(1)}%) - Vérifiez votre réputation d'expéditeur</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Emails récents */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Emails récents</h3>
        {recentEmails.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun email récent</p>
        ) : (
          <div className="space-y-2">
            {recentEmails.map(email => (
              <div key={email.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                <div className="flex-1">
                  <p className="font-medium truncate">{email.subject}</p>
                  <p className="text-sm text-gray-400">{email.prospect_company}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${getStatusColor(email.status)}`}>
                    {email.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(email.sent_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailStatsDashboard;