-- Migration pour ajouter les colonnes manquantes à la table prospects

-- Ajouter les colonnes manquantes pour le workflow n8n
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS next_follow_up timestamptz,
ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_probability decimal(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS enriched_data jsonb DEFAULT '{}'::jsonb;

-- Ajouter des colonnes optionnelles pour plus de flexibilité
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_prospects_next_follow_up ON prospects(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_prospects_lead_score ON prospects(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_prospects_last_email_sent ON prospects(last_email_sent);
CREATE INDEX IF NOT EXISTS idx_prospects_tags ON prospects USING gin(tags);

-- Mettre à jour les prospects existants avec des valeurs par défaut
UPDATE prospects 
SET 
    lead_score = COALESCE(lead_score, 0),
    conversion_probability = COALESCE(conversion_probability, 0.00),
    enriched_data = COALESCE(enriched_data, '{}'::jsonb)
WHERE lead_score IS NULL OR conversion_probability IS NULL OR enriched_data IS NULL;