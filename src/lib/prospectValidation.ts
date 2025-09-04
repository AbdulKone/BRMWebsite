import { HunterProspect } from './types/hunterTypes';

interface ValidationRule {
  field: keyof HunterProspect;
  type: 'required' | 'email' | 'url';
  message: string;
  validator?: (value: unknown) => boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class ProspectValidation {
  private static rules: ValidationRule[] = [
    { field: 'email', type: 'required', message: 'L\'email est requis' },
    { field: 'email', type: 'email', message: 'L\'email doit être valide' },
    { field: 'company', type: 'required', message: 'Le nom de l\'entreprise est requis' },
  ];

  static validate(prospect: HunterProspect): ValidationResult {
    const errors: Record<string, string> = {};

    for (const rule of this.rules) {
      const value = prospect[rule.field];
      
      if (rule.type === 'required' && (!value || value === '')) {
        errors[rule.field] = rule.message;
      } else if (rule.type === 'email' && value && !this.isValidEmail(value as string)) {
        errors[rule.field] = rule.message;
      } else if (rule.validator && !rule.validator(value)) {
        errors[rule.field] = rule.message;
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}