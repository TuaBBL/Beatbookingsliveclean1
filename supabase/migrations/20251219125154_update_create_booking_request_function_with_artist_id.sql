/*
  # Update create_booking_request function to populate artist_id

  1. Changes
    - Update `create_booking_request()` function to fetch and insert artist_id
    - Uses artist_profiles lookup to get artist_id from user_id
    - Ensures consistency with new booking_requests schema
  
  2. Important Notes
    - Function maintains same signature for backwards compatibility
    - Still validates subscription status
    - Now populates both artist_user_id and artist_id columns
*/

-- Update the create_booking_request function
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
  v_artist_id uuid;
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

  -- Get artist_id and check if artist has active subscription
  SELECT ap.id INTO v_artist_id
  FROM artist_profiles ap
  JOIN subscriptions s ON s.artist_id = ap.id
  WHERE ap.user_id = p_artist_user_id
    AND s.is_active = true;

  IF v_artist_id IS NULL THEN
    RAISE EXCEPTION 'This artist is not currently accepting bookings';
  END IF;

  -- Insert booking request with both artist_user_id and artist_id
  INSERT INTO booking_requests (
    planner_id,
    artist_id,
    artist_user_id,
    event_name,
    event_date,
    event_location,
    message,
    status
  )
  VALUES (
    auth.uid(),
    v_artist_id,
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

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION create_booking_request(uuid, text, date, text, text) TO authenticated;
