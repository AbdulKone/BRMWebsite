import { useState } from 'react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContentStore } from '../../stores/contentStore';
import ReactPlayer from 'react-player/lazy';
import Image from '../shared/Image';
import ImageLoader from '../shared/ImageLoader';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ProjectCarousel = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const { projects } = useContentStore();
  
  const closeVideo = () => {
    setActiveVideo(null);
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  return (
    <>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        breakpoints={{
          640: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        className="pb-12"
      >
        {projects.map((project) => (
          <SwiperSlide key={project.id}>
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-primary-800 rounded-lg overflow-hidden shadow-lg"
            >
              <div className="relative h-60 overflow-hidden bg-primary-800">
                <Image
                  src={project.image_url}
                  alt={project.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  loadingComponent={<ImageLoader />}
                />
                {project.video_url && getYouTubeId(project.video_url) && (
                  <button
                    onClick={() => setActiveVideo(project.video_url || null)}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  >
                    <span className="w-16 h-16 rounded-full bg-accent-500/80 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </span>
                  </button>
                )}
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-accent-600 text-xs font-semibold px-2.5 py-1 rounded-full text-white">
                    {project.type === 'music' ? 'Musique' : 'Vidéo'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold mb-1 gold-gradient">{project.title}</h3>
                <p className="text-gray-400 text-sm mb-2">{project.artist} • {project.year}</p>
                <p className="text-gray-300 text-sm line-clamp-3">{project.description}</p>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      {activeVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-5">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={closeVideo}
              className="absolute -top-12 right-0 text-white hover:text-accent-400 transition-colors"
            >
              <span className="sr-only">Fermer</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="aspect-w-16 aspect-h-9">
              <ReactPlayer
                url={activeVideo}
                width="100%"
                height="100%"
                controls
                playing
                light={false} // Désactive la miniature pour éviter les requêtes supplémentaires
                config={{
                  youtube: {
                    playerVars: { 
                      showinfo: 1,
                      origin: window.location.origin,
                      modestbranding: 1, // Réduit le branding YouTube
                      rel: 0 // Désactive les vidéos suggérées
                    }
                  }
                }}
                onError={(error) => {
                  console.error('Erreur ReactPlayer:', error);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectCarousel;