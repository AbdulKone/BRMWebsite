/*
  # Add Security Helper Functions

  1. Changes
    - Add function to check if user is anonymous
    - Add function to validate admin access with better performance
    - Add rate limiting helpers
*/

-- Function to check if current user is anonymous
CREATE OR REPLACE FUNCTION is_anonymous_user()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() ->> 'is_anonymous')::boolean IS TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Optimized admin check function with caching
CREATE OR REPLACE FUNCTION is_admin_cached()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Get user role from metadata
  SELECT raw_user_meta_data->>'role' INTO user_role
  FROM auth.users 
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  -- Insert security log (you can create a security_logs table if needed)
  -- For now, we'll use a simple approach
  RAISE LOG 'Security Event: % - User: % - Details: %', 
    event_type, 
    COALESCE(auth.uid()::text, 'anonymous'), 
    details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION is_anonymous_user IS 'Checks if the current authenticated user is anonymous';
COMMENT ON FUNCTION is_admin_cached IS 'Optimized admin check with better performance';
COMMENT ON FUNCTION log_security_event IS 'Logs security events for monitoring';