-- Migration pour corriger la contrainte sequence_type manquante
-- Ajoute la colonne sequence_type avec une valeur par défaut

-- Supprimer les triggers existants pour nos tables
DROP TRIGGER IF EXISTS update_automation_config_updated_at ON automation_config;
DROP TRIGGER IF EXISTS update_automated_sequences_updated_at ON automated_sequences;

-- Supprimer et recréer la table automation_config
DROP TABLE IF EXISTS automation_config CASCADE;

-- Créer la table automation_config
CREATE TABLE automation_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  is_active BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{
    "dailyLimit": 50,
    "followUpDelay": 24,
    "workingHours": {
      "start": "09:00",
      "end": "18:00"
    },
    "workingDays": [1, 2, 3, 4, 5]
  }'::jsonb,
  n8n_webhook_url TEXT,
  n8n_api_key TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter toutes les colonnes nécessaires à la table automated_sequences
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS trigger_event TEXT DEFAULT 'new_prospect';
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS delay_hours INTEGER DEFAULT 0;
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS email_template_id UUID;
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS sequence_type TEXT DEFAULT 'email';
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE automated_sequences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Mettre à jour les valeurs NULL dans toutes les colonnes
UPDATE automated_sequences SET name = 'Sequence ' || id::text WHERE name IS NULL;
UPDATE automated_sequences SET description = 'Sequence automatisee' WHERE description IS NULL;
UPDATE automated_sequences SET trigger_event = 'new_prospect' WHERE trigger_event IS NULL;
UPDATE automated_sequences SET sequence_type = 'email' WHERE sequence_type IS NULL;
UPDATE automated_sequences SET is_active = true WHERE is_active IS NULL;
UPDATE automated_sequences SET position = 0 WHERE position IS NULL;
UPDATE automated_sequences SET delay_hours = 0 WHERE delay_hours IS NULL;
UPDATE automated_sequences SET created_at = NOW() WHERE created_at IS NULL;
UPDATE automated_sequences SET updated_at = NOW() WHERE updated_at IS NULL;

-- Définir les contraintes NOT NULL pour les colonnes importantes
ALTER TABLE automated_sequences ALTER COLUMN name SET NOT NULL;
ALTER TABLE automated_sequences ALTER COLUMN trigger_event SET NOT NULL;
ALTER TABLE automated_sequences ALTER COLUMN sequence_type SET NOT NULL;

-- Créer les index essentiels
CREATE INDEX IF NOT EXISTS idx_automated_sequences_trigger_event ON automated_sequences(trigger_event);
CREATE INDEX IF NOT EXISTS idx_automated_sequences_is_active ON automated_sequences(is_active);
CREATE INDEX IF NOT EXISTS idx_automated_sequences_name ON automated_sequences(name);
CREATE INDEX IF NOT EXISTS idx_automated_sequences_sequence_type ON automated_sequences(sequence_type);

-- Créer ou remplacer la fonction update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer les triggers pour nos tables
CREATE TRIGGER update_automation_config_updated_at
  BEFORE UPDATE ON automation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automated_sequences_updated_at
  BEFORE UPDATE ON automated_sequences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS sur les tables
ALTER TABLE automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_sequences ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes et les recréer
DROP POLICY IF EXISTS "Admins can manage automation_config" ON automation_config;
DROP POLICY IF EXISTS "Admins can manage automated_sequences" ON automated_sequences;

CREATE POLICY "Admins can manage automation_config" ON automation_config
  FOR ALL USING (is_admin_user());

CREATE POLICY "Admins can manage automated_sequences" ON automated_sequences
  FOR ALL USING (is_admin_user());

-- Insérer les données par défaut pour automation_config
INSERT INTO automation_config (id, is_active, config) 
VALUES (
  'main', 
  false, 
  '{
    "dailyLimit": 50,
    "followUpDelay": 24,
    "workingHours": {
      "start": "09:00",
      "end": "18:00"
    },
    "workingDays": [1, 2, 3, 4, 5]
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  config = EXCLUDED.config,
  updated_at = NOW();

-- Insérer des exemples de séquences automatisées avec sequence_type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM automated_sequences WHERE name = 'Sequence accueil') THEN
    INSERT INTO automated_sequences (name, description, trigger_event, delay_hours, is_active, position, sequence_type) 
    VALUES ('Sequence accueil', 'Premier contact avec un nouveau prospect', 'new_prospect', 0, true, 1, 'email');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM automated_sequences WHERE name = 'Suivi 24h') THEN
    INSERT INTO automated_sequences (name, description, trigger_event, delay_hours, is_active, position, sequence_type) 
    VALUES ('Suivi 24h', 'Suivi automatique après 24h sans réponse', 'follow_up', 24, true, 2, 'email');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM automated_sequences WHERE name = 'Suivi 72h') THEN
    INSERT INTO automated_sequences (name, description, trigger_event, delay_hours, is_active, position, sequence_type) 
    VALUES ('Suivi 72h', 'Second suivi après 72h sans réponse', 'follow_up', 72, true, 3, 'email');
  END IF;
END $$;