import { useState } from 'react';
import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import { Service } from '../../lib/types';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';

const ServicesAdmin = () => {
  const { services, createService, updateService, deleteService } = useContentStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({ features: [] });
  const [newFeature, setNewFeature] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

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
      if (isEditing && isEditing !== 'new') {
        // Only update if we have a valid UUID
        await updateService(isEditing, formData as Service);
      } else {
        // For new services, don't pass an ID
        await createService(formData as Service);
      }

      setIsEditing(null);
      setFormData({ features: [] });
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDelete = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      await deleteService(serviceToDelete);
      setServiceToDelete(null);
    }
  };

  const handleCloseForm = () => {
    if (Object.keys(formData).length > 1 || formData.features?.length > 0) {
      setConfirmClose(true);
    } else {
      setIsEditing(null);
      setFormData({ features: [] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gold-gradient">Gestion des Services</h2>
        <button
          onClick={() => setIsEditing('new')}
          className="flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Service
        </button>
      </div>

      {(isEditing === 'new' || isEditing) && (
        <form onSubmit={handleSubmit} className="bg-primary-800 p-6 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Titre</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-primary-700 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-primary-700 rounded-lg"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Icône</label>
            <select
              value={formData.icon || ''}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 bg-primary-700 rounded-lg"
              required
            >
              <option value="">Sélectionner...</option>
              <option value="music">Musique</option>
              <option value="video">Vidéo</option>
              <option value="mic">Microphone</option>
              <option value="image">Image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Caractéristiques</label>
            <div className="space-y-2">
              {formData.features?.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-grow bg-primary-700 px-3 py-2 rounded-lg">
                    {feature}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-grow px-3 py-2 bg-primary-700 rounded-lg"
                  placeholder="Nouvelle caractéristique..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
            >
              {isEditing === 'new' ? 'Créer' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-primary-800 rounded-lg p-6"
          >
            <h3 className="text-xl font-bold mb-2">{service.title}</h3>
            <p className="text-gray-300 mb-4">{service.description}</p>
            <div className="space-y-2 mb-4">
              {service.features.map((feature, index) => (
                <div key={index} className="bg-primary-700 px-3 py-2 rounded-lg text-sm">
                  {feature}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsEditing(service.id);
                  setFormData(service);
                }}
                className="p-2 text-accent-400 hover:text-accent-300 transition-colors"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

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
        onConfirm={() => {
          setIsEditing(null);
          setFormData({ features: [] });
          setConfirmClose(false);
        }}
        title="Fermer le formulaire"
        message="Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir fermer le formulaire ?"
        confirmText="Fermer"
        cancelText="Continuer l'édition"
        type="warning"
      />
    </div>
  );
};

export default ServicesAdmin;