-- Drop duplicate indexes on email_tracking table
-- We're keeping idx_email_tracking_prospect_id and dropping the other two identical indexes

-- Drop the duplicate indexes
DROP INDEX IF EXISTS email_tracking_prospect_id_idx;
DROP INDEX IF EXISTS idx_email_tracking_prospect;

-- Add a comment explaining the change
COMMENT ON INDEX idx_email_tracking_prospect_id IS 'Index on prospect_id column of email_tracking table. Duplicate indexes email_tracking_prospect_id_idx and idx_email_tracking_prospect were dropped.';