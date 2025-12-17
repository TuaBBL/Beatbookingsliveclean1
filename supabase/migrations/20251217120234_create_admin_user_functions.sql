/*
  # Create Admin User Management Functions
  
  1. New Functions
    - `get_all_users()` - Returns all user profiles with role counts (admin only)
    - `get_user_stats()` - Returns summary statistics about users (admin only)
  
  2. Security
    - Functions use SECURITY DEFINER to bypass RLS
    - Both functions check that caller is an admin before returning data
    - If not admin, returns empty result
  
  3. Data Returned
    - All user profiles with id, name, email, role, created_at, last_active_at
    - User counts broken down by role (planner vs artist)
    - Total user count
  
  4. Notes
    - This approach avoids circular RLS dependencies
    - Admin check happens within the function, not in RLS policies
    - Safe because functions validate admin status before returning sensitive data
*/

-- Function to get all users (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  role text,
  country text,
  state text,
  city text,
  created_at timestamptz,
  last_active_at timestamptz,
  is_admin boolean,
  admin_requested boolean
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  ) THEN
    -- Not an admin, return empty result
    RETURN;
  END IF;

  -- Return all users
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.role,
    p.country,
    p.state,
    p.city,
    p.created_at,
    p.last_active_at,
    p.is_admin,
    p.admin_requested
  FROM profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get user statistics (admin only)
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  total_users bigint,
  total_planners bigint,
  total_artists bigint,
  total_admins bigint,
  users_last_7_days bigint,
  users_last_30_days bigint
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  ) THEN
    -- Not an admin, return zeros
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint;
    RETURN;
  END IF;

  -- Return statistics
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(*) FILTER (WHERE role = 'planner')::bigint as total_planners,
    COUNT(*) FILTER (WHERE role = 'artist')::bigint as total_artists,
    COUNT(*) FILTER (WHERE is_admin = true)::bigint as total_admins,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::bigint as users_last_7_days,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::bigint as users_last_30_days
  FROM profiles;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO authenticated;
