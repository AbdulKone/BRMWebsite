/*
  # Initial Database Schema

  1. Types
    - Project types (music/video)
    - Studio booking types (recording/mixing/mastering)
    - Booking status (pending/confirmed/cancelled)
    - Message status (new/read/replied)

  2. Tables
    - Projects
    - Artists
    - Services
    - Service Features
    - Studio Bookings
    - Contact Messages

  3. Security
    - RLS enabled on all tables
    - Public read access for content
    - Admin write access
    - User-specific access for bookings
*/

-- Create ENUMs
CREATE TYPE project_type AS ENUM ('music', 'video');
CREATE TYPE studio_type AS ENUM ('recording', 'mixing', 'mastering');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE message_status AS ENUM ('new', 'read', 'replied');

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

-- Create studio bookings table
CREATE TABLE IF NOT EXISTS studio_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  studio_type studio_type NOT NULL,
  notes text,
  status booking_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status message_status NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create admin role function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public read access policies
CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public read access to artists"
  ON artists FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public read access to services"
  ON services FOR SELECT TO public
  USING (true);

CREATE POLICY "Allow public read access to service features"
  ON service_features FOR SELECT TO public
  USING (true);

-- Admin write access policies
CREATE POLICY "Allow admin write access to projects"
  ON projects FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Allow admin write access to artists"
  ON artists FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Allow admin write access to services"
  ON services FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Allow admin write access to service features"
  ON service_features FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Booking policies
CREATE POLICY "Users can view their own bookings"
  ON studio_bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON studio_bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON studio_bookings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings"
  ON studio_bookings FOR ALL TO authenticated
  USING (is_admin());

-- Contact message policies
CREATE POLICY "Anyone can create contact messages"
  ON contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all messages"
  ON contact_messages FOR ALL TO authenticated
  USING (is_admin());