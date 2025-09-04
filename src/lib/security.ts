import { supabase } from './supabase';

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

interface RateLimitRecord {
  count: number;
  timestamp: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Supprimer checkRateLimit et garder seulement rateLimit
export const rateLimit = (identifier: string, maxRequests: number = MAX_REQUESTS): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || (now - record.timestamp) > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

// Image validation
export const validateImage = (file: File): string | null => {
  // Check file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return "L'image ne doit pas dépasser 5MB";
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return "Le fichier doit être une image (JPG, PNG ou WebP)";
  }

  // Additional security checks
  if (file.name.includes('..') || file.name.includes('/')) {
    return "Nom de fichier invalide";
  }

  return null;
};

// YouTube URL validation
export const validateYouTubeUrl = (url: string): boolean => {
  if (!url) return true; // URL is optional
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})$/;
  return youtubeRegex.test(url);
};

// Extract YouTube ID
export const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
};

// Check for overlapping bookings
export const checkBookingOverlap = async (
  startDateTime: Date,
  endDateTime: Date,
  studioType: string,
  excludeId?: string
): Promise<boolean> => {
  const { data: overlappingBookings } = await supabase
    .from('studio_bookings')
    .select('id')
    .eq('studio_type', studioType)
    .eq('status', 'confirmed')
    .or(`start_datetime.lte.${endDateTime.toISOString()},end_datetime.gte.${startDateTime.toISOString()}`);

  if (!overlappingBookings) return false;

  if (excludeId) {
    return overlappingBookings.some(booking => booking.id !== excludeId);
  }

  return overlappingBookings.length > 0;
};

// Add function to check if user is anonymous
export const isAnonymousUser = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Check if user has is_anonymous claim in their JWT
  const token = await supabase.auth.getSession();
  if (!token.data.session?.access_token) return false;
  
  try {
    const payload = JSON.parse(atob(token.data.session.access_token.split('.')[1]));
    return payload.is_anonymous === true;
  } catch {
    return false;
  }
};

// Enhanced rate limiting with anonymous user detection
export const enhancedRateLimit = async (key: string, limit: number = 10): Promise<boolean> => {
  const isAnonymous = await isAnonymousUser();
  
  // Apply stricter limits for anonymous users
  const effectiveLimit = isAnonymous ? Math.floor(limit / 2) : limit;
  
  return rateLimit(key, effectiveLimit);
};

// Clean up old rate limit records periodically
export const cleanupRateLimitMap = (): void => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if ((now - record.timestamp) > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }
};

// Initialize cleanup interval (run every hour)
if (typeof window !== 'undefined') {
  setInterval(cleanupRateLimitMap, RATE_LIMIT_WINDOW);
}

// CSRF Protection
let csrfToken: string | null = null;

export const generateCSRFToken = (): string => {
  // Generate a cryptographically secure random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  csrfToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  
  // Store in sessionStorage for client-side validation
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('csrf_token', csrfToken);
  }
  
  return csrfToken;
};

export const validateCSRFToken = (token: string): boolean => {
  const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('csrf_token') : csrfToken;
  
  if (!storedToken || !token || storedToken !== token) {
    return false;
  }
  
  // Regenerate token after successful validation (one-time use)
  generateCSRFToken();
  return true;
};

// Input Sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match];
    })
    .trim();
};

// Email validation with security checks
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Basic format check
  if (!emailRegex.test(email)) return false;
  
  // Additional security checks
  if (email.length > 254) return false; // RFC 5321 limit
  if (email.includes('..')) return false; // Consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false;
  
  return true;
};

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Content Security Policy helpers
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
};

// Session security
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) return false;
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      await supabase.auth.signOut();
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Secure headers validation
export const validateSecureHeaders = (headers: Headers): boolean => {
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection'
  ];
  
  return requiredHeaders.every(header => headers.has(header));
};
