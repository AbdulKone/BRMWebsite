/*
  # Fix admin role check

  1. Changes
    - Update RLS policies to check app_metadata.role instead of user_metadata
    - Add policy for admin access to projects table
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin full access to projects" ON projects;

-- Create new policy for admin access
CREATE POLICY "Allow admin full access to projects"
  ON projects FOR ALL TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');