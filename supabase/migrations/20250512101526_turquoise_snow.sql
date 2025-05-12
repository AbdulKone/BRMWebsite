/*
  # Fix Projects RLS Policies

  1. Changes
    - Drop existing RLS policies for projects table
    - Create new RLS policies with proper admin access checks
    - Add storage policies for media bucket

  2. Security
    - Ensure admin users can perform all operations on projects
    - Enable proper storage access for admin users
*/

-- Drop existing policies for projects table
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
DROP POLICY IF EXISTS "Allow admin write access to projects" ON projects;

-- Create new policies for projects table
CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow admin full access to projects"
  ON projects FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Enable storage access
INSERT INTO storage.buckets (id, name)
VALUES ('media', 'media')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'media');

CREATE POLICY "Allow admin write access to media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND auth.jwt() ->> 'role' = 'admin'
  );