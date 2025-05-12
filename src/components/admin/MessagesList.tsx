import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import Pagination from '../shared/Pagination';
import ConfirmDialog from '../shared/ConfirmDialog';

const MessagesList = () => {
  const { messages, updateMessageStatus, deleteMessage, isLoading, pagination, setPagination, fetchMessages } = useAdminStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'replied':
        return 'bg-green-500/20 text-green-400';
      case 'read':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const handlePageChange = (page: number) => {
    setPagination({ page });
    fetchMessages();
  };

  const handleDelete = (id: string) => {
    setMessageToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (messageToDelete) {
      await deleteMessage(messageToDelete);
      setMessageToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="bg-primary-900 rounded-xl p-6">
      <div className="space-y-6">
        {messages.map((message) => (
          <div key={message.id} className="bg-primary-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold mb-1">{message.subject}</h3>
                <p className="text-gray-400 text-sm">
                  De : {message.name} ({message.email})
                </p>
                <p className="text-gray-500 text-xs">
                  {format(new Date(message.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={message.status}
                  onChange={(e) => updateMessageStatus(message.id, e.target.value as any)}
                  className="bg-primary-700 border border-primary-600 rounded px-2 py-1 text-sm"
                >
                  <option value="new">Nouveau</option>
                  <option value="read">Lu</option>
                  <option value="replied">Répondu</option>
                </select>
                <button
                  onClick={() => handleDelete(message.id)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-primary-900 rounded-lg p-4 mb-4">
              <p className="text-gray-300 whitespace-pre-wrap">{message.message}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(message.status)}`}>
                {message.status === 'new' ? 'Nouveau' : message.status === 'read' ? 'Lu' : 'Répondu'}
              </span>
            </div>
          </div>
        ))}
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
        title="Supprimer le message"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default MessagesList;