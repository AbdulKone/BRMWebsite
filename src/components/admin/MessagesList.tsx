import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { Trash2, MessageCircle, Mail, MailOpen, Reply, Clock, User } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { useErrorStore } from '../../stores/errorStore';
import Pagination from '../shared/Pagination';
import ConfirmDialog from '../shared/ConfirmDialog';

const MessagesList = () => {
  const { messages, updateMessageStatus, deleteMessage, isLoading, pagination, setPagination, fetchMessages } = useAdminStore();
  const { handleSuccess } = useErrorStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'replied':
        return {
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: Reply,
          label: 'Répondu'
        };
      case 'read':
        return {
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: MailOpen,
          label: 'Lu'
        };
      default:
        return {
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: Mail,
          label: 'Nouveau'
        };
    }
  };

  const filteredMessages = useMemo(() => {
    if (filterStatus === 'all') return messages;
    return messages.filter(message => message.status === filterStatus);
  }, [messages, filterStatus]);

  const metrics = useMemo(() => {
    const total = messages.length;
    const newMessages = messages.filter(m => m.status === 'new').length;
    const read = messages.filter(m => m.status === 'read').length;
    const replied = messages.filter(m => m.status === 'replied').length;
    const todayMessages = messages.filter(m => {
      const messageDate = new Date(m.created_at);
      const today = new Date();
      return messageDate.toDateString() === today.toDateString();
    }).length;

    return { total, newMessages, read, replied, todayMessages };
  }, [messages]);

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

  const toggleExpanded = (messageId: string) => {
    setExpandedMessage(expandedMessage === messageId ? null : messageId);
  };

  const handleRefreshMessages = () => {
    handleSuccess('Messages rechargés');
    fetchMessages();
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Gestion des Messages
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Suivez et répondez à tous vos messages de contact
              </p>
            </div>
          </div>

          {/* Métriques */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-white">{metrics.total}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Nouveaux</p>
                  <p className="text-2xl font-bold text-white">{metrics.newMessages}</p>
                </div>
                <Mail className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Lus</p>
                  <p className="text-2xl font-bold text-white">{metrics.read}</p>
                </div>
                <MailOpen className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Répondus</p>
                  <p className="text-2xl font-bold text-white">{metrics.replied}</p>
                </div>
                <Reply className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-white">{metrics.todayMessages}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Filtres et bouton de rechargement */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="new">Nouveaux</option>
              <option value="read">Lus</option>
              <option value="replied">Répondus</option>
            </select>
            
            <button
              onClick={handleRefreshMessages}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🔄 Recharger les messages
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {filteredMessages.map((message) => {
            const statusConfig = getStatusConfig(message.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedMessage === message.id;
            
            return (
              <div 
                key={message.id} 
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:border-gray-600/50 transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-white mb-1 truncate">{message.subject}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span>De : <span className="text-white font-medium">{message.name}</span></span>
                          <span>({message.email})</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(message.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusConfig.label}</span>
                      </div>
                      
                      <select
                        value={message.status}
                        onChange={(e) => updateMessageStatus(message.id, e.target.value as any)}
                        className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="new">Nouveau</option>
                        <option value="read">Lu</option>
                        <option value="replied">Répondu</option>
                      </select>
                      
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className={`text-gray-300 leading-relaxed ${
                      isExpanded ? '' : 'line-clamp-3'
                    }`}>
                      {message.message}
                    </div>
                    
                    {message.message.length > 200 && (
                      <button
                        onClick={() => toggleExpanded(message.id)}
                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                      >
                        {isExpanded ? 'Voir moins' : 'Voir plus'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMessages.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Aucun message trouvé</p>
            <p className="text-gray-500 text-sm">Les messages de contact apparaîtront ici</p>
          </div>
        )}

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
        title="Supprimer le message"
        message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
      />
    </div>
  );
};

export default MessagesList;