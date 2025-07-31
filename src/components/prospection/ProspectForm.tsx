import { useState, useEffect, useCallback } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';
import { X, Building, User, Mail, Globe, Linkedin, FileText, Tag } from 'lucide-react';

interface ProspectFormProps {
  prospectId?: string;
  onClose: () => void;
}

interface FormErrors {
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  position?: string;
  website?: string;
  linkedin_url?: string;
  notes?: string;
  source?: string;
  general?: string;
}

interface FormData {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  website: string;
  linkedin_url: string;
  notes: string;
  source: string;
  tags: string[];
}

const ProspectForm = ({ prospectId, onClose }: ProspectFormProps) => {
  const { saveProspect, prospects } = useProspectionStore();
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    position: '',
    website: '',
    linkedin_url: '',
    notes: '',
    source: '',
    tags: []
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Suppression de la variable hasChanges non utilisée

  useEffect(() => {
    if (prospectId) {
      const prospect = prospects.find(p => p.id === prospectId);
      if (prospect) {
        setFormData({
          company_name: prospect.company_name,
          first_name: prospect.first_name || '',
          last_name: prospect.last_name || '',
          email: prospect.email,
          position: prospect.position || '',
          website: prospect.website || '',
          linkedin_url: prospect.linkedin_url || '',
          notes: prospect.notes || '',
          source: prospect.source || '',
          tags: prospect.tags || []
        });
      }
    }
  }, [prospectId, prospects]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validation du nom d'entreprise
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Le nom de l\'entreprise est requis';
    } else if (formData.company_name.trim().length < 2) {
      newErrors.company_name = 'Le nom de l\'entreprise doit contenir au moins 2 caractères';
    }

    // Validation du prénom
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'Le prénom doit contenir au moins 2 caractères';
    }

    // Validation du nom de famille
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom de famille est requis';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Le nom de famille doit contenir au moins 2 caractères';
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation de l'URL du site web (optionnel mais doit être valide si fourni)
    if (formData.website.trim() && !/^https?:\/\/.+\..+/.test(formData.website.trim())) {
      newErrors.website = 'Format d\'URL invalide (doit commencer par http:// ou https://)';
    }

    // Validation de l'URL LinkedIn (optionnel mais doit être valide si fourni)
    if (formData.linkedin_url.trim() && !/^https:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/.test(formData.linkedin_url.trim())) {
      newErrors.linkedin_url = 'Format d\'URL LinkedIn invalide';
    }

    // Vérification de l'unicité de l'email (seulement pour les nouveaux prospects)
    if (!prospectId) {
      const existingProspect = prospects.find(p => 
        p.email.toLowerCase() === formData.email.trim().toLowerCase()
      );
      if (existingProspect) {
        newErrors.email = 'Un prospect avec cet email existe déjà';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, prospects, prospectId]);

  const handleInputChange = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Suppression de setHasChanges(true) car la variable n'est pas utilisée
    // Effacer l'erreur du champ modifié
    setErrors(prev => {
      if (prev[field as keyof FormErrors]) {
        const newErrors = { ...prev };
        delete newErrors[field as keyof FormErrors];
        return newErrors;
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    setErrors({});
  
    try {
      const trimmedData = {
        company_name: formData.company_name.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        position: formData.position.trim(),
        website: formData.website.trim(),
        linkedin_url: formData.linkedin_url.trim(),
        notes: formData.notes.trim(),
        source: formData.source.trim(),
        tags: formData.tags,
        last_contact_date: new Date().toISOString(), // Changé de last_contact à last_contact_date
        segment_targeting: ['corporate'],
        lead_score: 0,
        conversion_probability: 0.00,
        enriched_data: {}
      };
  
      if (prospectId) {
        await saveProspect({ id: prospectId, ...trimmedData });
      } else {
        await saveProspect(trimmedData);
      }
  
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrors({ general: 'Erreur lors de la sauvegarde du prospect' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, prospectId, saveProspect, onClose]);

  const handleCancel = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {prospectId ? 'Modifier le prospect' : 'Nouveau prospect'}
                </h1>
                <p className="text-gray-400 text-sm sm:text-base mt-1">
                  {prospectId ? 'Mettez à jour les informations du prospect' : 'Ajoutez un nouveau prospect à votre pipeline'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 sm:p-8">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-red-400">{errors.general}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de l'entreprise */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-400" />
                <span>Informations de l'entreprise</span>
              </h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.company_name ? 'border-red-500' : 'border-gray-600/50'
                  }`}
                  placeholder="Nom de l'entreprise"
                  disabled={isSubmitting}
                  required
                />
                {errors.company_name && (
                  <p className="text-red-400 text-sm mt-1">{errors.company_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Site web</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.website ? 'border-red-500' : 'border-gray-600/50'
                      }`}
                      placeholder="https://exemple.com"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.website && (
                    <p className="text-red-400 text-sm mt-1">{errors.website}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Source</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Source du prospect"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Informations du contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <User className="w-5 h-5 text-green-400" />
                <span>Informations du contact</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Prénom *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.first_name ? 'border-red-500' : 'border-gray-600/50'
                    }`}
                    placeholder="Prénom"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.first_name && (
                    <p className="text-red-400 text-sm mt-1">{errors.first_name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Nom *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.last_name ? 'border-red-500' : 'border-gray-600/50'
                    }`}
                    placeholder="Nom de famille"
                    disabled={isSubmitting}
                    required
                  />
                  {errors.last_name && (
                    <p className="text-red-400 text-sm mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.email ? 'border-red-500' : 'border-gray-600/50'
                    }`}
                    placeholder="email@exemple.com"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Poste</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.position ? 'border-red-500' : 'border-gray-600/50'
                    }`}
                    placeholder="Poste occupé"
                    disabled={isSubmitting}
                  />
                  {errors.position && (
                    <p className="text-red-400 text-sm mt-1">{errors.position}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">LinkedIn</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.linkedin_url ? 'border-red-500' : 'border-gray-600/50'
                      }`}
                      placeholder="https://linkedin.com/in/profil"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.linkedin_url && (
                    <p className="text-red-400 text-sm mt-1">{errors.linkedin_url}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>Notes</span>
              </h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Notes sur le prospect</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  rows={4}
                  placeholder="Notes, commentaires, informations importantes..."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-700/50">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sauvegarde...' : (prospectId ? 'Mettre à jour' : 'Créer le prospect')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProspectForm;