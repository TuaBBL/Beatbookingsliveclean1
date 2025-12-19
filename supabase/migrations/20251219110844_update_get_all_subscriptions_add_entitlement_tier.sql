/*
  # Update get_all_subscriptions to return entitlement_tier

  1. Changes
    - Add entitlement_tier to the return table
    - Include entitlement_tier in the SELECT query
  
  2. Notes
    - entitlement_tier is used for feature gating
    - Replaces existing function with updated signature
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_all_subscriptions();

-- Recreate function with entitlement_tier
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
  stripe_subscription_id text,
  entitlement_tier text
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
    s.stripe_subscription_id,
    s.entitlement_tier::text as entitlement_tier
  FROM subscriptions s
  LEFT JOIN artist_profiles ap ON s.artist_id = ap.id
  LEFT JOIN profiles p ON ap.user_id = p.id
  ORDER BY s.started_at DESC;
END;
$$;
