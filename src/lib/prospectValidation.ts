export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'url' | 'phone' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
}

export class ProspectValidator {
  private static rules: ValidationRule[] = [
    { field: 'email', type: 'required', message: 'L\'email est requis' },
    { field: 'email', type: 'email', message: 'Format d\'email invalide' },
    { field: 'company_name', type: 'required', message: 'Le nom de l\'entreprise est requis' },
    { field: 'website', type: 'url', message: 'Format d\'URL invalide' },
    { field: 'linkedin_url', type: 'custom', message: 'URL LinkedIn invalide', 
      validator: (value) => !value || value.includes('linkedin.com') }
  ];

  static validate(prospect: any): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    for (const rule of this.rules) {
      const value = prospect[rule.field];
      
      if (rule.type === 'required' && (!value || value.trim() === '')) {
        errors[rule.field] = rule.message;
      } else if (rule.type === 'email' && value && !this.isValidEmail(value)) {
        errors[rule.field] = rule.message;
      } else if (rule.type === 'url' && value && !this.isValidUrl(value)) {
        errors[rule.field] = rule.message;
      } else if (rule.type === 'custom' && rule.validator && !rule.validator(value)) {
        errors[rule.field] = rule.message;
      }
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}