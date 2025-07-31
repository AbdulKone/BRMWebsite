import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Eye, X, Save, AlertCircle, FileText, Copy } from 'lucide-react';

interface TemplateFormData {
  id?: string;
  name: string;
  subject: string;
  content: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  variables: Record<string, string>;
  segment_targeting: Record<string, string>;
  template_key: string;
  ab_test_variant?: 'A' | 'B' | 'C';
}

interface Category {
  value: string;
  label: string;
}

interface Priority {
  value: 'high' | 'medium' | 'low';
  label: string;
}

interface EmailTemplate extends TemplateFormData {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  performance_metrics: Record<string, number | string>;
}

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État initial du formulaire mémorisé
  const initialFormData = useMemo((): TemplateFormData => ({
    name: '',
    subject: '',
    content: '',
    category: 'prospection',
    priority: 'medium',
    variables: {},
    segment_targeting: {},
    template_key: '',
    ab_test_variant: 'A'
  }), []);
  
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);

  // Fonction d'extraction des variables
  const extractVariables = useCallback((content: string): Record<string, string> => {
    if (!content || typeof content !== 'string') {
      return {};
    }

    const matches = content.match(/\{\{([^}]+)\}\}/g);
    const variables: Record<string, string> = {};
    
    if (matches) {
      matches.forEach(match => {
        const variableName = match.replace(/[{}]/g, '').trim();
        if (variableName && !variables[variableName]) {
          variables[variableName] = '';
        }
      });
    }
    
    return variables;
  }, []);

  // Fonction de chargement des templates optimisée
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur Supabase: ${error.message}`);
      }
      
      setTemplates(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur lors du chargement des templates:', err);
      setError(`Impossible de charger les templates: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Génération automatique et sécurisée de la clé template
  const generateTemplateKey = useCallback((name: string): string => {
    if (!name || typeof name !== 'string') {
      throw new Error('Le nom du template est requis pour générer la clé');
    }
    
    const cleanName = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 50);
    
    if (!cleanName) {
      throw new Error('Le nom du template doit contenir au moins un caractère alphanumérique');
    }
    
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${cleanName}_${timestamp}_${randomSuffix}`;
  }, []);

  // Validation des données du formulaire
  const validateFormData = useCallback((data: TemplateFormData): string | null => {
    if (!data.name?.trim()) {
      return 'Le nom du template est requis';
    }
    if (data.name.trim().length < 3) {
      return 'Le nom du template doit contenir au moins 3 caractères';
    }
    if (!data.subject?.trim()) {
      return 'Le sujet est requis';
    }
    if (!data.content?.trim()) {
      return 'Le contenu est requis';
    }
    if (data.content.trim().length < 10) {
      return 'Le contenu doit contenir au moins 10 caractères';
    }
    return null;
  }, []);

  const handleSaveTemplate = useCallback(async () => {
    const validationError = validateFormData(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const templateKey = formData.template_key || generateTemplateKey(formData.name);
      const extractedVariables = extractVariables(formData.content);
      
      const templateData = {
        ...formData,
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        template_key: templateKey,
        variables: extractedVariables,
        segment_targeting: formData.segment_targeting,
        updated_at: new Date().toISOString()
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) {
          throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
        }
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            ...templateData,
            created_at: new Date().toISOString(),
            is_active: true,
            performance_metrics: {}
          });

        if (error) {
          throw new Error(`Erreur lors de la création: ${error.message}`);
        }
      }

      await loadTemplates();
      handleCloseForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur lors de la sauvegarde:', err);
      setError(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, [formData, editingTemplate, validateFormData, generateTemplateKey, extractVariables, loadTemplates]);

  const handleDeleteTemplate = useCallback(async (template: EmailTemplate) => {
    if (!template?.id || !template?.template_key) {
      setError('Template invalide pour la suppression');
      return;
    }

    const confirmDelete = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?\n\n` +
      `Cette action est irréversible et supprimera également la clé template "${template.template_key}" de la base de données.`
    );
    
    if (!confirmDelete) return;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', template.id)
        .eq('template_key', template.template_key);

      if (error) {
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }

      await loadTemplates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur lors de la suppression:', err);
      setError(`Erreur lors de la suppression: ${errorMessage}`);
    }
  }, [loadTemplates]);

  const handleDuplicate = useCallback((template: EmailTemplate) => {
    if (!template) {
      setError('Template invalide pour la duplication');
      return;
    }

    const duplicatedData = {
      ...template,
      name: `${template.name} (Copie)`,
      template_key: generateTemplateKey(`${template.name}_copy`),
      id: undefined,
      created_at: '',
      updated_at: ''
    };
    
    setFormData(duplicatedData);
    setEditingTemplate(null);
    setIsFormOpen(true);
    setError(null);
  }, [generateTemplateKey]);

  const handleEditTemplate = useCallback((template: EmailTemplate) => {
    if (!template) {
      setError('Template invalide pour l\'édition');
      return;
    }

    setFormData(template);
    setEditingTemplate(template);
    setIsFormOpen(true);
    setError(null);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    setError(null);
    setSaving(false);
    setFormData(initialFormData);
  }, [initialFormData]);

  const updateVariables = useCallback((content: string) => {
    const extractedVariables = extractVariables(content);
    
    const updatedVariables: Record<string, string> = {};
    Object.keys(extractedVariables).forEach(variableName => {
      updatedVariables[variableName] = formData.variables[variableName] || '';
    });
    
    setFormData(prev => ({
      ...prev,
      content,
      variables: updatedVariables
    }));
  }, [formData.variables, extractVariables]);

  // Gestionnaires d'événements optimisés
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, subject: e.target.value }));
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value }));
  }, []);

  const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }));
  }, []);

  const handleVariantChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, ab_test_variant: e.target.value as 'A' | 'B' | 'C' }));
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setFormData(prev => ({ ...prev, content }));
    updateVariables(content);
  }, [updateVariables]);

  const handleVariableChange = useCallback((variableName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      variables: { ...prev.variables, [variableName]: value }
    }));
  }, []);

  // Catégories disponibles
  const categories = useMemo((): Category[] => [
    { value: 'prospection', label: 'Prospection' },
    { value: 'follow_up', label: 'Relance' },
    { value: 'closing', label: 'Closing' },
    { value: 'nurturing', label: 'Nurturing' }
  ], []);

  // Priorités disponibles
  const priorities = useMemo((): Priority[] => [
    { value: 'high', label: 'Haute' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'low', label: 'Basse' }
  ], []);

  // Filtrage des templates
  const filteredTemplates = useMemo(() => templates, [templates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <div className="text-gray-300">Chargement des templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec design cohérent */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span>Gestion des Templates</span>
          </h2>
          <p className="text-gray-400">Créez et gérez vos templates d'emails de prospection</p>
        </div>
        
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Template</span>
        </button>
      </div>

      {/* Message d'erreur avec design cohérent */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {/* Liste des templates avec design sombre */}
      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                <p className="text-gray-300 mb-3">{template.subject}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30">
                    {template.category}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                    template.priority === 'high' 
                      ? 'bg-red-600/20 text-red-300 border-red-500/30'
                      : template.priority === 'medium'
                      ? 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30'
                      : 'bg-green-600/20 text-green-300 border-green-500/30'
                  }`}>
                    Priorité {template.priority === 'high' ? 'Haute' : template.priority === 'medium' ? 'Moyenne' : 'Basse'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30">
                    Variant {template.ab_test_variant}
                  </span>
                </div>
              </div>
              
              {/* Boutons d'action avec design cohérent */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setPreviewTemplate(template);
                    setIsPreviewOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-all duration-200"
                  title="Aperçu"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-600/10 rounded-lg transition-all duration-200"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-600/10 rounded-lg transition-all duration-200"
                  title="Dupliquer"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-all duration-200"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Aucun template trouvé</p>
            <p className="text-sm">Créez votre premier template pour commencer.</p>
          </div>
        )}
      </div>

      {/* Modal de création/édition - Style cohérent avec ProspectForm */}
      {isFormOpen && (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 fixed inset-0 z-50 overflow-y-auto">
          <div className="container mx-auto px-4 py-4 sm:py-8 min-h-screen flex flex-col">
            {/* Header */}
            <div className="mb-8 flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
                    </h1>
                    <p className="text-gray-400 text-sm sm:text-base mt-1">
                      {editingTemplate ? 'Mettez à jour les informations du template' : 'Créez un nouveau template pour vos campagnes'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleCloseForm}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                  disabled={saving}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Formulaire - Scrollable */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8 flex-1 overflow-y-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveTemplate(); }} className="space-y-6 h-full">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span>Informations générales</span>
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Nom du template *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nom du template"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Sujet de l'email *</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={handleSubjectChange}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Sujet de votre email"
                      disabled={saving}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Catégorie</label>
                      <select
                        value={formData.category}
                        onChange={handleCategoryChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        disabled={saving}
                      >
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Priorité</label>
                      <select
                        value={formData.priority}
                        onChange={handlePriorityChange}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        disabled={saving}
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Variant A/B</label>
                      <select
                        value={formData.ab_test_variant || 'A'}
                        onChange={(e) => setFormData(prev => ({ ...prev, ab_test_variant: e.target.value as 'A' | 'B' | 'C' }))}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        disabled={saving}
                      >
                        <option value="A">Variant A</option>
                        <option value="B">Variant B</option>
                        <option value="C">Variant C</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contenu du template */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <Edit className="w-5 h-5 text-green-400" />
                    <span>Contenu du template</span>
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Contenu de l'email *</label>
                    <textarea
                      value={formData.content}
                      onChange={handleContentChange}
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Contenu de votre template email..."
                      disabled={saving}
                      required
                    />
                    <p className="text-sm text-gray-400 mt-2">
                      Utilisez {`{{variables}}`} pour insérer des variables dynamiques
                    </p>
                  </div>
                </div>

                {/* Variables détectées */}
                {Object.keys(formData.variables).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-purple-400" />
                      <span>Variables détectées ({Object.keys(formData.variables).length})</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(formData.variables).map((variableName: string) => (
                        <div key={variableName}>
                          <label className="block text-sm font-medium mb-2 text-gray-300">
                            Variable: {variableName}
                          </label>
                          <input
                            type="text"
                            value={formData.variables[variableName]}
                            onChange={(e) => handleVariableChange(variableName, e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder={`Valeur par défaut pour ${variableName}`}
                            disabled={saving}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-700/50">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    onClick={handleCloseForm}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    disabled={saving || !formData.name.trim() || !formData.subject.trim() || !formData.content.trim()}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sauvegarde...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{editingTemplate ? 'Mettre à jour' : 'Créer le template'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aperçu avec design sombre */}
      {isPreviewOpen && previewTemplate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white">Aperçu du Template</h3>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Nom:</h4>
                    <p className="text-white bg-gray-700/50 p-3 rounded-lg">{previewTemplate.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Catégorie:</h4>
                    <p className="text-white bg-gray-700/50 p-3 rounded-lg">{previewTemplate.category}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Sujet:</h4>
                  <p className="text-white bg-gray-700/50 p-3 rounded-lg">{previewTemplate.subject}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Contenu:</h4>
                  <div className="bg-gray-700/50 p-4 rounded-lg text-white whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {previewTemplate.content}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Priorité:</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      previewTemplate.priority === 'high' 
                        ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                        : previewTemplate.priority === 'medium'
                        ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-green-600/20 text-green-300 border border-green-500/30'
                    }`}>
                      {previewTemplate.priority === 'high' ? 'Haute' : previewTemplate.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300 mb-2">Variant A/B:</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30">
                      Variant {previewTemplate.ab_test_variant}
                    </span>
                  </div>
                </div>
                
                {Object.keys(previewTemplate.variables).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Variables:</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(previewTemplate.variables).map(([key, value]) => (
                        <div key={key} className="bg-gray-700/50 p-3 rounded-lg">
                          <span className="text-blue-300 font-medium">{key}:</span>
                          <span className="text-gray-300 ml-2">{value || '(vide)'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;