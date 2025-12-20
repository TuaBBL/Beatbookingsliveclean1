/*
  # Add Cancel and Delete Functions for Booking Requests
  
  1. New Functions
    - `cancel_booking_request_planner()` - Planners can cancel their pending requests
    - `cancel_confirmed_booking()` - Artists or planners can cancel confirmed bookings
    - `delete_booking_request()` - Planners can delete declined/cancelled requests
    
  2. RLS Policy Updates
    - Allow planners to UPDATE their own pending booking_requests to 'cancelled'
    - Allow planners to DELETE their own booking_requests
    - Allow artists and planners to UPDATE bookings status to 'cancelled'
    
  3. Security
    - Planners can only cancel their own pending requests
    - Artists and planners can cancel confirmed bookings
    - Deletion only allowed for non-accepted requests
*/

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Planners can cancel own pending requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Planners can delete own requests" ON public.booking_requests;

-- Allow planners to update their own pending requests to cancelled
CREATE POLICY "Planners can cancel own pending requests"
  ON public.booking_requests
  FOR UPDATE
  TO authenticated
  USING (
    planner_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    planner_id = auth.uid()
    AND status = 'cancelled'
  );

-- Allow planners to delete their own non-accepted requests
CREATE POLICY "Planners can delete own requests"
  ON public.booking_requests
  FOR DELETE
  TO authenticated
  USING (
    planner_id = auth.uid()
    AND status IN ('pending', 'declined', 'cancelled')
  );

-- Function for planners to cancel their pending booking requests
CREATE OR REPLACE FUNCTION cancel_booking_request_planner(
  p_request_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE booking_requests
  SET status = 'cancelled'
  WHERE id = p_request_id
    AND planner_id = auth.uid()
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found or cannot be cancelled';
  END IF;
END;
$$;

-- Function to delete booking request
CREATE OR REPLACE FUNCTION delete_booking_request(
  p_request_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM booking_requests
  WHERE id = p_request_id
    AND planner_id = auth.uid()
    AND status IN ('pending', 'declined', 'cancelled');
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking request not found or cannot be deleted';
  END IF;
END;
$$;

-- Function to cancel a confirmed booking (for both artists and planners)
CREATE OR REPLACE FUNCTION cancel_confirmed_booking(
  p_booking_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Check if user is either the planner or the artist
  IF v_booking.planner_id != auth.uid() THEN
    -- Check if user is the artist
    IF NOT EXISTS (
      SELECT 1
      FROM artist_profiles ap
      WHERE ap.id = v_booking.artist_id
        AND ap.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'You do not have permission to cancel this booking';
    END IF;
  END IF;
  
  -- Update booking status to cancelled
  UPDATE bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;
  
  -- If there's a linked booking_request, update it too
  UPDATE booking_requests
  SET status = 'cancelled'
  WHERE booking_id = p_booking_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cancel_booking_request_planner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_booking_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_confirmed_booking(uuid) TO authenticated;
