/*
  # Enhance Booking Requests with Time Fields and Actions

  1. Schema Changes
    - Add `start_time` and `end_time` to `booking_requests` table
    - Add `responded_at` timestamp for tracking when artist responds
    - Add `booking_id` to link to created booking when accepted
    
  2. New Functions
    - `accept_booking_request()` - Artist accepts request and creates confirmed booking
    - `decline_booking_request()` - Artist declines request
    
  3. Security Changes
    - Add RLS policy for artists to UPDATE their booking requests (accept/decline)
    - Ensure subscription checks remain in place
    
  4. Important Notes
    - When accepted, creates entry in `bookings` table
    - Messages can be sent for accepted/declined requests
    - Artist can only accept if they have active subscription
    - Booking created with 'accepted' status immediately
*/

-- Add time fields to booking_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_requests' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE public.booking_requests 
      ADD COLUMN start_time time,
      ADD COLUMN end_time time,
      ADD COLUMN responded_at timestamptz,
      ADD COLUMN booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index on booking_id
CREATE INDEX IF NOT EXISTS booking_requests_booking_id_idx 
  ON public.booking_requests(booking_id);

-- Drop old UPDATE policy if exists
DROP POLICY IF EXISTS "Booking requests: artist update" 
  ON public.booking_requests;

DROP POLICY IF EXISTS "Booking requests: artist respond"
  ON public.booking_requests;

-- Create UPDATE policy for artists to respond to booking requests
CREATE POLICY "Booking requests: artist respond"
  ON public.booking_requests
  FOR UPDATE
  TO authenticated
  USING (
    artist_user_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    artist_user_id = auth.uid()
    AND status IN ('accepted', 'declined')
  );

-- Drop existing functions
DROP FUNCTION IF EXISTS accept_booking_request(uuid);
DROP FUNCTION IF EXISTS decline_booking_request(uuid);

-- Function to accept booking request
CREATE OR REPLACE FUNCTION accept_booking_request(
  p_request_id uuid,
  p_start_time time DEFAULT '18:00'::time,
  p_end_time time DEFAULT '23:00'::time
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request booking_requests%ROWTYPE;
  v_booking_id uuid;
BEGIN
  -- Get the booking request
  SELECT * INTO v_request
  FROM booking_requests
  WHERE id = p_request_id
    AND artist_user_id = auth.uid()
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found or already responded to';
  END IF;

  -- Verify artist has active subscription
  IF NOT EXISTS (
    SELECT 1
    FROM subscriptions s
    WHERE s.artist_id = v_request.artist_id
      AND s.is_active = true
  ) THEN
    RAISE EXCEPTION 'Cannot accept bookings without an active subscription';
  END IF;

  -- Create booking in bookings table
  INSERT INTO bookings (
    planner_id,
    artist_id,
    status,
    event_date,
    start_time,
    end_time
  )
  VALUES (
    v_request.planner_id,
    v_request.artist_id,
    'accepted',
    v_request.event_date,
    COALESCE(v_request.start_time, p_start_time),
    COALESCE(v_request.end_time, p_end_time)
  )
  RETURNING id INTO v_booking_id;

  -- Update booking request
  UPDATE booking_requests
  SET 
    status = 'accepted',
    responded_at = now(),
    booking_id = v_booking_id
  WHERE id = p_request_id;

  RETURN v_booking_id;
END;
$$;

-- Function to decline booking request
CREATE OR REPLACE FUNCTION decline_booking_request(
  p_request_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update booking request
  UPDATE booking_requests
  SET 
    status = 'declined',
    responded_at = now()
  WHERE id = p_request_id
    AND artist_user_id = auth.uid()
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found or already responded to';
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION accept_booking_request(uuid, time, time) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_booking_request(uuid) TO authenticated;
