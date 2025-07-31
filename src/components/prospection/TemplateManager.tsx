import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Eye, Copy, Search, Filter, Save, X } from 'lucide-react';
import { EmailTemplate } from '../../data/types/emailTypes';

interface TemplateFormData {
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'introduction' | 'follow_up' | 'proposal' | 'nurturing' | 'closing' | 'reactivation';
  is_active: boolean;
  priority: 'low' | 'medium' | 'high';
  segment_targeting: string[];
  ab_test_variant?: 'A' | 'B' | 'C';
  template_key: string;
}

const TemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    subject: '',
    content: '',
    variables: [],
    category: 'introduction',
    is_active: true,
    priority: 'medium',
    segment_targeting: [],
    ab_test_variant: 'A',
    template_key: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const generateTemplateKey = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      + '_' + Date.now();
  };

  const handleSaveTemplate = async () => {
    try {
      if (!formData.name.trim()) {
        setError('Le nom du template est requis');
        return;
      }
      if (!formData.subject.trim()) {
        setError('Le sujet est requis');
        return;
      }
      if (!formData.content.trim()) {
        setError('Le contenu est requis');
        return;
      }

      const templateData = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        content: formData.content.trim(),
        template_key: editingTemplate ? editingTemplate.template_key : (formData.template_key || generateTemplateKey(formData.name)),
        variables: formData.variables,
        segment_targeting: formData.segment_targeting,
        category: formData.category,
        is_active: formData.is_active,
        priority: formData.priority,
        ab_test_variant: formData.ab_test_variant || 'A',
        performance_metrics: {
          open_rate: 0,
          click_rate: 0,
          response_rate: 0,
          conversion_rate: 0,
          last_updated: new Date().toISOString()
        }
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert([templateData]);
        if (error) throw error;
      }

      await loadTemplates();
      handleCloseForm();
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    const duplicatedTemplate = {
      ...template,
      id: undefined,
      name: `${template.name} (Copie)`,
      template_key: generateTemplateKey(`${template.name}_copy`),
      is_active: template.is_active,
      created_at: undefined,
      updated_at: undefined
    };
    
    setFormData({
      name: duplicatedTemplate.name,
      subject: duplicatedTemplate.subject,
      content: duplicatedTemplate.content,
      variables: Array.isArray(duplicatedTemplate.variables) ? duplicatedTemplate.variables : [],
      category: duplicatedTemplate.category as 'introduction' | 'follow_up' | 'proposal' | 'nurturing' | 'closing' | 'reactivation',
      is_active: duplicatedTemplate.is_active,
      priority: duplicatedTemplate.priority as 'low' | 'medium' | 'high',
      segment_targeting: Array.isArray(duplicatedTemplate.segment_targeting) ? duplicatedTemplate.segment_targeting : [],
      ab_test_variant: duplicatedTemplate.ab_test_variant as 'A' | 'B' | 'C' | undefined,
      template_key: duplicatedTemplate.template_key
    });
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      content: template.content,
      variables: Array.isArray(template.variables) ? template.variables : [],
      category: template.category as 'introduction' | 'follow_up' | 'proposal' | 'nurturing' | 'closing' | 'reactivation',
      is_active: template.is_active,
      priority: template.priority as 'low' | 'medium' | 'high',
      segment_targeting: Array.isArray(template.segment_targeting) ? template.segment_targeting : [],
      ab_test_variant: template.ab_test_variant as 'A' | 'B' | 'C' | undefined,
      template_key: template.template_key
    });
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    setError(null);
    setFormData({
      name: '',
      subject: '',
      content: '',
      variables: [],
      category: 'introduction',
      is_active: true,
      priority: 'medium',
      segment_targeting: [],
      ab_test_variant: 'A',
      template_key: ''
    });
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/{{([^}]+)}}/g);
    return matches ? [...new Set(matches.map(match => match.slice(2, -2)))] : [];
  };

  const updateVariables = () => {
    const subjectVars = extractVariables(formData.subject);
    const contentVars = extractVariables(formData.content);
    const allVars = [...new Set([...subjectVars, ...contentVars])];
    setFormData(prev => ({ ...prev, variables: allVars }));
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'introduction', label: 'Introduction' },
    { value: 'follow_up', label: 'Relance' },
    { value: 'proposal', label: 'Proposition' },
    { value: 'nurturing', label: 'Nurturing' },
    { value: 'closing', label: 'Closing' },
    { value: 'reactivation', label: 'Réactivation' },
  ];

  const priorities = [
    { value: 'low', label: 'Faible', color: 'bg-gray-500' },
    { value: 'medium', label: 'Moyenne', color: 'bg-yellow-500' },
    { value: 'high', label: 'Élevée', color: 'bg-red-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Templates</h2>
          <p className="text-gray-400">Créez et gérez vos templates d'emails</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Template</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un template..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Liste des templates */}
      <div className="grid gap-4">
        {filteredTemplates.map(template => {
          const priority = priorities.find(p => p.value === template.priority);
          return (
            <div key={template.id} className="bg-gray-700 rounded-lg p-6 border border-gray-600">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${priority?.color}`}>
                      {priority?.label}
                    </span>
                    {!template.is_active && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{template.subject}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>Catégorie: {template.category}</span>
                    <span>Variables: {Array.isArray(template.variables) ? template.variables.length : 0}</span>
                    {template.performance_metrics && (
                      <span>Taux d'ouverture: {(template.performance_metrics.open_rate * 100).toFixed(1)}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Aperçu"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Aucun template trouvé.</p>
        </div>
      )}

      {/* Modal de formulaire */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingTemplate ? 'Modifier le Template' : 'Nouveau Template'}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonne gauche - Informations générales */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nom du template
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nom du template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Clé du template
                    </label>
                    <input
                      type="text"
                      value={formData.template_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, template_key: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Clé unique du template"
                      disabled={!!editingTemplate}
                    />
                    {!editingTemplate && (
                      <p className="text-xs text-gray-400 mt-1">
                        Laissez vide pour générer automatiquement
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sujet de l'email
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, subject: e.target.value }));
                        updateVariables();
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Sujet de l'email"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Catégorie
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {categories.slice(1).map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Priorité
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Variant A/B Test
                    </label>
                    <select
                      value={formData.ab_test_variant || 'A'}
                      onChange={(e) => setFormData(prev => ({ ...prev, ab_test_variant: e.target.value as 'A' | 'B' | 'C' }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="A">Variant A</option>
                      <option value="B">Variant B</option>
                      <option value="C">Variant C</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">Template actif</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Variables détectées
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {formData.variables.map(variable => (
                        <span key={variable} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colonne droite - Contenu */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contenu de l'email
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, content: e.target.value }));
                      updateVariables();
                    }}
                    rows={20}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Contenu de l'email avec variables {{variable_name}}"
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aperçu */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Aperçu du Template</h3>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Nom</h4>
                  <p className="text-white">{previewTemplate.name}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Sujet</h4>
                  <p className="text-white">{previewTemplate.subject}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Contenu</h4>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <pre className="text-white whitespace-pre-wrap text-sm">{previewTemplate.content}</pre>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Catégorie</h4>
                    <p className="text-white">{previewTemplate.category}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Priorité</h4>
                    <p className="text-white">{previewTemplate.priority}</p>
                  </div>
                </div>

                {Array.isArray(previewTemplate.variables) && previewTemplate.variables.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Variables</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewTemplate.variables.map(variable => (
                        <span key={variable} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          {variable}
                        </span>
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