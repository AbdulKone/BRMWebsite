import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import { useErrorStore } from '../../stores/errorStore';
import { Project } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  FolderOpen,
  Music,
  Video,
  Calendar,
  User,
  X,
  Upload,
  CheckCircle,
  ArrowUpDown
} from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import DragDropReorder from './DragDropReorder';

const ProjectsAdmin = () => {
  const { 
    projects, 
    createProject, 
    updateProject, 
    deleteProject, 
    updateProjectOrder,
    fetchProjects,
    isLoading
    // Suppression de: error 
  } = useContentStore();
  const { handleError, handleSuccess } = useErrorStore();
  
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  // Suppression de: const [uploadError, setUploadError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showReorderModal, setShowReorderModal] = useState(false);

  // Métriques calculées
  const metrics = useMemo(() => {
    const total = projects.length;
    const musicProjects = projects.filter(p => p.type === 'music').length;
    const videoProjects = projects.filter(p => p.type === 'video').length;
    const currentYear = new Date().getFullYear();
    const recentProjects = projects.filter(p => p.year >= currentYear - 1).length;

    return { total, musicProjects, videoProjects, recentProjects };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return filterType === 'all' ? projects : projects.filter(project => project.type === filterType);
  }, [projects, filterType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérification de la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        handleError("L'image ne doit pas dépasser 5MB");
        return;
      }

      // Vérification du type de fichier
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        handleError("Le fichier doit être une image (JPG, PNG ou WebP)");
        return;
      }

      setSelectedFile(file);
      // Suppression de: setUploadError(null);
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateYouTubeUrl = (url: string): boolean => {
    if (!url) return true;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
    return youtubeRegex.test(url);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `projects/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Suppression de: setUploadError(null);

    try {
      if (!formData.title?.trim() || !formData.artist?.trim() || !formData.description?.trim()) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      if (formData.video_url && !validateYouTubeUrl(formData.video_url)) {
        throw new Error("L'URL YouTube n'est pas valide");
      }

      let imageUrl = formData.image_url;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const projectData = {
        ...formData,
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        description: formData.description.trim(),
        image_url: imageUrl || '',
        year: formData.year || new Date().getFullYear(),
        type: formData.type || 'music'
      } as Project;

      if (editingProject) {
        await updateProject(editingProject, projectData);
        handleSuccess('Projet mis à jour avec succès');
      } else {
        await createProject(projectData);
        handleSuccess('Projet créé avec succès');
      }

      resetForm();
      setActiveTab('list');
    } catch (error) {
      handleError(error, 'Erreur lors de la sauvegarde du projet');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project.id);
    setFormData(project);
    setImagePreview(null);
    setActiveTab('form');
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete);
        handleSuccess('Projet supprimé avec succès');
      } catch (error) {
        handleError(error, 'Erreur lors de la suppression du projet');
      } finally {
        setProjectToDelete(null);
        setDeleteConfirmOpen(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({});
    setEditingProject(null);
    setSelectedFile(null);
    // Suppression de: setUploadError(null);
    setImagePreview(null);
  };

  const handleNewProject = () => {
    resetForm();
    setActiveTab('form');
  };

  const handleCloseForm = () => {
    const hasChanges = Object.keys(formData).length > 0 || selectedFile;
    
    if (hasChanges) {
      setConfirmClose(true);
    } else {
      resetForm();
      setActiveTab('list');
    }
  };

  const confirmCloseForm = () => {
    resetForm();
    setActiveTab('list');
    setConfirmClose(false);
  };

  // Fonction de réorganisation corrigée
  const handleReorderProjects = async (reorderedProjects: Project[]) => {
    try {
      // Mettre à jour l'ordre dans la base de données
      for (let i = 0; i < reorderedProjects.length; i++) {
        const project = reorderedProjects[i];
        const newOrder = i + 1;
        if (project.display_order !== newOrder) {
          await updateProjectOrder(project.id, newOrder);
        }
      }
      // Rafraîchir la liste des projets
      await fetchProjects();
      setShowReorderModal(false);
      handleSuccess('Ordre des projets mis à jour avec succès');
    } catch (error) {
      handleError(error, 'Erreur lors de la réorganisation des projets');
      // Suppression de: setUploadError('Erreur lors de la réorganisation des projets');
    }
  };

  // Fonction de rendu pour les éléments de projet dans le drag & drop
  const renderProjectItem = (project: Project) => (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
        {project.image_url ? (
          <img 
            src={project.image_url} 
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">{project.title.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-white font-semibold">{project.title}</h3>
        <p className="text-gray-400 text-sm">{project.artist} • {project.year}</p>
        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
          project.type === 'music' 
            ? 'bg-purple-500/20 text-purple-300' 
            : 'bg-blue-500/20 text-blue-300'
        }`}>
          {project.type === 'music' ? 'Musique' : 'Vidéo'}
        </span>
      </div>
    </div>
  );
  
  const tabs = [
    { id: 'list' as const, label: 'Liste des Projets', icon: FolderOpen },
    { id: 'form' as const, label: editingProject ? 'Modifier Projet' : 'Nouveau Projet', icon: Plus }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des projets...</p>
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
      {/* En-tête avec gradient */}
      <div className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-indigo-900/20 border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <FolderOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Gestion des Projets
                </h1>
                <p className="text-gray-400 text-sm sm:text-base mt-1">
                  Gérez votre portfolio de projets musicaux et vidéos
                </p>
              </div>
            </div>
          </div>

          {/* Navigation des onglets */}
          <div className="flex space-x-1 bg-gray-800/30 backdrop-blur-sm rounded-xl p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'list' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Métriques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Projets"
                value={metrics.total}
                icon={FolderOpen}
                gradient="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border-purple-500/30 text-purple-300"
              />
              <MetricCard
                title="Projets Musicaux"
                value={metrics.musicProjects}
                icon={Music}
                gradient="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border-blue-500/30 text-blue-300"
              />
              <MetricCard
                title="Projets Vidéo"
                value={metrics.videoProjects}
                icon={Video}
                gradient="bg-gradient-to-r from-green-600/20 to-green-800/20 border-green-500/30 text-green-300"
              />
              <MetricCard
                title="Récents"
                value={metrics.recentProjects}
                icon={Calendar}
                gradient="bg-gradient-to-r from-orange-600/20 to-orange-800/20 border-orange-500/30 text-orange-300"
              />
            </div>

            {/* Filtres et actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Tous les types</option>
                  <option value="music">Musique</option>
                  <option value="video">Vidéo</option>
                </select>
                
                <button
                  onClick={() => setShowReorderModal(true)} // Utiliser showReorderModal
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-all duration-200"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Réorganiser</span>
                </button>
              </div>
              
              <button
                onClick={handleNewProject}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Projet</span>
              </button>
            </div>
          
            {/* Liste des projets ou mode réorganisation */}
            {showReorderModal ? (
              <DragDropReorder
                items={filteredProjects}
                onReorder={handleReorderProjects}
                renderItem={renderProjectItem}
                getItemId={(project: Project) => project.id}
                title="Réorganiser les projets"
                isOpen={showReorderModal}
                onClose={() => setShowReorderModal(false)}
              />
            ) : (
              <>
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Aucun projet trouvé</p>
                    <p className="text-gray-500 text-sm">Créez votre premier projet pour commencer</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 group"
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={project.image_url}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = 'https://placehold.co/600x400?text=Image+non+disponible';
                            }}
                          />
                          <div className="absolute top-3 right-3">
                            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                              project.type === 'music' 
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}>
                              {project.type === 'music' ? <Music className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                              <span>{project.type === 'music' ? 'Musique' : 'Vidéo'}</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                            {project.title}
                          </h3>
                          <div className="flex items-center space-x-2 text-gray-400 text-sm mb-3">
                            <User className="w-4 h-4" />
                            <span>{project.artist}</span>
                            <span>•</span>
                            <Calendar className="w-4 h-4" />
                            <span>{project.year}</span>
                          </div>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{project.description}</p>
                          
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(project)}
                              className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
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
                  {editingProject ? 'Modifier le Projet' : 'Nouveau Projet'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Suppression du bloc d'affichage d'erreur uploadError */}
                {/* 
                {uploadError && (
                  <div className="bg-red-500/20 text-red-400 p-4 rounded-lg border border-red-500/30">
                    {uploadError}
                  </div>
                )}
                */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Titre du projet *
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Nom du projet"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Artiste *
                    </label>
                    <input
                      type="text"
                      value={formData.artist || ''}
                      onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Nom de l'artiste"
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
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    rows={4}
                    placeholder="Description du projet"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Année *
                    </label>
                    <input
                      type="number"
                      value={formData.year || ''}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || undefined })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="2024"
                      min="1900"
                      max="2100"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type || ''}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'music' | 'video' })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Sélectionner le type</option>
                      <option value="music">Musique</option>
                      <option value="video">Vidéo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL YouTube (optionnel)
                  </label>
                  <input
                    type="url"
                    value={formData.video_url || ''}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Image du projet
                  </label>
                  
                  {(imagePreview || formData.image_url) && (
                    <div className="mb-4">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Prévisualisation"
                        className="w-full h-48 object-cover rounded-xl border border-gray-700/50"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700/50 border-dashed rounded-xl cursor-pointer bg-gray-800/30 hover:bg-gray-800/50 transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-400">
                          <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG ou WebP (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl hover:bg-gray-700 transition-all duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{editingProject ? 'Mettre à jour' : 'Créer le projet'}</span>
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
        title="Supprimer le projet"
        message="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />

      <ConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={confirmCloseForm}
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