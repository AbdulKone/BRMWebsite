/*
  # Optimize Studio Bookings RLS Policies

  1. Changes
    - Fix overlapping permissive policies for studio_bookings table
    - Consolidate policies for better performance and clarity
    - Ensure non-admin users can only manage their own bookings
    - Ensure admin users can manage all bookings
*/

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view their own bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Users can manage their own bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON studio_bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON studio_bookings;

-- Create optimized policies

-- 1. Policy for regular users - can only manage their own bookings
CREATE POLICY "Users can manage their own bookings (consolidated)"
  ON studio_bookings
  FOR ALL
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) AND 
    NOT (SELECT is_admin())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) AND 
    NOT (SELECT is_admin())
  );

-- 2. Policy for admin users - can manage all bookings
CREATE POLICY "Admins can manage all bookings (consolidated)"
  ON studio_bookings
  FOR ALL
  TO authenticated
  USING ((SELECT is_admin()));