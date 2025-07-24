/*
  # Add display_order columns to content tables

  1. Changes
    - Add display_order column to projects table
    - Add display_order column to artists table
    - Add display_order column to services table
    - Add display_order column to service_features table
    - Set default values based on creation order
*/

-- Add display_order column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Add display_order column to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Add display_order column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Add display_order column to service_features table
ALTER TABLE service_features 
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Set initial display_order values based on creation order
UPDATE projects 
SET display_order = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number 
  FROM projects
) AS subquery 
WHERE projects.id = subquery.id;

UPDATE artists 
SET display_order = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number 
  FROM artists
) AS subquery 
WHERE artists.id = subquery.id;

UPDATE services 
SET display_order = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number 
  FROM services
) AS subquery 
WHERE services.id = subquery.id;

UPDATE service_features 
SET display_order = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number 
  FROM service_features
) AS subquery 
WHERE service_features.id = subquery.id;

-- Make display_order NOT NULL after setting values
ALTER TABLE projects ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE artists ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE services ALTER COLUMN display_order SET NOT NULL;
ALTER TABLE service_features ALTER COLUMN display_order SET NOT NULL;