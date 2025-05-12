import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  loadingComponent?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const Image = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSrc = 'https://placehold.co/600x400?text=Image+non+disponible',
  loadingComponent,
  onLoad: externalOnLoad,
  onError: externalOnError,
  ...props 
}: ImageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
    setLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    console.log(`Image loaded successfully: ${src}`);
    setLoading(false);
    setError(false);
    externalOnLoad?.();
  };

  const handleError = () => {
    console.error(`Failed to load image: ${src}`, {
      originalSrc: src,
      fallbackSrc,
      alt,
      timestamp: new Date().toISOString()
    });
    
    setLoading(false);
    setError(true);
    setImgSrc(fallbackSrc);
    externalOnError?.();
  };

  return (
    <div className="relative overflow-hidden" data-testid="image-container">
      {loading && loadingComponent && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-800">
          {loadingComponent}
        </div>
      )}
      
      <motion.img
        src={imgSrc}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} ${
          error ? 'bg-primary-800' : ''
        } transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    </div>
  );
};

export default Image;