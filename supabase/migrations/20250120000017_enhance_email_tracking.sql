-- Ajouter des colonnes pour l'intégration n8n à email_tracking
ALTER TABLE email_tracking 
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'sent',
ADD COLUMN IF NOT EXISTS n8n_execution_id TEXT,
ADD COLUMN IF NOT EXISTS workflow_id TEXT,
ADD COLUMN IF NOT EXISTS sequence_step INTEGER,
ADD COLUMN IF NOT EXISTS automation_triggered BOOLEAN DEFAULT false;

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_email_tracking_email_status ON email_tracking(email_status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_n8n_execution ON email_tracking(n8n_execution_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_workflow_id ON email_tracking(workflow_id);