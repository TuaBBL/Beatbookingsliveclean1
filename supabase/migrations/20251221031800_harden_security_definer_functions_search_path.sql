/*
  # Harden SECURITY DEFINER functions with explicit search_path

  1. Changes
    - Add `SET search_path = public` to all SECURITY DEFINER functions
    - Prevents search_path manipulation attacks
    - No changes to function logic, permissions, or behavior

  2. Functions Modified
    - `accept_booking_request` - booking acceptance function
    - `decline_booking_request` - booking decline function
    - `create_booking_status_notification` - trigger function for booking status changes
    - `create_review_notification` - trigger function for new reviews

  3. Security
    - Resolves Supabase security warnings for role mutable search_path
    - All RLS policies remain unchanged
    - All GRANT permissions remain unchanged
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
SET search_path = public
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
SET search_path = public
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

-- Trigger function for booking status changes
CREATE OR REPLACE FUNCTION create_booking_status_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_user_id uuid;
  planner_name text;
  artist_stage_name text;
BEGIN
  SELECT p.name INTO planner_name
  FROM profiles p
  WHERE p.id = NEW.planner_id;

  SELECT ap.stage_name, ap.user_id INTO artist_stage_name, artist_user_id
  FROM artist_profiles ap
  WHERE ap.id = NEW.artist_id;

  IF OLD.status != NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, type, title, message, link, related_id)
      VALUES (
        NEW.planner_id,
        'booking_accepted',
        'Booking Request Accepted',
        artist_stage_name || ' has accepted your booking request for ' || NEW.event_name,
        '/planner/confirmed',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO notifications (user_id, type, title, message, link, related_id)
      VALUES (
        NEW.planner_id,
        'booking_declined',
        'Booking Request Declined',
        artist_stage_name || ' has declined your booking request for ' || NEW.event_name,
        '/planner/bookings',
        NEW.id
      );
    ELSIF NEW.status = 'cancelled' THEN
      IF artist_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, link, related_id)
        VALUES (
          artist_user_id,
          'booking_cancelled',
          'Booking Cancelled',
          planner_name || ' has cancelled the booking for ' || NEW.event_name,
          '/artist/bookings',
          NEW.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function for new reviews
CREATE OR REPLACE FUNCTION create_review_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_user_id uuid;
  planner_name text;
BEGIN
  SELECT ap.user_id INTO artist_user_id
  FROM artist_profiles ap
  WHERE ap.id = NEW.artist_id;

  SELECT p.name INTO planner_name
  FROM profiles p
  WHERE p.id = NEW.planner_id;

  IF artist_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, related_id)
    VALUES (
      artist_user_id,
      'new_review',
      'New Review Received',
      planner_name || ' left you a ' || NEW.rating || '-star review',
      '/artist/dashboard',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;
