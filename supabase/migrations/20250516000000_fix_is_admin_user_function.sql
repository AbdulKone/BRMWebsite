/*
  # Fix Role Mutable Search Path in is_admin_user Function

  1. Changes
    - Recreate is_admin_user function with explicit search_path setting
    - Fix security vulnerability by setting SECURITY DEFINER and explicit search_path
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS is_admin_user;

-- Recreate the function with proper search_path
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION is_admin_user IS 'Checks if a specific user has admin role. Similar to is_admin() but takes a user_id parameter.';