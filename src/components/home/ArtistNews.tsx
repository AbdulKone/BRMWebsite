import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import Image from '../shared/Image';
import ImageLoader from '../shared/ImageLoader';

const ArtistNews = () => {
  const { artists } = useContentStore();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {artists.map((artist) => (
        <motion.div
          key={artist.id}
          variants={item}
          className="bg-primary-900 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:shadow-[0_0_15px_rgba(185,158,119,0.2)] hover:-translate-y-2"
        >
          <div className="h-60 overflow-hidden relative bg-primary-800">
            <Image
              src={artist.image_url}
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loadingComponent={<ImageLoader />}
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-1 gold-gradient">{artist.name}</h3>
            <p className="text-gray-400 text-sm mb-2">
              Dernier projet : {artist.latest_work} • {new Date(artist.release_date).toLocaleDateString()}
            </p>
            <p className="text-gray-300 text-sm mb-4">{artist.description}</p>
            {artist.profile_url && (
              <a
                href={artist.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-accent-400 hover:text-accent-300 transition-colors"
              >
                <span>Découvrir</span>
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ArtistNews;