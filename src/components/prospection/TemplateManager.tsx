import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Eye, X, Save, AlertCircle } from 'lucide-react';

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
        const variable = match.replace(/[{}]/g, '').trim();
        if (variable && !variables[variable]) {
          variables[variable] = '';
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

  // Filtrage des templates
  const filteredTemplates = useMemo(() => templates, [templates]);

  // Catégories disponibles
  const categories = useMemo((): Category[] => [
    { value: 'prospection', label: 'Prospection' },
    { value: 'suivi', label: 'Suivi' },
    { value: 'relance', label: 'Relance' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'promotion', label: 'Promotion' }
  ], []);

  // Priorités disponibles
  const priorities = useMemo((): Priority[] => [
    { value: 'high', label: 'Haute' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'low', label: 'Basse' }
  ], []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div className="text-gray-600">Chargement des templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Templates</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau Template
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <p className="text-gray-600 mt-1">{template.subject}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-500">Catégorie: {template.category}</span>
                  <span className="text-sm text-gray-500">Priorité: {template.priority}</span>
                  <span className="text-sm text-gray-500">Variant: {template.ab_test_variant}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPreviewTemplate(template);
                    setIsPreviewOpen(true);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Aperçu"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Dupliquer"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun template trouvé. Créez votre premier template pour commencer.
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingTemplate ? 'Modifier le Template' : 'Nouveau Template'}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du Template *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nom du template"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet de l'Email *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={handleSubjectChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Sujet de l'email"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={handleCategoryChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saving}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priorité
                    </label>
                    <select
                      value={formData.priority}
                      onChange={handlePriorityChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saving}
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variant A/B Test
                    </label>
                    <select
                      value={formData.ab_test_variant}
                      onChange={handleVariantChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={saving}
                    >
                      <option value="A">Variant A</option>
                      <option value="B">Variant B</option>
                      <option value="C">Variant C</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu du Template *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={handleContentChange}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contenu de votre template email..."
                    disabled={saving}
                  />
                
                </div>

                {Object.keys(formData.variables).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variables détectées
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(formData.variables).map((variableName: string) => (
                        <div key={variableName}>
                          <label className="block text-sm text-gray-600 mb-1">
                            {variableName}
                          </label>
                          <input
                            type="text"
                            value={formData.variables[variableName]}
                            onChange={(e) => handleVariableChange(variableName, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={`Valeur par défaut pour ${variableName}`}
                            disabled={saving}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseForm}
                  disabled={saving}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{editingTemplate ? 'Mettre à jour' : 'Créer'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aperçu */}
      {isPreviewOpen && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Aperçu du Template</h3>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Nom:</h4>
                  <p className="text-gray-700">{previewTemplate.name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Sujet:</h4>
                  <p className="text-gray-700">{previewTemplate.subject}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Contenu:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {previewTemplate.content}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Catégorie:</h4>
                    <p className="text-gray-700">{previewTemplate.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Priorité:</h4>
                    <p className="text-gray-700">{previewTemplate.priority}</p>
                  </div>
                </div>
                {Object.keys(previewTemplate.variables).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900">Variables:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {Object.entries(previewTemplate.variables).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1">
                          <span className="font-mono text-sm">{key}:</span>
                          <span className="text-sm">{value}</span>
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