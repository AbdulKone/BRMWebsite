import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { Trash2, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import Pagination from '../shared/Pagination';
import ConfirmDialog from '../shared/ConfirmDialog';

const BookingsList = () => {
  const { bookings, updateBookingStatus, deleteBooking, isLoading, pagination, setPagination, fetchBookings } = useAdminStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusConfig = (status: string) => {
    const configs = {
      confirmed: {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle,
        label: 'Confirmé'
      },
      cancelled: {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: XCircle,
        label: 'Annulé'
      },
      pending: {
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: AlertCircle,
        label: 'En attente'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const filteredBookings = useMemo(() => {
    return filterStatus === 'all' ? bookings : bookings.filter(booking => booking.status === filterStatus);
  }, [bookings, filterStatus]);

  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    return bookings.reduce((acc, booking) => {
      acc.total++;
      acc[booking.status as keyof typeof acc]++;
      if (new Date(booking.date).toDateString() === today) {
        acc.todayBookings++;
      }
      return acc;
    }, {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      todayBookings: 0
    });
  }, [bookings]);

  const handlePageChange = (page: number) => {
    setPagination({ page });
    fetchBookings();
  };

  const handleDelete = (id: string) => {
    setBookingToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (bookingToDelete) {
      await deleteBooking(bookingToDelete);
      setBookingToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  const MetricCard = ({ title, value, icon: Icon, gradient }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
  }) => (
    <div className={`${gradient} border border-opacity-30 rounded-xl p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-80" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Gestion des Réservations
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Suivez et gérez toutes vos réservations studio
              </p>
            </div>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <MetricCard
              title="Total"
              value={metrics.total}
              icon={Calendar}
              gradient="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300"
            />
            <MetricCard
              title="Confirmées"
              value={metrics.confirmed}
              icon={CheckCircle}
              gradient="bg-gradient-to-r from-green-600/20 to-green-800/20 border-green-500/30 text-green-300"
            />
            <MetricCard
              title="En attente"
              value={metrics.pending}
              icon={AlertCircle}
              gradient="bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border-yellow-500/30 text-yellow-300"
            />
            <MetricCard
              title="Annulées"
              value={metrics.cancelled}
              icon={XCircle}
              gradient="bg-gradient-to-r from-red-600/20 to-red-800/20 border-red-500/30 text-red-300"
            />
            <MetricCard
              title="Aujourd'hui"
              value={metrics.todayBookings}
              icon={Clock}
              gradient="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border-purple-500/30 text-purple-300"
            />
          </div>

          {/* Filtres */}
          <div className="mb-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Aucune réservation trouvée</p>
              <p className="text-gray-500 text-sm">Les réservations apparaîtront ici une fois créées</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Client</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Date</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Horaires</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Type</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Notes</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Statut</th>
                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => {
                    const statusConfig = getStatusConfig(booking.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr 
                        key={booking.id} 
                        className={`border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors ${
                          index % 2 === 0 ? 'bg-gray-800/20' : 'bg-transparent'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{booking.client_name}</p>
                              <p className="text-gray-400 text-sm">{booking.client_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-white font-medium">
                            {format(new Date(booking.date), 'dd MMMM yyyy', { locale: fr })}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {format(new Date(booking.date), 'EEEE', { locale: fr })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-white">{booking.start_time} - {booking.end_time}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm capitalize">
                            {booking.studio_type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="max-w-xs">
                            <p className="text-gray-300 text-sm truncate">
                              {booking.notes || 'Aucune note'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{statusConfig.label}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <select
                              value={booking.status}
                              onChange={(e) => updateBookingStatus(booking.id, e.target.value as any)}
                              className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="pending">En attente</option>
                              <option value="confirmed">Confirmé</option>
                              <option value="cancelled">Annulé</option>
                            </select>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer la réservation"
        message="Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
      />
    </div>
  );
};

export default BookingsList;