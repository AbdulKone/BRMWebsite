import { useEffect, useState } from 'react';

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
  startOffset?: number;
}

export default function useParallax({
  speed = 0.5,
  direction = 'up',
  startOffset = 0,
}: ParallaxOptions = {}) {
  const [offset, setOffset] = useState(startOffset);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const newOffset = direction === 'up' 
        ? startOffset + scrollY * speed 
        : startOffset - scrollY * speed;
      
      setOffset(newOffset);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed, direction, startOffset]);

  return {
    transform: `translateY(${offset}px)`,
  };
}