import { motion } from 'framer-motion';
import ContactForm from './ContactForm';
import socialLinks from '../../data/social';
import { Instagram, Youtube, Music, Video } from 'lucide-react';

const ContactPage = () => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'instagram':
        return <Instagram className="h-6 w-6" />;
      case 'youtube':
        return <Youtube className="h-6 w-6" />;
      case 'music':
        return <Music className="h-6 w-6" />;
      case 'video':
        return <Video className="h-6 w-6" />;
      default:
        return null;
    }
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
            Contact
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Une question, un projet ou une idée de collaboration ? 
            N'hésitez pas à nous contacter, nous vous répondrons dans les plus brefs délais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-heading font-bold mb-6 gold-gradient">
              Envoyez-nous un message
            </h2>
            <ContactForm />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:pl-10"
          >
            <h2 className="text-2xl font-heading font-bold mb-6 gold-gradient">
              Informations de contact
            </h2>

            <div className="bg-primary-900 rounded-xl p-6 md:p-8 mb-8">
              <div className="space-y-6">

                <div>
                  <h3 className="text-lg font-semibold mb-2">Contact</h3>
                  <p className="text-gray-400 mb-1">contact@blackroadmusic.com</p>
                  {/* <p className="text-gray-400">+33 7 65 26 12 62</p> */}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Réseaux Sociaux</h3>
                  <div className="flex flex-wrap gap-4">
                    {socialLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-primary-800 p-2.5 rounded-full text-white hover:bg-accent-700 transition-colors"
                        aria-label={link.platform}
                      >
                        {getIconComponent(link.icon)}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

             {/* <div className="rounded-xl overflow-hidden h-60 md:h-80 relative">
              <iframe
                title="Black Road Music Location"
                className="absolute inset-0 w-full h-full border-0"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.6488531248005!2d2.3785151999999997!3d48.8629861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66ddb27f321c3%3A0x9fbfa564159de28!2s75011%20Paris%2C%20France!5e0!3m2!1sfr!2sfr!4v1634567890123!5m2!1sfr!2sfr"
                loading="lazy"
                style={{ filter: 'grayscale(100%) invert(92%) contrast(83%)' }}
              ></iframe> 
            </div>*/}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;