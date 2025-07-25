import { useState, useEffect, useCallback } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';

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
  const { addProspect, updateProspect, prospects } = useProspectionStore();
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
      newErrors.website = 'Format d\'URL invalide (doit commencer par http:// ou https:// et contenir un domaine valide)';
    }

    // Validation de l'URL LinkedIn (optionnel mais doit être valide si fourni)
    if (formData.linkedin_url.trim() && !/^https:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/.test(formData.linkedin_url.trim())) {
      newErrors.linkedin_url = 'Format d\'URL LinkedIn invalide (doit être un profil ou une page entreprise LinkedIn)';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const trimmedData = {
        company_name: formData.company_name.trim(),
        first_name: formData.first_name.trim() || undefined,
        last_name: formData.last_name.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        position: formData.position.trim() || undefined,
        website: formData.website.trim() || undefined,
        linkedin_url: formData.linkedin_url.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        source: formData.source.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      };
  
      if (prospectId) {
        await updateProspect(prospectId, trimmedData);
      } else {
        await addProspect({
          ...trimmedData,
          status: 'new',
          last_contact: new Date().toISOString(),
          segment_targeting: ['corporate'],
          lead_score: 0,
          conversion_probability: 0.00,
          enriched_data: {}
        });
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrors({ general: 'Erreur lors de la sauvegarde. Veuillez réessayer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-white">
          {prospectId ? 'Modifier le prospect' : 'Ajouter un prospect'}
        </h2>
        
        {errors.general && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-100 rounded">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Entreprise *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors text-white placeholder-gray-400 ${
                errors.company_name ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
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
              <label className="block text-sm font-medium mb-1 text-gray-200">Prénom *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className={`w-full p-2 rounded bg-gray-800 border transition-colors text-white placeholder-gray-400 ${
                  errors.first_name ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
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
              <label className="block text-sm font-medium mb-1 text-gray-200">Nom *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className={`w-full p-2 rounded bg-gray-800 border transition-colors text-white placeholder-gray-400 ${
                  errors.last_name ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
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
            <label className="block text-sm font-medium mb-1 text-gray-200">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors text-white placeholder-gray-400 ${
                errors.email ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="email@exemple.com"
              disabled={isSubmitting}
              required
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Poste</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors text-white placeholder-gray-400 ${
                errors.position ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="Poste occupé"
              disabled={isSubmitting}
            />
            {errors.position && (
              <p className="text-red-400 text-sm mt-1">{errors.position}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Site web</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors text-white placeholder-gray-400 ${
                errors.website ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="https://exemple.com"
              disabled={isSubmitting}
            />
            {errors.website && (
              <p className="text-red-400 text-sm mt-1">{errors.website}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">LinkedIn</label>
            <input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors text-white placeholder-gray-400 ${
                errors.linkedin_url ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="https://linkedin.com/in/profil"
              disabled={isSubmitting}
            />
            {errors.linkedin_url && (
              <p className="text-red-400 text-sm mt-1">{errors.linkedin_url}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => handleInputChange('source', e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
              placeholder="Source du prospect (ex: site web, recommandation, etc.)"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-200">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 transition-colors text-white placeholder-gray-400"
              rows={4}
              placeholder="Notes sur le prospect..."
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50 text-white"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sauvegarde...' : (prospectId ? 'Mettre à jour' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProspectForm;