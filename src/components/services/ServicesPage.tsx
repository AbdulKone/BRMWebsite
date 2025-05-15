import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useContentStore } from '../../stores/contentStore';
import ServiceCard from './ServiceCard';
import { Link } from 'react-router-dom';

const ServicesPage = () => {
  const { services, fetchServices, isLoading } = useContentStore();

  useEffect(() => {
    fetchServices();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-accent-400">Chargement...</div>
      </div>
    );
  }

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
            Nos Services
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            De la production musicale à la réalisation audiovisuelle, découvrez notre gamme complète de services professionnels.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <ServiceCard service={service} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/164829/pexels-photo-164829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center opacity-10"></div>
          <div className="bg-primary-900/80 backdrop-blur-sm rounded-xl p-8 md:p-12 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-heading font-bold mb-6 gold-gradient">
                Prêt à donner vie à votre projet ?
              </h2>
              <p className="text-gray-300 mb-8">
                Chaque projet est unique et mérite une attention particulière. Contactez-nous pour discuter de vos besoins et obtenir un devis personnalisé.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/reserver" 
                  className="inline-block bg-gradient-to-r from-accent-700 to-accent-500 text-white font-medium py-3 px-8 rounded-full transition-all hover:shadow-[0_0_15px_rgba(185,158,119,0.5)]"
                >
                  Reserver une session
                </Link>
              </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServicesPage;