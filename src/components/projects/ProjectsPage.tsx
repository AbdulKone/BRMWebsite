import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import ReactPlayer from 'react-player/lazy';
import { useContentStore } from '../../stores/contentStore';
import { Project } from '../../lib/types';
import Image from '../shared/Image';
import ImageLoader from '../shared/ImageLoader';

const ProjectsPage = () => {
  const { projects, fetchProjects, isLoading } = useContentStore();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'music' | 'video'>('all');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter((project) => project.type === filter));
    }
  }, [filter, projects]);

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-accent-400">Chargement...</div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="pt-24 pb-20 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 gold-gradient">
            Nos Projets
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Découvrez les projets et productions réalisés par Black Road Music, des albums aux clips vidéo en passant par les mixtapes et EP.
          </p>
        </motion.div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-primary-800 rounded-full p-1">
            {[
              { label: 'Tous', value: 'all' },
              { label: 'Musique', value: 'music' },
              { label: 'Vidéo', value: 'video' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as any)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === option.value
                    ? 'bg-accent-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={item}
              whileHover={{ y: -10 }}
              className="bg-primary-900 rounded-lg overflow-hidden shadow-lg h-full"
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
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1 gold-gradient">{project.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{project.artist} • {project.year}</p>
                <p className="text-gray-300">{project.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {activeVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-5">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setActiveVideo(null)}
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
    </div>
  );
};

export default ProjectsPage;