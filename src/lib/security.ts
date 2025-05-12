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