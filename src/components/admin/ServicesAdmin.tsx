import { useState } from 'react';
import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import { Service } from '../../lib/types';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Settings, 
  Star,
  DollarSign,
  CheckCircle,
  X,
  Tag
} from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';

const ServicesAdmin = () => {
  const { services, createService, updateService, deleteService } = useContentStore();
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({ features: [] });
  const [newFeature, setNewFeature] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  // Métriques calculées
  const totalServices = services.length;
  const premiumServices = services.filter(service => {
    if (!service.price) return false;
    const price = parseFloat(service.price.replace(/[^\d.-]/g, ''));
    return !isNaN(price) && price > 500;
  }).length;
  
  const averageFeatures = services.length > 0 
    ? Math.round(services.reduce((acc, service) => acc + (service.features?.length || 0), 0) / services.length) 
    : 0;

  const averagePrice = services.length > 0 
    ? Math.round(services.reduce((acc, service) => {
        const price = parseFloat(service.price?.replace(/[^\d.-]/g, '') || '0');
        return acc + (isNaN(price) ? 0 : price);
      }, 0) / services.length)
    : 0;

  const addFeature = () => {
    if (newFeature.trim() && formData.features) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    if (formData.features) {
      setFormData({
        ...formData,
        features: formData.features.filter((_, i) => i !== index)
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.title?.trim() || !formData.description?.trim() || !formData.price?.trim()) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      const serviceData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price.trim(),
        features: formData.features || [] // Assurer que features existe
      } as Service;

      if (isEditing) {
        await updateService(isEditing, serviceData);
      } else {
        await createService(serviceData);
      }

      resetForm();
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEdit = (service: Service) => {
    setIsEditing(service.id);
    setFormData({ ...service });
    setActiveTab('form');
  };

  const handleDelete = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      try {
        await deleteService(serviceToDelete);
      } catch (error) {
        console.error('Error deleting service:', error);
      } finally {
        setServiceToDelete(null);
        setDeleteConfirmOpen(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ features: [] });
    setIsEditing(null);
    setNewFeature('');
  };

  const handleNewService = () => {
    resetForm();
    setActiveTab('form');
  };

  const handleCloseForm = () => {
    const hasChanges = Object.keys(formData).length > 1 || 
                     (formData.features && formData.features.length > 0) ||
                     formData.title || formData.description || formData.price;
    
    if (hasChanges) {
      setConfirmClose(true);
    } else {
      resetForm();
      setActiveTab('list');
    }
  };

  const tabs = [
    { id: 'list' as const, label: 'Liste des Services', icon: Settings },
    { id: 'form' as const, label: isEditing ? 'Modifier Service' : 'Nouveau Service', icon: Plus }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* En-tête avec gradient */}
      <div className="bg-gradient-to-r from-emerald-900/20 via-teal-900/20 to-cyan-900/20 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Gestion des Services
              </h1>
              <p className="text-gray-400 mt-1">Gérez votre catalogue de services et tarifs</p>
            </div>
          </div>

          {/* Métriques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <motion.div 
              className="bg-gradient-to-r from-emerald-600/20 to-emerald-800/20 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-300 text-sm font-medium">Total Services</p>
                  <p className="text-2xl font-bold text-white">{totalServices}</p>
                </div>
                <Settings className="w-8 h-8 text-emerald-400" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-r from-teal-600/20 to-teal-800/20 backdrop-blur-sm border border-teal-500/20 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-300 text-sm font-medium">Services Premium</p>
                  <p className="text-2xl font-bold text-white">{premiumServices}</p>
                </div>
                <Star className="w-8 h-8 text-teal-400" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-r from-cyan-600/20 to-cyan-800/20 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300 text-sm font-medium">Fonctionnalités Moy.</p>
                  <p className="text-2xl font-bold text-white">{averageFeatures}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-cyan-400" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-r from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/20 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Prix Moyen</p>
                  <p className="text-2xl font-bold text-white">{averagePrice}€</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>
          </div>

          {/* Navigation des onglets */}
          <div className="flex flex-wrap gap-2 mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'form' && !isEditing) {
                      resetForm();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'list' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Liste des Services</h2>
              <button
                onClick={handleNewService}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Nouveau Service
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <motion.div
                  key={service.id}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                  layout
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                    <div className="flex items-center gap-1 bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded-full text-sm">
                      <Tag className="w-3 h-3" />
                      {service.price}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">{service.description}</p>
                  
                  {service.features && service.features.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-300 mb-2">Fonctionnalités :</p>
                      <div className="space-y-1">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-400">
                            <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span className="truncate">{feature}</span>
                          </div>
                        ))}
                        {service.features.length > 3 && (
                          <p className="text-xs text-gray-500">+{service.features.length - 3} autres...</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-600/30 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-600/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {services.length === 0 && (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">Aucun service</h3>
                <p className="text-gray-500 mb-4">Commencez par ajouter votre premier service</p>
                <button
                  onClick={handleNewService}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
                >
                  Ajouter un Service
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'form' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {isEditing ? 'Modifier le Service' : 'Nouveau Service'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre du service *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      placeholder="Nom du service"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prix *
                    </label>
                    <input
                      type="text"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                      placeholder="ex: 500€ ou À partir de 300€"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                    placeholder="Description détaillée du service..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fonctionnalités
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                        placeholder="Ajouter une fonctionnalité..."
                      />
                      <button
                        type="button"
                        onClick={addFeature}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {formData.features && formData.features.length > 0 && (
                      <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 bg-gray-800/30 px-3 py-2 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span className="flex-1 text-gray-300">{feature}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
                  >
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>

      {/* Dialogues de confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le service"
        message="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => {
          resetForm();
          setActiveTab('list');
          setConfirmClose(false);
        }}
        title="Abandonner les modifications"
        message="Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?"
        confirmText="Quitter"
        cancelText="Continuer l'édition"
      />
    </div>
  );
};

export default ServicesAdmin;