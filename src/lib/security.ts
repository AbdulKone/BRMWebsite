import { supabase } from './supabase';

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

interface RateLimitRecord {
  count: number;
  timestamp: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || (now - record.timestamp) > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
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
