import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import { Service } from '../../lib/types';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Settings, 
  DollarSign, 
  X,
  ArrowUpDown
} from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import DragDropReorder from './DragDropReorder';

const ServicesAdmin = () => {
  const { services, createService, updateService, deleteService, fetchServices, updateServiceOrder } = useContentStore();
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({ features: [] });
  const [newFeature, setNewFeature] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Charger les services au montage du composant
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Métriques calculées
  const totalServices = services.length;
  const paidServices = services.filter(service => 
    service.price && service.price !== 'Gratuit' && service.price !== 'Sur devis'
  ).length;

  const resetForm = useCallback(() => {
    setFormData({ features: [] });
    setNewFeature('');
    setIsEditing(false);
    setEditingService(null);
  }, []);

  const handleEdit = useCallback((service: Service) => {
    setFormData(service);
    setIsEditing(true);
    setEditingService(service.id);
    setActiveTab('form');
  }, []);

  const handleDelete = useCallback((id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (serviceToDelete) {
      await deleteService(serviceToDelete);
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    }
  }, [serviceToDelete, deleteService]);

  const addFeature = useCallback(() => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()]
      }));
      setNewFeature('');
    }
  }, [newFeature]);

  const removeFeature = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.icon) {
      return;
    }

    try {
      if (isEditing && editingService) {
        await updateService(editingService, formData);
      } else {
        // Correction : ne pas exclure display_order du type
        await createService(formData as Omit<Service, 'id' | 'created_at'>);
      }
      resetForm();
      setActiveTab('list');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  }, [formData, isEditing, editingService, updateService, createService, resetForm]);

  const handleCloseForm = useCallback(() => {
    const hasChanges = Object.keys(formData).some(key => {
      if (key === 'features') {
        return (formData.features?.length || 0) > 0;
      }
      return formData[key as keyof Service];
    });

    if (hasChanges) {
      setConfirmClose(true);
    } else {
      resetForm();
      setActiveTab('list');
    }
  }, [formData, resetForm]);

  const confirmCloseForm = useCallback(() => {
    resetForm();
    setActiveTab('list');
    setConfirmClose(false);
  }, [resetForm]);

  const handleReorderServices = useCallback(async (reorderedServices: Service[]) => {
    for (let i = 0; i < reorderedServices.length; i++) {
      await updateServiceOrder(reorderedServices[i].id, i + 1);
    }
  }, [updateServiceOrder]);

  const renderServiceItem = useCallback((service: Service) => {
    const price = Number((service.price || '').replace(/[^\d.-]/g, '')) || 0;
    const savings = price > 0 ? Math.round(price * 0.15) : 0;

    return (
      <motion.div
        key={service.id}
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
      >
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <div className="text-4xl mb-4">{service.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-white">{service.title}</h3>
            <p className="text-gray-400 mb-4">{service.description}</p>
            
            {service.features && service.features.length > 0 && (
              <ul className="space-y-2 mb-4">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="text-lg font-semibold text-purple-400 mb-2">
              {service.price || 'Sur devis'}
            </div>
            {savings > 0 && (
              <div className="text-sm text-green-400">
                💰 Économisez ~{savings}€
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleEdit(service)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={() => handleDelete(service.id)}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>
      </motion.div>
    );
  }, [handleEdit, handleDelete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header avec métriques */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-b border-gray-700">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Gestion des Services</h1>
              <p className="text-gray-400">Gérez les services proposés par votre studio</p>
            </div>
            
            {/* Métriques rapides */}
            <div className="flex gap-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{totalServices}</div>
                    <div className="text-sm text-gray-400">Services totaux</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-700/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{paidServices}</div>
                    <div className="text-sm text-gray-400">Services payants</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation par onglets */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Liste des services
            </button>
            <button
              onClick={() => {
                resetForm();
                setActiveTab('form');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'form'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              Nouveau service
            </button>
            {services.length > 1 && (
              <button
                onClick={() => setShowReorderModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg font-medium transition-all"
              >
                <ArrowUpDown className="w-4 h-4" />
                Réorganiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {activeTab === 'list' ? (
          <div>
            {services.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Aucun service configuré
                </h3>
                <p className="text-gray-500 mb-6">
                  Commencez par ajouter votre premier service
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('form');
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(renderServiceItem)}
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {isEditing ? 'Modifier le service' : 'Nouveau service'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Titre du service *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    placeholder="Ex: Production musicale"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                    placeholder="Décrivez votre service..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Icône (emoji) *
                    </label>
                    <input
                      type="text"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="🎵"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prix
                    </label>
                    <input
                      type="text"
                      value={formData.price || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="Ex: 150€/heure"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Caractéristiques
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="Nouvelle caractéristique"
                      />
                      <button
                        type="button"
                        onClick={addFeature}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                    
                    {formData.features && formData.features.length > 0 && (
                      <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                            <span className="text-gray-300">{feature}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {isEditing ? 'Mettre à jour' : 'Créer le service'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modales */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le service"
        message="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />

      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={confirmCloseForm}
        title="Fermer le formulaire"
        message="Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir fermer ?"
        confirmText="Fermer"
        cancelText="Continuer l'édition"
        type="warning"
      />

      <DragDropReorder
        items={services}
        onReorder={handleReorderServices}
        renderItem={renderServiceItem}
        getItemId={(service) => service.id}
        title="les services"
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
      />
    </div>
  );
};

export default ServicesAdmin;
