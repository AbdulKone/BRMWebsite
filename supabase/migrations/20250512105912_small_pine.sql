/*
  # Fix Storage Policies

  1. Changes
    - Drop existing storage policies
    - Create new policies with proper admin role checks
    - Ensure admin users can upload files to media bucket
*/

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow public read access to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin write access to media" ON storage.objects;

-- Create new storage policies
CREATE POLICY "Allow public read access to media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

CREATE POLICY "Allow admin write access to media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Allow admin delete access to media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Allow admin update access to media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  )
  WITH CHECK (
    bucket_id = 'media'
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );