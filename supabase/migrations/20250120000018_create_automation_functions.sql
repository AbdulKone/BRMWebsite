-- Fonction pour obtenir les prospects prêts pour le suivi
CREATE OR REPLACE FUNCTION get_prospects_ready_for_followup()
RETURNS TABLE (
  prospect_id uuid,
  company_name text,
  email text,
  next_follow_up timestamptz,
  lead_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.company_name,
    p.email,
    p.next_follow_up,
    p.lead_score
  FROM prospects p
  WHERE p.next_follow_up <= NOW()
    AND p.status NOT IN ('closed_won', 'closed_lost')
  ORDER BY p.lead_score DESC, p.next_follow_up ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les emails programmés à envoyer
CREATE OR REPLACE FUNCTION get_scheduled_emails_to_send()
RETURNS TABLE (
  email_id uuid,
  prospect_id uuid,
  template_id uuid,
  subject text,
  content text,
  scheduled_for timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    se.id,
    se.prospect_id,
    se.template_id,
    se.subject,
    se.content,
    se.scheduled_for
  FROM scheduled_emails se
  WHERE se.status = 'pending'
    AND se.scheduled_for <= NOW()
  ORDER BY se.scheduled_for ASC
  LIMIT 50; -- Limite pour éviter la surcharge
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer un email comme envoyé
CREATE OR REPLACE FUNCTION mark_email_as_sent(
  email_id uuid,
  tracking_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE scheduled_emails 
  SET 
    status = 'sent',
    sent_at = NOW(),
    updated_at = NOW()
  WHERE id = email_id;
  
  -- Optionnel : créer une entrée dans email_tracking si tracking_id fourni
  IF tracking_id IS NOT NULL THEN
    INSERT INTO email_tracking (id, prospect_id, template_id, subject, sent_at, status)
    SELECT tracking_id, se.prospect_id, se.template_id, se.subject, NOW(), 'sent'
    FROM scheduled_emails se
    WHERE se.id = email_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;