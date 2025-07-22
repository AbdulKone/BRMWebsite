/*
  # Optimize RLS Policies Performance

  1. Changes
    - Replace direct auth.uid() calls with subqueries for better performance
    - Update all policies on studio_bookings table
    - Update admin policies using is_admin() function
    - Fix "Allow admin full access to projects" policy for better performance
    - Fix role mutable search_path in functions
*/

-- Drop existing policies for studio_bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON studio_bookings;

-- Recreate policies with optimized queries
CREATE POLICY "Users can view their own bookings"
  ON studio_bookings
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create bookings"
  ON studio_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own bookings"
  ON studio_bookings
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can manage all bookings"
  ON studio_bookings
  FOR ALL
  TO authenticated
  USING ((SELECT is_admin()));

-- Drop existing admin policies for contact_messages
DROP POLICY IF EXISTS "Admins can view all messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON contact_messages;

-- Recreate contact_messages admin policy with optimized query
CREATE POLICY "Admins can manage all messages"
  ON contact_messages
  FOR ALL
  TO authenticated
  USING ((SELECT is_admin()));

-- Update admin policies for other tables
DROP POLICY IF EXISTS "Allow admin write access to projects" ON projects;
DROP POLICY IF EXISTS "Allow admin write access to artists" ON artists;
DROP POLICY IF EXISTS "Allow admin write access to services" ON services;
DROP POLICY IF EXISTS "Allow admin write access to service features" ON service_features;

-- Drop the specific policy mentioned in the performance issue
DROP POLICY IF EXISTS "Allow admin full access to projects" ON projects;

-- Create optimized version of "Allow admin full access to projects" policy
-- This replaces both previous admin policies for projects
CREATE POLICY "Allow admin full access to projects"
  ON projects FOR ALL TO authenticated
  USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Recreate the policies with optimized queries for other tables
CREATE POLICY "Allow admin write access to artists"
  ON artists FOR ALL TO authenticated
  USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Allow admin write access to services"
  ON services FOR ALL TO authenticated
  USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Allow admin write access to service features"
  ON service_features FOR ALL TO authenticated
  USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- Fix role mutable search_path in functions

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: update_display_order and is_admin_user functions were not found in the codebase
-- If they exist in the database but not in migrations, they should be recreated with proper search_path