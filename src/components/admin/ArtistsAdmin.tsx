import { useState } from 'react';
import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import { Artist } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { Pencil, Trash2, Plus } from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import { validateImage } from '../../lib/security';

const ArtistsAdmin = () => {
  const { artists, createArtist, updateArtist, deleteArtist } = useContentStore();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingArtist, setEditingArtist] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Artist>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const error = validateImage(file);
      if (error) {
        setUploadError(error);
        return;
      }

      setSelectedFile(file);
      setUploadError(null);

      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      
      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      const filePath = `artists/${fileName}`;

      // Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error("Erreur lors de l'upload de l'image");
      }

      // Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    try {
      // Validation des champs requis
      if (!formData.name || !formData.description || !formData.latest_work || !formData.release_date) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      let imageUrl = formData.image_url;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      } else if (!editingArtist && !imageUrl) {
        throw new Error("Une image est requise");
      }

      if (editingArtist) {
        await updateArtist(editingArtist, { ...formData, image_url: imageUrl });
      } else {
        await createArtist({ ...formData, image_url: imageUrl } as Artist);
      }

      resetForm();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Une erreur est survenue");
      console.error('Error saving artist:', error);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingArtist(null);
    setFormData({});
    setSelectedFile(null);
    setImagePreview(null);
    setUploadError(null);
  };

  const handleDelete = (id: string) => {
    setArtistToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (artistToDelete) {
      await deleteArtist(artistToDelete);
      setArtistToDelete(null);
    }
  };

  const handleCloseForm = () => {
    if (Object.keys(formData).length > 0 || selectedFile) {
      setConfirmClose(true);
    } else {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gold-gradient">Gestion des Artistes</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel Artiste
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-primary-800 p-6 rounded-lg space-y-4">
          {uploadError && (
            <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
              {uploadError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nom</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Image</label>
            {(imagePreview || formData.image_url) && (
              <div className="mb-2">
                <img
                  src={imagePreview || formData.image_url}
                  alt="Prévisualisation"
                  className="w-40 h-40 object-cover rounded-lg"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="w-full px-3 py-2 bg-primary-700 rounded-lg"
              required={!formData.image_url}
            />
            <p className="text-sm text-gray-400 mt-1">
              Formats acceptés : JPG, PNG, WebP. Taille maximale : 5MB
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Dernier Projet</label>
              <input
                type="text"
                value={formData.latest_work || ''}
                onChange={(e) => setFormData({ ...formData, latest_work: e.target.value })}
                className="w-full px-3 py-2 bg-primary-700 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date de Sortie</label>
              <input
                type="date"
                value={formData.release_date || ''}
                onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                className="w-full px-3 py-2 bg-primary-700 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Lien du profil (optionnel)</label>
            <input
              type="url"
              value={formData.profile_url || ''}
              onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
              className="w-full px-3 py-2 bg-primary-700 rounded-lg"
              placeholder="https://..."
            />
            <p className="text-sm text-gray-400 mt-1">
              URL vers le profil de l'artiste (site web, réseaux sociaux, etc.)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              disabled={isUploading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? 'Upload en cours...' : editingArtist ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {artists.map((artist) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-primary-800 rounded-lg overflow-hidden"
          >
            <div className="relative h-48 bg-primary-900">
              <img
                src={artist.image_url}
                alt={artist.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'https://placehold.co/600x400?text=Image+non+disponible';
                }}
                loading="lazy"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-1 gold-gradient">{artist.name}</h3>
              <p className="text-gray-400 text-sm mb-2">
                Dernier projet : {artist.latest_work} ({new Date(artist.release_date).toLocaleDateString()})
              </p>
              <p className="text-gray-300 mb-4">{artist.description}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingArtist(artist.id);
                    setFormData(artist);
                    setIsEditing(true);
                  }}
                  className="p-2 text-accent-400 hover:text-accent-300 transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(artist.id)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer l'artiste"
        message="Êtes-vous sûr de vouloir supprimer cet artiste ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />

      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={resetForm}
        title="Fermer le formulaire"
        message="Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir fermer le formulaire ?"
        confirmText="Fermer"
        cancelText="Continuer l'édition"
        type="warning"
      />
    </div>
  );
};

export default ArtistsAdmin;