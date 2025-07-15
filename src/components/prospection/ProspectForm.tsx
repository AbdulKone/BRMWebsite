import { useState, useEffect, useCallback } from 'react';
import { useProspectionStore } from '../../stores/prospectionStore';

interface ProspectFormProps {
  prospectId?: string;
  onClose: () => void;
}

interface FormErrors {
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  notes?: string;  // Ajouter cette ligne
  general?: string;
}

interface FormData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  notes: string;
}

const ProspectForm = ({ prospectId, onClose }: ProspectFormProps) => {
  const { addProspect, updateProspect, prospects } = useProspectionStore();
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prospectId) {
      const prospect = prospects.find(p => p.id === prospectId);
      if (prospect) {
        setFormData({
          company_name: prospect.company_name,
          contact_name: prospect.contact_name,
          email: prospect.email,
          phone: prospect.phone || '',
          notes: prospect.notes || ''
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

    // Validation du nom de contact
    if (!formData.contact_name.trim()) {
      newErrors.contact_name = 'Le nom du contact est requis';
    } else if (formData.contact_name.trim().length < 2) {
      newErrors.contact_name = 'Le nom du contact doit contenir au moins 2 caractères';
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation du téléphone (optionnel mais doit être valide si fourni)
    if (formData.phone && !/^[+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
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

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    setErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []); // Tableau de dépendances vide

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const trimmedData = {
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim()
      };

      if (prospectId) {
        await updateProspect(prospectId, trimmedData);
      } else {
        await addProspect({
          ...trimmedData,
          status: 'new',
          last_contact: new Date().toISOString()
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
      <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {prospectId ? 'Modifier le prospect' : 'Ajouter un prospect'}
        </h2>
        
        {errors.general && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-100 rounded">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Entreprise *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors ${
                errors.company_name ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="Nom de l'entreprise"
              disabled={isSubmitting}
              required
            />
            {errors.company_name && (
              <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Contact *</label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => handleInputChange('contact_name', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors ${
                errors.contact_name ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="Nom du contact"
              disabled={isSubmitting}
              required
            />
            {errors.contact_name && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="email@exemple.com"
              disabled={isSubmitting}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full p-2 rounded bg-gray-800 border transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
              placeholder="+33 1 23 45 67 89"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 focus:border-blue-500 transition-colors"
              rows={4}
              placeholder="Notes sur le prospect..."
              disabled={isSubmitting}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50"
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