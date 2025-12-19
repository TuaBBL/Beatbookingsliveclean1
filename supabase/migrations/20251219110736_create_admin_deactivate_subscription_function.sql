/*
  # Create Admin Deactivate Subscription Function

  1. New Function
    - `admin_deactivate_subscription()` - Allows admin to deactivate a subscription
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Checks that caller is an admin before proceeding
    - Only sets is_active = false and status = cancelled
    - Does NOT touch Stripe (emergency moderation only)
  
  3. Notes
    - This is for emergency moderation only
    - Does not cancel Stripe subscription
    - Simply hides the artist from discovery
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.admin_deactivate_subscription(uuid);

-- Function to deactivate a subscription (admin only)
CREATE FUNCTION public.admin_deactivate_subscription(subscription_id uuid)
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

  -- Deactivate the subscription (does not touch Stripe)
  UPDATE subscriptions 
  SET 
    is_active = false,
    status = 'cancelled'
  WHERE id = subscription_id;
  
  RETURN true;
END;
$$;
