/*
  # Harden Booking Requests (Subscription-Aware)

  1. Changes
    - **Replace INSERT policy** on `booking_requests` to enforce subscription check
    - New policy: Planners can only create booking requests for artists with active subscriptions
    - **Add SQL function** `create_booking_request()` for safe, centralized booking request creation
    
  2. New Policy
    - `booking_requests` INSERT policy now checks:
      - Requester is authenticated
      - Requester owns the planner_id (must be their own user ID)
      - Target artist has an active subscription (subscriptions.is_active = true)
    
  3. New Function
    - `create_booking_request()` - Security definer function that:
      - Validates artist has active subscription
      - Inserts booking request with proper planner_id
      - Raises clear exception if subscription inactive
      - Returns the created booking request ID
      
  4. Security
    - Subscription check enforced at database level (cannot be bypassed)
    - Function uses security definer to ensure proper access control
    - Clear error messages for failed validations
    
  5. Important Notes
    - Frontend checks remain for UX, but database is source of truth
    - Direct inserts via client still protected by RLS
    - Function approach is recommended for cleaner error handling
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Booking requests: planner create" ON public.booking_requests;

-- Create new INSERT policy with subscription check
CREATE POLICY "Booking requests: planner create active artists only"
  ON public.booking_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Requester must own the planner_id
    planner_id = auth.uid()
    AND
    -- Target artist must have an active subscription
    EXISTS (
      SELECT 1
      FROM artist_profiles ap
      JOIN subscriptions s ON s.artist_id = ap.id
      WHERE ap.user_id = booking_requests.artist_user_id
        AND s.is_active = true
    )
  );

-- Create safe booking request function
CREATE OR REPLACE FUNCTION create_booking_request(
  p_artist_user_id uuid,
  p_event_name text,
  p_event_date date,
  p_event_location text,
  p_message text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id uuid;
  v_planner_role text;
BEGIN
  -- Verify requester is a planner
  SELECT role INTO v_planner_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF v_planner_role IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF v_planner_role != 'planner' THEN
    RAISE EXCEPTION 'Only planners can send booking requests';
  END IF;

  -- Check if artist has active subscription
  IF NOT EXISTS (
    SELECT 1
    FROM artist_profiles ap
    JOIN subscriptions s ON s.artist_id = ap.id
    WHERE ap.user_id = p_artist_user_id
      AND s.is_active = true
  ) THEN
    RAISE EXCEPTION 'This artist is not currently accepting bookings';
  END IF;

  -- Insert booking request
  INSERT INTO booking_requests (
    planner_id,
    artist_user_id,
    event_name,
    event_date,
    event_location,
    message,
    status
  )
  VALUES (
    auth.uid(),
    p_artist_user_id,
    p_event_name,
    p_event_date,
    p_event_location,
    p_message,
    'pending'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_booking_request(uuid, text, date, text, text) TO authenticated;