/*
  # Add Default Services

  1. Changes
    - Add default services for the audiovisual label
    - Add features for each service
*/

-- Insert default services
INSERT INTO services (id, title, description, icon) VALUES
  (gen_random_uuid(), 'Production Musicale', 'De l''enregistrement au mastering, nous vous accompagnons dans la création de votre projet musical.', 'music'),
  (gen_random_uuid(), 'Réalisation Vidéo', 'Clips musicaux, documentaires, captations live : donnez vie à votre vision artistique.', 'video'),
  (gen_random_uuid(), 'Studio d''Enregistrement', 'Un espace professionnel équipé des dernières technologies pour un son d''exception.', 'mic'),
  (gen_random_uuid(), 'Direction Artistique', 'Développement de votre identité artistique et accompagnement personnalisé.', 'users'),
  (gen_random_uuid(), 'Post-Production', 'Mixage, mastering et finalisation de vos projets avec des ingénieurs expérimentés.', 'settings'),
  (gen_random_uuid(), 'Location de Matériel', 'Équipements audio et vidéo professionnels pour vos productions.', 'radio');

-- Add features for Production Musicale
INSERT INTO service_features (service_id, feature)
SELECT id, unnest(ARRAY[
  'Enregistrement multipiste professionnel',
  'Arrangement et production musicale',
  'Mixage sur mesure',
  'Mastering haute qualité',
  'Musiciens de session disponibles',
  'Sound design et création sonore'
])
FROM services WHERE title = 'Production Musicale';

-- Add features for Réalisation Vidéo
INSERT INTO service_features (service_id, feature)
SELECT id, unnest(ARRAY[
  'Réalisation de clips musicaux',
  'Captation de concerts',
  'Documentaires musicaux',
  'Motion design',
  'Étalonnage professionnel',
  'Post-production complète'
])
FROM services WHERE title = 'Réalisation Vidéo';

-- Add features for Studio d'Enregistrement
INSERT INTO service_features (service_id, feature)
SELECT id, unnest(ARRAY[
  'Studio acoustique traité professionnellement',
  'Console analogique haut de gamme',
  'Microphones de prestige',
  'Cabine d''enregistrement isolée',
  'Salle de contrôle équipée',
  'Instruments disponibles sur place'
])
FROM services WHERE title = 'Studio d''Enregistrement';

-- Add features for Direction Artistique
INSERT INTO service_features (service_id, feature)
SELECT id, unnest(ARRAY[
  'Développement artistique',
  'Coaching vocal et scénique',
  'Création d''identité visuelle',
  'Stratégie de communication',
  'Consulting carrière',
  'Mise en relation professionnelle'
])
FROM services WHERE title = 'Direction Artistique';

-- Add features for Post-Production
INSERT INTO service_features (service_id, feature)
SELECT id, unnest(ARRAY[
  'Mixage audio professionnel',
  'Mastering adapté à tous supports',
  'Montage et édition vidéo',
  'Sound design',
  'Correction colorimétrique',
  'Export multi-formats'
])
FROM services WHERE title = 'Post-Production';

-- Add features for Location de Matériel
INSERT INTO service_features (service_id, feature)
SELECT id, unnest(ARRAY[
  'Caméras professionnelles',
  'Systèmes d''éclairage',
  'Matériel son broadcast',
  'Accessoires de tournage',
  'Support technique disponible',
  'Livraison possible'
])
FROM services WHERE title = 'Location de Matériel';