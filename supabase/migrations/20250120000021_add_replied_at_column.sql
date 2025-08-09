-- Migration pour ajouter la colonne replied_at manquante à email_tracking

-- Ajouter la colonne replied_at pour le suivi des réponses
ALTER TABLE email_tracking 
ADD COLUMN IF NOT EXISTS replied_at timestamptz;

-- Créer un index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_email_tracking_replied_at ON email_tracking(replied_at);

-- Optionnel : Ajouter une colonne sequence_id si elle n'existe pas
ALTER TABLE email_tracking 
ADD COLUMN IF NOT EXISTS sequence_id text;

-- Optionnel : Ajouter une colonne step_id si elle n'existe pas
ALTER TABLE email_tracking 
ADD COLUMN IF NOT EXISTS step_id text;

-- Créer des index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_email_tracking_sequence_id ON email_tracking(sequence_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_step_id ON email_tracking(step_id);