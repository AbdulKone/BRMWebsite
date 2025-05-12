/*
  # Correction des politiques de stockage

  1. Changements
    - Suppression et recréation des politiques de stockage
    - Ajout de politiques pour la lecture publique
    - Ajout de politiques pour l'écriture admin
*/

-- Suppression des politiques existantes
DROP POLICY IF EXISTS "Allow public read access to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin write access to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete access to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update access to media" ON storage.objects;

-- Création des nouvelles politiques
CREATE POLICY "Allow public read access to media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Allow admin write access to media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
);

CREATE POLICY "Allow admin delete access to media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
);

CREATE POLICY "Allow admin update access to media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
)
WITH CHECK (
  bucket_id = 'media'
  AND (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
);

-- S'assurer que le bucket est public
UPDATE storage.buckets
SET public = true
WHERE id = 'media';