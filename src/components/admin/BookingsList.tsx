import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import Pagination from '../shared/Pagination';
import ConfirmDialog from '../shared/ConfirmDialog';

const BookingsList = () => {
  const { bookings, updateBookingStatus, deleteBooking, isLoading, pagination, setPagination, fetchBookings } = useAdminStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

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
    return <div>Chargement...</div>;
  }

  return (
    <div className="bg-primary-900 rounded-xl p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary-700">
              <th className="text-left py-3 px-4">Client</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Horaires</th>
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Notes</th>
              <th className="text-left py-3 px-4">Statut</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-primary-800">
                <td className="py-3 px-4">
                  {booking.client_name}
                </td>
                <td className="py-3 px-4">
                  {format(new Date(booking.date), 'dd MMMM yyyy', { locale: fr })}
                </td>
                <td className="py-3 px-4">
                  {booking.start_time} - {booking.end_time}
                </td>
                <td className="py-3 px-4 capitalize">
                  {booking.studio_type}
                </td>
                <td className="py-3 px-4">
                  {booking.notes || '-'}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <select
                      value={booking.status}
                      onChange={(e) => updateBookingStatus(booking.id, e.target.value as any)}
                      className="bg-primary-800 border border-primary-700 rounded px-2 py-1 text-sm"
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                    <button
                      onClick={() => handleDelete(booking.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer la réservation"
        message="Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default BookingsList;