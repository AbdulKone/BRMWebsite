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

type TemplateTab = 'list' | 'form' | 'preview';

interface TemplateManagerProps {
  activeTab?: TemplateTab;
  onTabChange?: (tab: TemplateTab) => void;
  editingTemplateId?: string | null;
  onCloseForm?: () => void;
  onEditTemplate?: (templateId: string) => void;
  onAddTemplate?: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  activeTab: externalActiveTab,
  onTabChange,
  editingTemplateId: externalEditingTemplateId,
  onCloseForm
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState<TemplateTab>('list');
  const [internalEditingTemplateId, setInternalEditingTemplateId] = useState<string | null>(null);
  
  // Utiliser les props externes si disponibles, sinon les états internes
  const activeTab = externalActiveTab || internalActiveTab;
  const editingTemplateId = externalEditingTemplateId || internalEditingTemplateId;
  
  const handleTabChange = useCallback((tab: TemplateTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  }, [onTabChange]);
  
  const handleEditTemplate = useCallback((templateId: string) => {
    if (onTabChange) {
      // Mode externe - laisser le parent gérer
      onTabChange('form');
    } else {
      setInternalEditingTemplateId(templateId);
      setInternalActiveTab('form');
    }
  }, [onTabChange]);
  
  const handleAddTemplate = useCallback(() => {
    if (onTabChange) {
      onTabChange('form');
    } else {
      setInternalEditingTemplateId(null);
      setInternalActiveTab('form');
    }
  }, [onTabChange]);
  
  const handleCloseForm = useCallback(() => {
    if (onCloseForm) {
      onCloseForm();
    } else {
      setInternalEditingTemplateId(null);
      setInternalActiveTab('list');
    }
  }, [onCloseForm]);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    subject: '',
    content: '',
    category: 'prospection',
    priority: 'medium',
    variables: {},
    segment_targeting: {},
    template_key: '',
    ab_test_variant: 'A'
  });

  // Charger les templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des templates:', err);
      setError('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Charger le template à éditer
  useEffect(() => {
    if (editingTemplateId && activeTab === 'form') {
      const template = templates.find(t => t.id === editingTemplateId);
      if (template) {
        setFormData({
          id: template.id,
          name: template.name,
          subject: template.subject,
          content: template.content,
          category: template.category,
          priority: template.priority,
          variables: template.variables || {},
          segment_targeting: template.segment_targeting || {},
          template_key: template.template_key,
          ab_test_variant: template.ab_test_variant || 'A'
        });
      }
    } else if (!editingTemplateId && activeTab === 'form') {
      // Reset pour nouveau template
      setFormData({
        name: '',
        subject: '',
        content: '',
        category: 'prospection',
        priority: 'medium',
        variables: {},
        segment_targeting: {},
        template_key: '',
        ab_test_variant: 'A'
      });
    }
  }, [editingTemplateId, templates, activeTab]);

  // Fonction pour extraire les variables du contenu
  const extractVariables = useCallback((content: string): Record<string, string> => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: Record<string, string> = {};
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1].trim();
      if (!variables[variableName]) {
        variables[variableName] = '';
      }
    }
    
    return variables;
  }, []);

  // Mettre à jour les variables quand le contenu change
  const updateVariables = useCallback((content: string) => {
    const detectedVariables = extractVariables(content);
    setFormData(prev => ({
      ...prev,
      variables: { ...prev.variables, ...detectedVariables }
    }));
  }, [extractVariables]);

  useEffect(() => {
    if (formData.content) {
      updateVariables(formData.content);
    }
  }, [formData.content, updateVariables]);

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

  // Handlers pour les champs du formulaire
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      template_key: name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    }));
  }, []);

  const handleSubjectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, subject: e.target.value }));
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, category: e.target.value }));
  }, []);

  const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }));
  }, []);

  // Sauvegarder le template
  const handleSaveTemplate = useCallback(async () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const templateData = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority,
        variables: formData.variables,
        segment_targeting: formData.segment_targeting,
        template_key: formData.template_key,
        ab_test_variant: formData.ab_test_variant,
        is_active: true,
        performance_metrics: {}
      };

      if (editingTemplateId) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplateId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert([templateData]);
        
        if (error) throw error;
      }

      await loadTemplates();
      handleCloseForm();
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde du template');
    } finally {
      setSaving(false);
    }
  }, [formData, editingTemplateId, loadTemplates, handleCloseForm]);

  // Supprimer un template
  const handleDeleteTemplate = useCallback(async (templateId: string, templateName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le template "${templateName}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      await loadTemplates();
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression du template');
    }
  }, [loadTemplates]);

  // Dupliquer un template
  const handleDuplicateTemplate = useCallback(async (template: EmailTemplate) => {
    try {
      const duplicatedTemplate = {
        name: `${template.name} (Copie)`,
        subject: template.subject,
        content: template.content,
        category: template.category,
        priority: template.priority,
        variables: template.variables,
        segment_targeting: template.segment_targeting,
        template_key: `${template.template_key}_copy_${Date.now()}`,
        ab_test_variant: template.ab_test_variant,
        is_active: true,
        performance_metrics: {}
      };

      const { error } = await supabase
        .from('email_templates')
        .insert([duplicatedTemplate]);

      if (error) throw error;
      await loadTemplates();
    } catch (err) {
      console.error('Erreur lors de la duplication:', err);
      setError('Erreur lors de la duplication du template');
    }
  }, [loadTemplates]);

  // Aperçu d'un template
  const handlePreviewTemplate = useCallback((template: EmailTemplate) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  }, []);

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

  // Rendu de la liste des templates
  if (activeTab === 'list') {
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
            onClick={handleAddTemplate}
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
                    onClick={() => handlePreviewTemplate(template)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                    title="Aperçu"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template.id)}
                    className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded-lg transition-all duration-200"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-200"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
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
  }

  // Rendu du formulaire de création/modification
  if (activeTab === 'form') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {editingTemplateId ? 'Modifier le template' : 'Nouveau template'}
                </h2>
                <p className="text-gray-400">
                  {editingTemplateId ? 'Mettez à jour les informations du template' : 'Créez un nouveau template pour vos campagnes'}
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

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveTemplate(); }} className="space-y-6">
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
                  rows={8}
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
                    <span>{editingTemplateId ? 'Mettre à jour' : 'Créer le template'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default TemplateManager;