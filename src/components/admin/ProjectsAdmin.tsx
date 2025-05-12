import { useState } from 'react';
import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import { Project } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { Pencil, Trash2, Plus } from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';

const ProjectsAdmin = () => {
  const { projects, createProject, updateProject, deleteProject, isLoading, error } = useContentStore();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérification de la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("L'image ne doit pas dépasser 5MB");
        return;
      }

      // Vérification du type de fichier
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError("Le fichier doit être une image (JPG, PNG ou WebP)");
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

  const validateYouTubeUrl = (url: string): boolean => {
    if (!url) return true; // URL is optional
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    return youtubeRegex.test(url);
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `projects/${fileName}`;

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    try {
      // Validation des champs requis
      if (!formData.title || !formData.artist || !formData.description || !formData.type) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      // Validation de l'URL YouTube si présente
      if (formData.video_url && !validateYouTubeUrl(formData.video_url)) {
        throw new Error("L'URL de la vidéo YouTube n'est pas valide");
      }

      let imageUrl = formData.image_url;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      } else if (!editingProject && !imageUrl) {
        throw new Error("Une image est requise");
      }

      if (editingProject) {
        await updateProject(editingProject, { ...formData, image_url: imageUrl });
      } else {
        await createProject({ ...formData, image_url: imageUrl } as Project);
      }

      setIsEditing(false);
      setEditingProject(null);
      setFormData({});
      setSelectedFile(null);
      setUploadError(null);
      setImagePreview(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Une erreur est survenue");
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  const handleCloseForm = () => {
    if (Object.keys(formData).length > 0 || selectedFile) {
      setConfirmClose(true);
    } else {
      setIsEditing(false);
      setEditingProject(null);
      setFormData({});
      setSelectedFile(null);
      setUploadError(null);
      setImagePreview(null);
    }
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gold-gradient">Gestion des Projets</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 bg-accent-600 text-white px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Projet
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-primary-800 p-6 rounded-lg space-y-4">
          {uploadError && (
            <div className="bg-red-500/20 text-red-400 p-4 rounded-lg">
              {uploadError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Artiste</label>
              <input
                type="text"
                value={formData.artist || ''}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full px-3 py-2 bg-primary-700 rounded-lg"
                required
              />
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Année</label>
              <input
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-primary-700 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                value={formData.type || ''}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'music' | 'video' })}
                className="w-full px-3 py-2 bg-primary-700 rounded-lg"
                required
              >
                <option value="">Sélectionner...</option>
                <option value="music">Musique</option>
                <option value="video">Vidéo</option>
              </select>
            </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL Vidéo YouTube (optionnel)</label>
            <input
              type="url"
              value={formData.video_url || ''}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              className="w-full px-3 py-2 bg-primary-700 rounded-lg"
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-sm text-gray-400 mt-1">
              Format accepté : URL YouTube (ex: https://youtube.com/watch?v=XXXXXXXXXXX)
            </p>
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
              {editingProject ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-primary-800 rounded-lg overflow-hidden"
          >
            <div className="relative h-60">
              <img
                src={project.image_url}
                alt={project.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'https://placehold.co/600x400?text=Image+non+disponible';
                }}
              />
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-accent-600 text-xs font-semibold px-2.5 py-1 rounded-full text-white">
                  {project.type === 'music' ? 'Musique' : 'Vidéo'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-1 gold-gradient">{project.title}</h3>
              <p className="text-gray-400 text-sm mb-2">{project.artist} • {project.year}</p>
              <p className="text-gray-300 mb-4">{project.description}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingProject(project.id);
                    setFormData(project);
                    setIsEditing(true);
                  }}
                  className="p-2 text-accent-400 hover:text-accent-300 transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
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
        title="Supprimer le projet"
        message="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />

      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => {
          setIsEditing(false);
          setEditingProject(null);
          setFormData({});
          setSelectedFile(null);
          setUploadError(null);
          setImagePreview(null);
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

export default ProjectsAdmin;