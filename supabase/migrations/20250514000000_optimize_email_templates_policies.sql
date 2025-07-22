/*
  # Optimize Email Templates RLS Policies

  1. Changes
    - Fix overlapping permissive policies for email_templates table
    - Consolidate policies for better performance and clarity
*/

-- Drop existing overlapping policies
DROP POLICY IF EXISTS "Allow public read access to active email templates" ON email_templates;
DROP POLICY IF EXISTS "Allow admin full access to email templates" ON email_templates;

-- Create optimized policies
-- 1. Policy for public users (unauthenticated) - can only view active templates
CREATE POLICY "Allow public read access to active email templates"
  ON email_templates FOR SELECT
  TO public
  USING (is_active = true AND NOT (SELECT is_admin()));

-- 2. Policy for admin users - full access to all templates
CREATE POLICY "Allow admin full access to email templates"
  ON email_templates FOR ALL
  TO authenticated
  USING ((SELECT is_admin()));

-- 3. Policy for authenticated non-admin users - can only view active templates
CREATE POLICY "Allow authenticated users read access to active templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (is_active = true AND NOT (SELECT is_admin()));