/*
  # Create Email Templates Table

  1. New table `email_templates`
    - `id` (uuid, primary key)
    - `template_key` (text, unique identifier for code reference)
    - `name` (text)
    - `subject` (text)
    - `content` (text)
    - `variables` (jsonb)
    - `category` (text)
    - `is_active` (boolean)
    - `priority` (text)
    - `segment_targeting` (jsonb)
    - `ab_test_variant` (text)
    - `performance_metrics` (jsonb)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Set up Row Level Security (RLS)
  3. Insert default templates
*/

-- Create the email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  priority text DEFAULT 'medium',
  segment_targeting jsonb DEFAULT '[]'::jsonb,
  ab_test_variant text DEFAULT 'A',
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_template_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_email_templates_priority ON email_templates(priority);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to active email templates"
  ON email_templates FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow admin full access to email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING (is_admin());

-- Insert default email templates with proper UUIDs
INSERT INTO email_templates (template_key, name, subject, content, variables, category, is_active, priority, segment_targeting, ab_test_variant, performance_metrics) VALUES
('visual_intro_advertising', 'Introduction Spécialisée - Publicité Visuelle', '🎬 Transformez vos campagnes avec des visuels qui marquent les esprits', 'Bonjour {{contact_name}},

J''ai remarqué les campagnes innovantes de {{company_name}} et je pense que nous pourrions créer quelque chose d''exceptionnel ensemble.

En tant que spécialiste en production visuelle, j''aide les marques comme la vôtre à :
• Créer des contenus publicitaires qui génèrent +40% d''engagement
• Développer une identité visuelle mémorable et différenciante
• Optimiser le ROI de vos campagnes grâce à des visuels performants

🎯 **Résultats récents :**
- Campagne pour [Client A] : +65% de taux de clic
- Série visuelle pour [Client B] : 2M+ de vues organiques
- Rebranding complet : +30% de reconnaissance de marque

J''aimerais vous montrer comment nous pourrions amplifier l''impact visuel de {{company_name}}.

Seriez-vous disponible pour un échange de 15 minutes cette semaine ?

Cordialement,
{{sender_name}}

P.S. : Je peux vous envoyer notre portfolio spécialisé en publicité si cela vous intéresse.', '["contact_name", "company_name", "sender_name"]'::jsonb, 'introduction', true, 'high', '["enterprise", "creative_agencies"]'::jsonb, 'A', '{"open_rate": 0.45, "click_rate": 0.12, "response_rate": 0.08, "conversion_rate": 0.15, "last_updated": "2024-01-15"}'::jsonb),

('music_video_intro', 'Introduction - Clip Musical', '🎵 Donnez vie à votre musique avec des clips d''exception', 'Bonjour {{contact_name}},

Votre dernière sortie musicale m''a vraiment impressionné ! En tant que réalisateur spécialisé dans les clips musicaux, je vois un potentiel énorme pour créer quelque chose de visuel qui soit à la hauteur de votre talent.

🎬 **Ce que nous pouvons créer ensemble :**
• Clips musicaux cinématographiques
• Vidéos conceptuelles uniques
• Captations live professionnelles
• Contenus pour réseaux sociaux

✨ **Références récentes :**
- Clip pour [Artiste A] : 500K+ vues en 2 semaines
- Série de contenus pour [Artiste B] : +200% d''engagement
- Captation live [Événement] : diffusion sur [Plateforme]

J''aimerais discuter de votre prochain projet et vous montrer comment nous pourrions créer quelque chose d''exceptionnel pour {{artist_name}}.

Êtes-vous disponible pour un appel cette semaine ?

Musicalement,
{{sender_name}}

P.S. : Je peux vous envoyer notre reel spécialisé clips musicaux.', '["contact_name", "artist_name", "sender_name"]'::jsonb, 'introduction', true, 'high', '["musicians", "record_labels"]'::jsonb, 'A', '{"open_rate": 0.52, "click_rate": 0.18, "response_rate": 0.12, "conversion_rate": 0.20, "last_updated": "2024-01-15"}'::jsonb),

('luxury_sports_intro', 'Introduction - Publicité Luxe & Sport', '🏆 Créons des campagnes qui reflètent l''excellence de votre marque', 'Bonjour {{contact_name}},

L''univers du luxe et du sport de haut niveau demande une approche visuelle d''exception. En découvrant {{company_name}}, j''ai immédiatement pensé aux possibilités créatives que nous pourrions explorer ensemble.

🎯 **Notre expertise pour les marques premium :**
• Campagnes publicitaires haut de gamme
• Contenus événementiels exclusifs
• Storytelling visuel sophistiqué
• Production internationale

🏅 **Collaborations de prestige :**
- Campagne [Marque Luxe] : Prix créatif international
- Événement sportif [Nom] : 10M+ de portée
- Série documentaire [Sujet] : Diffusion premium

Je serais ravi de vous présenter notre approche créative et discuter de vos prochains défis visuels.

Seriez-vous disponible pour un échange privilégié ?

Cordialement,
{{sender_name}}

P.S. : Notre portfolio confidentiel est disponible sur demande.', '["contact_name", "company_name", "sender_name"]'::jsonb, 'introduction', true, 'high', '["luxury_brands", "sports_brands"]'::jsonb, 'A', '{"open_rate": 0.48, "click_rate": 0.15, "response_rate": 0.10, "conversion_rate": 0.18, "last_updated": "2024-01-15"}'::jsonb),

('wedding_intro', 'Introduction - Mariage d''Exception', '💍 Immortalisez votre jour J avec une approche cinématographique', 'Bonjour {{bride_name}} et {{groom_name}},

Félicitations pour vos fiançailles ! Votre histoire mérite d''être racontée avec la beauté et l''émotion qu''elle inspire.

En tant que réalisateur spécialisé dans les mariages d''exception, je crée des films qui capturent bien plus que des moments : je révèle l''essence de votre amour.

🎬 **Notre approche unique :**
• Réalisation cinématographique discrète
• Storytelling personnalisé à votre histoire
• Techniques de captation innovantes
• Post-production artistique raffinée

💫 **Créations récentes :**
- Mariage au [Lieu] : Film primé au concours [Nom]
- Destination wedding [Pays] : 100K+ vues organiques
- Cérémonie intime [Style] : Témoignage 5 étoiles

J''aimerais vous rencontrer pour découvrir votre vision et vous présenter notre approche créative.

Seriez-vous disponibles pour un rendez-vous cette semaine ?

Avec toute mon attention,
{{sender_name}}

P.S. : Je peux vous envoyer notre collection privée de films de mariage.', '["bride_name", "groom_name", "sender_name"]'::jsonb, 'introduction', true, 'medium', '["engaged_couples", "wedding_planners"]'::jsonb, 'A', '{"open_rate": 0.65, "click_rate": 0.25, "response_rate": 0.18, "conversion_rate": 0.35, "last_updated": "2024-01-15"}'::jsonb);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();