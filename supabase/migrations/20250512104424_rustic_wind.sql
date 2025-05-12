/*
  # Update Studio Bookings

  1. Changes
    - Add 'composition' to studio_type enum
    - Add client_name column to studio_bookings table
*/

ALTER TYPE studio_type ADD VALUE IF NOT EXISTS 'composition';

ALTER TABLE studio_bookings 
ADD COLUMN IF NOT EXISTS client_name text NOT NULL DEFAULT '';

-- Update the default value for existing rows
UPDATE studio_bookings SET client_name = 'Client' WHERE client_name = '';