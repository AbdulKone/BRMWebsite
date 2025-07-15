import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useContentStore } from '../../stores/contentStore';
import ParallaxHero from './ParallaxHero';
import ProjectCarousel from './ProjectCarousel';
import ArtistNews from './ArtistNews';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { fetchProjects, fetchArtists, fetchServices, isLoading } = useContentStore();

  useEffect(() => {
    fetchProjects();
    fetchArtists();
    fetchServices();
  }, []);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="overflow-hidden">
      <ParallaxHero />
      
      <section className="py-20 bg-primary-950">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-heading font-bold mb-3 gold-gradient">
              Nos derniers projets
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Découvrez les dernières productions musicales et visuelles réalisées par notre label
            </p>
          </motion.div>
          
          <ProjectCarousel />
        </div>
      </section>
      
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-heading font-bold mb-3 gold-gradient">
              BRM News
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              L'actualité des artistes qui nous ont fait confiance 
            </p>
          </motion.div>
          
          <ArtistNews />
        </div>
      </section>
      
      <section className="py-20 bg-primary-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="bg-[url('https://images.pexels.com/photos/164829/pexels-photo-164829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center h-full w-full"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 gold-gradient">
                Prêt à donner vie à votre projet musical?
              </h2>
              <p className="text-gray-300 mb-8 text-lg">
                Chez Black Road Music, nous mettons notre expertise et notre passion au service de votre créativité. 
                Contactez-nous pour discuter de votre vision et découvrir comment nous pouvons la transformer en réalité.
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/contact" 
                  className="inline-block bg-gradient-to-r from-accent-700 to-accent-500 text-white font-medium py-3 px-8 rounded-full transition-all hover:shadow-[0_0_15px_rgba(185,158,119,0.5)]"
                >
                  Collaborer avec nous
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;