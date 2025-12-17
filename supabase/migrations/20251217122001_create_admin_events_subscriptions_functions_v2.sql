/*
  # Create Admin Events and Subscriptions Functions

  1. New Functions
    - `get_all_events()` - Returns all events with creator info (admin only)
    - `get_all_subscriptions()` - Returns all subscriptions with artist info (admin only)
    - `get_platform_stats()` - Returns platform overview statistics (admin only)
    - `admin_delete_subscription()` - Allows admin to delete a subscription (admin only)

  2. Security
    - All functions use SECURITY DEFINER to bypass RLS
    - Each function checks that caller is an admin before proceeding
    - If not admin, returns empty result or error

  3. Data Returned
    Events:
    - Event details with creator name, date, venue, location, times
    
    Subscriptions:
    - Subscription details with user name, stage name, dates, status
    
    Platform Stats:
    - Total events count
    - Active subscriptions count
    - Additional user statistics

  4. Notes
    - Functions validate admin status before returning sensitive data
    - Safe because admin check happens within the function
    - Drops existing functions first to allow schema changes
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_all_events();
DROP FUNCTION IF EXISTS public.get_all_subscriptions();
DROP FUNCTION IF EXISTS public.get_platform_stats();
DROP FUNCTION IF EXISTS public.admin_delete_subscription(uuid);

-- Function to get all events (admin only)
CREATE FUNCTION public.get_all_events()
RETURNS TABLE (
  id uuid,
  title text,
  creator_id uuid,
  creator_name text,
  creator_role text,
  event_date date,
  event_end_date date,
  start_time time,
  end_time time,
  venue text,
  city text,
  state text,
  country text,
  status text,
  created_at timestamptz
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

  -- Return all events with creator information
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.creator_id,
    p.name as creator_name,
    e.creator_role,
    e.event_date,
    e.event_end_date,
    e.start_time,
    e.end_time,
    e.venue,
    e.city,
    e.state,
    e.country,
    e.status::text,
    e.created_at
  FROM events e
  LEFT JOIN profiles p ON e.creator_id = p.id
  ORDER BY e.created_at DESC;
END;
$$;

-- Function to get all subscriptions (admin only)
CREATE FUNCTION public.get_all_subscriptions()
RETURNS TABLE (
  id uuid,
  artist_id uuid,
  user_name text,
  stage_name text,
  plan text,
  status text,
  started_at timestamptz,
  ends_at timestamptz,
  is_active boolean,
  stripe_subscription_id text
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

  -- Return all subscriptions with artist information
  RETURN QUERY
  SELECT 
    s.id,
    s.artist_id,
    p.name as user_name,
    ap.stage_name,
    s.plan,
    s.status,
    s.started_at,
    s.ends_at,
    s.is_active,
    s.stripe_subscription_id
  FROM subscriptions s
  LEFT JOIN artist_profiles ap ON s.artist_id = ap.id
  LEFT JOIN profiles p ON ap.user_id = p.id
  ORDER BY s.started_at DESC;
END;
$$;

-- Function to get platform statistics (admin only)
CREATE FUNCTION public.get_platform_stats()
RETURNS TABLE (
  total_users bigint,
  total_planners bigint,
  total_artists bigint,
  total_admins bigint,
  users_last_7_days bigint,
  users_last_30_days bigint,
  total_events bigint,
  published_events bigint,
  active_subscriptions bigint
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

  -- Return platform statistics
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(*) FILTER (WHERE role = 'planner')::bigint as total_planners,
    COUNT(*) FILTER (WHERE role = 'artist')::bigint as total_artists,
    COUNT(*) FILTER (WHERE is_admin = true)::bigint as total_admins,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::bigint as users_last_7_days,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::bigint as users_last_30_days,
    (SELECT COUNT(*)::bigint FROM events) as total_events,
    (SELECT COUNT(*)::bigint FROM events WHERE status = 'published') as published_events,
    (SELECT COUNT(*)::bigint FROM subscriptions WHERE is_active = true) as active_subscriptions
  FROM profiles;
END;
$$;

-- Function to delete a subscription (admin only)
CREATE FUNCTION public.admin_delete_subscription(subscription_id uuid)
RETURNS boolean
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
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete the subscription
  DELETE FROM subscriptions WHERE id = subscription_id;
  
  RETURN true;
END;
$$;