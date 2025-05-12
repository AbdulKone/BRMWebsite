import { motion } from 'framer-motion';

const ImageLoader = () => {
  return (
    <motion.div
      className="w-8 h-8 border-4 border-accent-400 border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      role="progressbar"
      aria-label="Chargement de l'image"
    />
  );
};

export default ImageLoader;