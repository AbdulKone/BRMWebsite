-- Migration pour corriger le type de template_id dans scheduled_emails

-- Supprimer la contrainte de clé étrangère existante si elle existe
ALTER TABLE scheduled_emails DROP CONSTRAINT IF EXISTS scheduled_emails_template_id_fkey;

-- Modifier le type de la colonne template_id de text vers uuid
ALTER TABLE scheduled_emails ALTER COLUMN template_id TYPE uuid USING template_id::uuid;

-- Recréer la contrainte de clé étrangère avec le bon type
ALTER TABLE scheduled_emails 
  ADD CONSTRAINT scheduled_emails_template_id_fkey 
  FOREIGN KEY (template_id) REFERENCES email_templates(id);

-- Vérifier que les autres colonnes de type uuid sont correctes
-- Si prospect_id est aussi de type text, le corriger également
DO $$
BEGIN
  -- Vérifier si prospect_id existe et est de type text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scheduled_emails' 
    AND column_name = 'prospect_id' 
    AND data_type = 'text'
  ) THEN
    -- Supprimer la contrainte existante
    ALTER TABLE scheduled_emails DROP CONSTRAINT IF EXISTS scheduled_emails_prospect_id_fkey;
    
    -- Modifier le type
    ALTER TABLE scheduled_emails ALTER COLUMN prospect_id TYPE uuid USING prospect_id::uuid;
    
    -- Recréer la contrainte
    ALTER TABLE scheduled_emails 
      ADD CONSTRAINT scheduled_emails_prospect_id_fkey 
      FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Vérifier que sequence_id est bien de type uuid si elle référence automated_sequences
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scheduled_emails' 
    AND column_name = 'sequence_id' 
    AND data_type = 'text'
  ) THEN
    -- Supprimer la contrainte existante
    ALTER TABLE scheduled_emails DROP CONSTRAINT IF EXISTS scheduled_emails_sequence_id_fkey;
    
    -- Modifier le type
    ALTER TABLE scheduled_emails ALTER COLUMN sequence_id TYPE uuid USING sequence_id::uuid;
    
    -- Recréer la contrainte si la table automated_sequences existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automated_sequences') THEN
      ALTER TABLE scheduled_emails 
        ADD CONSTRAINT scheduled_emails_sequence_id_fkey 
        FOREIGN KEY (sequence_id) REFERENCES automated_sequences(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;