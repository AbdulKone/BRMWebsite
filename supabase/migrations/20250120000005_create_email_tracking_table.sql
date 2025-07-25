-- Créer la table email_tracking
CREATE TABLE IF NOT EXISTS email_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  template_id uuid REFERENCES email_templates(id),
  subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  sequence_id text,
  step_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_email_tracking_prospect_id ON email_tracking(prospect_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign_id ON email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON email_tracking(status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at);

-- RLS
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to email_tracking"
  ON email_tracking FOR ALL
  TO authenticated
  USING (is_admin());