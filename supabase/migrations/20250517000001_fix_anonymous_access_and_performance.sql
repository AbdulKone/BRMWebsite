/*
  # Fix Anonymous Access and Performance Issues

  1. Security Changes
    - Update artists table RLS policy to restrict anonymous users
    - Add proper validation for authenticated users
    
  2. Performance Changes
    - Add indexes on display_order columns
    - Optimize RLS policies
*/

-- Fix RLS policy for artists table to restrict anonymous users
DROP POLICY IF EXISTS "Allow public read access to artists" ON artists;

-- Create new policy that allows public read but restricts anonymous authenticated users
CREATE POLICY "Allow public read access to artists (non-anonymous)"
  ON artists FOR SELECT
  TO public
  USING (
    -- Allow unauthenticated users (completely anonymous)
    auth.uid() IS NULL 
    OR 
    -- Allow authenticated users who are not anonymous
    (auth.uid() IS NOT NULL AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  );

-- Add performance indexes for display_order columns
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order);
CREATE INDEX IF NOT EXISTS idx_artists_display_order ON artists(display_order);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_service_features_display_order ON service_features(display_order);

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_display_order_created_at ON projects(display_order, created_at);
CREATE INDEX IF NOT EXISTS idx_artists_display_order_created_at ON artists(display_order, created_at);

-- Optimize contact_messages policy for better performance
DROP POLICY IF EXISTS "Admins can manage all messages" ON contact_messages;
CREATE POLICY "Admins can manage all messages"
  ON contact_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

COMMENT ON POLICY "Allow public read access to artists (non-anonymous)" ON artists IS 'Allows public read access but restricts anonymous authenticated users for security';