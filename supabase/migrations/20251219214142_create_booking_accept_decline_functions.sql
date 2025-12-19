/*
  # Create functions for accepting and declining booking requests

  1. New Functions
    - `accept_booking_request(p_request_id, p_start_time, p_end_time, p_response_message)`
      - Accepts a booking request
      - Creates a booking record in the bookings table
      - Updates the booking_request status to 'accepted'
      - Links the booking_request to the booking
      - Optionally sends a response message to the planner
    
    - `decline_booking_request(p_request_id, p_response_message)`
      - Declines a booking request
      - Updates the booking_request status to 'declined'
      - Optionally sends a response message to the planner

  2. Security
    - Functions use SECURITY DEFINER to bypass RLS
    - Verify the requester is the artist who received the request
    - Validate that the request is in 'pending' status

  3. Important Notes
    - Functions create message records if response_message is provided
    - Messages are linked to the booking (for accepted) or standalone (for declined)
    - All operations are atomic within the function
*/

-- Function to accept a booking request
CREATE OR REPLACE FUNCTION accept_booking_request(
  p_request_id uuid,
  p_start_time time DEFAULT '18:00',
  p_end_time time DEFAULT '23:00',
  p_response_message text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id uuid;
  v_request_record record;
  v_artist_profile_id uuid;
BEGIN
  -- Get the booking request details
  SELECT * INTO v_request_record
  FROM booking_requests
  WHERE id = p_request_id
    AND artist_user_id = auth.uid()
    AND status = 'pending';

  IF v_request_record IS NULL THEN
    RAISE EXCEPTION 'Booking request not found or not pending';
  END IF;

  -- Get artist profile id
  SELECT id INTO v_artist_profile_id
  FROM artist_profiles
  WHERE user_id = auth.uid();

  IF v_artist_profile_id IS NULL THEN
    RAISE EXCEPTION 'Artist profile not found';
  END IF;

  -- Create the booking
  INSERT INTO bookings (
    planner_id,
    artist_id,
    status,
    event_date,
    start_time,
    end_time
  )
  VALUES (
    v_request_record.planner_id,
    v_artist_profile_id,
    'accepted',
    v_request_record.event_date,
    p_start_time,
    p_end_time
  )
  RETURNING id INTO v_booking_id;

  -- Update the booking request
  UPDATE booking_requests
  SET 
    status = 'accepted',
    responded_at = now(),
    booking_id = v_booking_id,
    start_time = p_start_time,
    end_time = p_end_time
  WHERE id = p_request_id;

  -- Send response message if provided
  IF p_response_message IS NOT NULL AND p_response_message != '' THEN
    INSERT INTO messages (
      sender_id,
      recipient_id,
      booking_id,
      content
    )
    VALUES (
      auth.uid(),
      v_request_record.planner_id,
      v_booking_id,
      p_response_message
    );
  END IF;

  RETURN v_booking_id;
END;
$$;

-- Function to decline a booking request
CREATE OR REPLACE FUNCTION decline_booking_request(
  p_request_id uuid,
  p_response_message text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_record record;
BEGIN
  -- Get the booking request details
  SELECT * INTO v_request_record
  FROM booking_requests
  WHERE id = p_request_id
    AND artist_user_id = auth.uid()
    AND status = 'pending';

  IF v_request_record IS NULL THEN
    RAISE EXCEPTION 'Booking request not found or not pending';
  END IF;

  -- Update the booking request
  UPDATE booking_requests
  SET 
    status = 'declined',
    responded_at = now()
  WHERE id = p_request_id;

  -- Send response message if provided
  IF p_response_message IS NOT NULL AND p_response_message != '' THEN
    INSERT INTO messages (
      sender_id,
      recipient_id,
      content
    )
    VALUES (
      auth.uid(),
      v_request_record.planner_id,
      p_response_message
    );
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION accept_booking_request(uuid, time, time, text) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_booking_request(uuid, text) TO authenticated;
