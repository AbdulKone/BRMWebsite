import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import { useErrorStore } from '../../stores/errorStore';
import { Artist } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Users, 
  Music, 
  Calendar,
  Image as ImageIcon,
  X,
  Upload,
  Menu
} from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import { validateImage } from '../../lib/security';
import DragDropReorder from './DragDropReorder';
import { ArrowUpDown } from 'lucide-react';

const ArtistsAdmin = () => {
  const { artists, createArtist, updateArtist, deleteArtist } = useContentStore();
  const { handleError, handleSuccess } = useErrorStore();
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingArtist, setEditingArtist] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Artist>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  // Suppression de: const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Métriques calculées
  const totalArtists = artists.length;
  const recentArtists = artists.filter(artist => {
    const releaseDate = new Date(artist.release_date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return releaseDate >= sixMonthsAgo;
  }).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const error = validateImage(file);
      if (error) {
        // Remplacement de: setUploadError(error);
        handleError(error);
        return;
      }

      setSelectedFile(file);
      // Suppression de: setUploadError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${timestamp}-${randomString}.${fileExt}`;
      const filePath = `artists/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        throw new Error("Erreur lors de l'upload de l'image");
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      handleError(error, "Erreur lors de l'upload de l'image");
      throw new Error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Suppression de: setUploadError(null);

    try {
      if (!formData.name || !formData.description || !formData.latest_work || !formData.release_date) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      let imageUrl = formData.image_url;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      } else if (!editingArtist && !imageUrl) {
        throw new Error("Une image est requise");
      }

      const artistData = {
        ...formData,
        image_url: imageUrl
      } as Artist;

      if (editingArtist) {
        await updateArtist(editingArtist, artistData);
        handleSuccess('Artiste mis à jour avec succès');
      } else {
        await createArtist(artistData);
        handleSuccess('Artiste créé avec succès');
      }

      resetForm();
      setActiveTab('list');
    } catch (error) {
      handleError(error, 'Erreur lors de la sauvegarde de l\'artiste');
      // Suppression de: setUploadError(error instanceof Error ? error.message : "Erreur lors de la sauvegarde");
    }
  };

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist.id);
    setFormData(artist);
    setImagePreview(artist.image_url || null);
    setIsEditing(true);
    setActiveTab('form');
  };

  const handleDelete = (id: string) => {
    setArtistToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (artistToDelete) {
      await deleteArtist(artistToDelete);
      setArtistToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const resetForm = () => {
    setFormData({});
    setSelectedFile(null);
    setImagePreview(null);
    setEditingArtist(null);
    setIsEditing(false);
    // Suppression de: setUploadError(null);
  };

  const handleNewArtist = () => {
    resetForm();
    setActiveTab('form');
  };

  // Fonction corrigée pour la réorganisation
  const handleReorderArtists = useCallback(async (reorderedArtists: Artist[]) => {
    try {
      const updates = reorderedArtists.map((artist, index) => 
        updateArtist(artist.id, { display_order: index })
      );
      
      await Promise.all(updates);
      setShowReorderModal(false);
      handleSuccess('Ordre des artistes mis à jour avec succès');
    } catch (error) {
      handleError(error, 'Erreur lors de la réorganisation des artistes');
    }
  }, [updateArtist, handleError, handleSuccess]);

  // Fonction corrigée pour le rendu des éléments
  const renderArtistItem = useCallback((artist: Artist) => (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      {artist.image_url && (
        <img 
          src={artist.image_url} 
          alt={artist.name}
          className="w-12 h-12 object-cover rounded-lg"
        />
      )}
      <div className="flex-1">
        <h3 className="font-medium text-white">{artist.name}</h3>
        <p className="text-sm text-gray-400">{artist.latest_work}</p>
      </div>
    </div>
  ), []);

  const tabs = [
    { id: 'list', label: 'Liste des Artistes', icon: Users },
    { id: 'form', label: isEditing ? 'Modifier Artiste' : 'Nouvel Artiste', icon: Plus }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* En-tête avec gradient */}
      <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-indigo-900/20 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Gestion des Artistes
              </h1>
              <p className="text-gray-400 mt-1">Gérez votre roster d'artistes et leurs dernières sorties</p>
            </div>
            
            {/* Menu burger mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Métriques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <motion.div 
              className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Total Artistes</p>
                  <p className="text-2xl font-bold text-white">{totalArtists}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Sorties Récentes</p>
                  <p className="text-2xl font-bold text-white">{recentArtists}</p>
                </div>
                <Music className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-r from-indigo-600/20 to-indigo-800/20 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-300 text-sm font-medium">Avec Images</p>
                  <p className="text-2xl font-bold text-white">{artists.filter(a => a.image_url).length}</p>
                </div>
                <ImageIcon className="w-8 h-8 text-indigo-400" />
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-r from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/20 rounded-xl p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Cette Année</p>
                  <p className="text-2xl font-bold text-white">
                    {artists.filter(a => new Date(a.release_date).getFullYear() === new Date().getFullYear()).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-400" />
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
                    setActiveTab(tab.id as 'list' | 'form');
                    if (tab.id === 'form' && !isEditing) {
                      resetForm();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
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
              <h2 className="text-xl font-semibold text-white">Liste des Artistes</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReorderModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  Réorganiser
                </button>
                <button
                  onClick={handleNewArtist}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  Nouvel Artiste
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artists.map((artist) => (
                <motion.div
                  key={artist.id}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300"
                  whileHover={{ scale: 1.02, y: -5 }}
                  layout
                >
                  {artist.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">{artist.name}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{artist.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Music className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300">{artist.latest_work}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">
                          {new Date(artist.release_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(artist)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600/20 text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-600/30 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(artist.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-600/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {artists.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">Aucun artiste</h3>
                <p className="text-gray-500 mb-4">Commencez par ajouter votre premier artiste</p>
                <button
                  onClick={handleNewArtist}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Ajouter un Artiste
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
                  {isEditing ? 'Modifier l\'Artiste' : 'Nouvel Artiste'}
                </h2>
                <button
                  onClick={() => setActiveTab('list')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Suppression du bloc d'affichage d'erreur uploadError */}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nom de l'artiste *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="Nom de l'artiste"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Dernière sortie *
                    </label>
                    <input
                      type="text"
                      value={formData.latest_work || ''}
                      onChange={(e) => setFormData({ ...formData, latest_work: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="Titre de la dernière sortie"
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
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                    placeholder="Description de l'artiste..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date de sortie *
                  </label>
                  <input
                    type="date"
                    value={formData.release_date || ''}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Image de l'artiste
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800/30 hover:bg-gray-700/30 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-400">
                            <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>

                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Prévisualisation"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setSelectedFile(null);
                            if (isEditing) {
                              setFormData({ ...formData, image_url: '' });
                            }
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="flex-1 px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Upload en cours...' : (isEditing ? 'Mettre à jour' : 'Créer')}
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
        title="Supprimer l'artiste"
        message="Êtes-vous sûr de vouloir supprimer cet artiste ? Cette action est irréversible."
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

      {/* Modal de réorganisation */}
      <DragDropReorder
        items={artists}
        onReorder={handleReorderArtists}
        renderItem={renderArtistItem}
        getItemId={(artist) => artist.id}
        title="les Artistes"
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
      />
    </div>
  );
};

export default ArtistsAdmin;