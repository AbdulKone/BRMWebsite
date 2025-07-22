/*
  # Fix Role Mutable Search Path in update_display_order Function

  1. Changes
    - Recreate update_display_order function with explicit search_path setting
    - Fix security vulnerability by setting SECURITY DEFINER and explicit search_path
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS update_display_order;

-- Recreate the function with proper search_path and implementation
CREATE OR REPLACE FUNCTION update_display_order(
  table_name text,
  record_id uuid,
  new_order integer
)
RETURNS void AS $$
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name NOT IN ('projects', 'artists', 'services', 'service_features') THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;
  
  -- Update the display_order for the specified record
  EXECUTE format('UPDATE %I SET display_order = $1 WHERE id = $2', table_name)
  USING new_order, record_id;
  
  -- Verify the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record with id % not found in table %', record_id, table_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION update_display_order IS 'Updates the display_order column for a record in specified table. Recreated with proper search_path setting and security measures.';