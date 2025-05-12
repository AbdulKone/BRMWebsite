/*
  # Ajout des tables de contenu

  1. Nouvelles Tables
    - `projects`
      - `id` (uuid, primary key)
      - `title` (text)
      - `artist` (text)
      - `year` (integer)
      - `description` (text)
      - `type` (enum)
      - `image_url` (text)
      - `video_url` (text, optional)
      - `created_at` (timestamp)
    
    - `artists`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `image_url` (text)
      - `latest_work` (text)
      - `release_date` (date)
      - `created_at` (timestamp)
    
    - `services`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `icon` (text)
      - `created_at` (timestamp)
    
    - `service_features`
      - `id` (uuid, primary key)
      - `service_id` (uuid, references services)
      - `feature` (text)
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS on all tables
    - Add policies for authenticated users and admins
*/

-- Create project type enum
CREATE TYPE project_type AS ENUM ('music', 'video');

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text NOT NULL,
  year integer NOT NULL,
  description text NOT NULL,
  type project_type NOT NULL,
  image_url text NOT NULL,
  video_url text,
  created_at timestamptz DEFAULT now()
);

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  latest_work text NOT NULL,
  release_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create service features table
CREATE TABLE IF NOT EXISTS service_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  feature text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_features ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Allow public read access to projects"
  ON projects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to artists"
  ON artists
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to services"
  ON services
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to service features"
  ON service_features
  FOR SELECT
  TO public
  USING (true);

-- Admin write access policies
CREATE POLICY "Allow admin write access to projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow admin write access to artists"
  ON artists
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow admin write access to services"
  ON services
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Allow admin write access to service features"
  ON service_features
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());