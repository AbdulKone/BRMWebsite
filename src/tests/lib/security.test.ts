import { describe, it, expect, beforeEach } from 'vitest';
import { 
  validateImage, 
  validateYouTubeUrl, 
  getYouTubeId, 
  checkRateLimit,
  validateCSRFToken,
  generateCSRFToken,
  sanitizeInput,
  validateEmail
} from '../../lib/security';

describe('Security Utils', () => {
  describe('validateImage', () => {
    it('validates image size', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      expect(validateImage(file)).toBe("L'image ne doit pas dépasser 5MB");
    });

    it('validates image type', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(validateImage(file)).toBe("Le fichier doit être une image (JPG, PNG ou WebP)");
    });

    it('validates file name security', () => {
      const file = new File([''], '../test.jpg', { type: 'image/jpeg' });
      expect(validateImage(file)).toBe("Nom de fichier invalide");
    });
  });

  describe('validateYouTubeUrl', () => {
    it('validates correct YouTube URLs', () => {
      expect(validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('invalidates incorrect YouTube URLs', () => {
      expect(validateYouTubeUrl('https://youtube.com')).toBe(false);
      expect(validateYouTubeUrl('https://vimeo.com/123456')).toBe(false);
    });
  });

  describe('getYouTubeId', () => {
    it('extracts YouTube video ID', () => {
      expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for invalid URLs', () => {
      expect(getYouTubeId('https://youtube.com')).toBeNull();
      expect(getYouTubeId('invalid')).toBeNull();
    });
  });

  describe('CSRF Protection', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('generates and validates CSRF tokens', () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token)).toBe(true);
    });

    it('invalidates incorrect tokens', () => {
      generateCSRFToken();
      expect(validateCSRFToken('invalid-token')).toBe(false);
    });

    it('regenerates token after successful validation', () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token)).toBe(true);
      expect(validateCSRFToken(token)).toBe(false); // Should fail with old token
    });
  });

  describe('Input Sanitization', () => {
    it('removes HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('trims whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });
  });

  describe('Email Validation', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('invalidates incorrect email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Reset rate limit map before each test
      (global as any).rateLimitMap = new Map();
    });

    it('allows requests within rate limit', () => {
      const identifier = 'test-user';
      expect(checkRateLimit(identifier)).toBe(true);
      expect(checkRateLimit(identifier)).toBe(true);
    });

    it('blocks requests exceeding rate limit', () => {
      const identifier = 'test-user';
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier);
      }
      expect(checkRateLimit(identifier)).toBe(false);
    });

    it('resets rate limit after window expires', async () => {
      const identifier = 'test-user';
      for (let i = 0; i < 5; i++) {
        checkRateLimit(identifier);
      }
      expect(checkRateLimit(identifier)).toBe(false);

      // Fast-forward time by setting a new timestamp
      const record = (global as any).rateLimitMap.get(identifier);
      record.timestamp = Date.now() - 61000; // 61 seconds ago
      expect(checkRateLimit(identifier)).toBe(true);
    });
  });
});