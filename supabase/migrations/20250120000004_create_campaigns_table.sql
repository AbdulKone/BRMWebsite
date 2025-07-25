-- Créer la table campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_id uuid REFERENCES email_templates(id),
  segment_targeting jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  scheduled_at timestamptz,
  sent_count integer DEFAULT 0,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  response_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- Trigger pour updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to campaigns"
  ON campaigns FOR ALL
  TO authenticated
  USING (is_admin());