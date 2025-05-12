import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Music2, Video, Mic, Image, Radio, Users, Calendar, Settings } from 'lucide-react';
import { Service } from '../../lib/types';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'music':
        return <Music2 className="h-6 w-6" />;
      case 'video':
        return <Video className="h-6 w-6" />;
      case 'mic':
        return <Mic className="h-6 w-6" />;
      case 'image':
        return <Image className="h-6 w-6" />;
      case 'radio':
        return <Radio className="h-6 w-6" />;
      case 'users':
        return <Users className="h-6 w-6" />;
      case 'calendar':
        return <Calendar className="h-6 w-6" />;
      case 'settings':
        return <Settings className="h-6 w-6" />;
      default:
        return null;
    }
  };

  return (
    <div className="group h-full">
      <div className="bg-primary-900 rounded-xl p-6 h-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(185,158,119,0.2)] hover:-translate-y-1">
        <div className="bg-accent-600/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <span className="text-accent-400">
            {getIcon(service.icon)}
          </span>
        </div>

        <h3 className="text-xl font-bold mb-3 gold-gradient">
          {service.title}
        </h3>

        <p className="text-gray-400 mb-6">
          {service.description}
        </p>

        <ul className="space-y-3 mb-6">
          {service.features.map((feature, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-start"
            >
              <span className="text-accent-400 mr-2">•</span>
              <span className="text-gray-300">{feature}</span>
            </motion.li>
          ))}
        </ul>

        <div className="pt-4 mt-auto">
          <motion.div
            whileHover={{ x: 5 }}
            className="inline-flex items-center text-accent-400 hover:text-accent-300 transition-colors"
          >
            <Link to="/contact" className="font-medium">
              En savoir plus
            </Link>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;