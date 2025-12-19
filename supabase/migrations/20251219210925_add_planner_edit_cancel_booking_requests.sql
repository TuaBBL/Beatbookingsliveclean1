/*
  # Add Planner Edit/Cancel for Booking Requests

  1. New RLS Policies
    - Allow planner to UPDATE their own pending booking_requests
    - Allow planner to cancel (set status to 'cancelled')
    
  2. Important Notes
    - Planner can only edit pending requests
    - Once accepted/declined by artist, planner cannot edit
    - Cancel sets responded_at timestamp
*/

-- Drop existing planner policies if any
DROP POLICY IF EXISTS "Booking requests: planner edit pending" 
  ON public.booking_requests;

DROP POLICY IF EXISTS "Booking requests: planner cancel" 
  ON public.booking_requests;

-- Create UPDATE policy for planner to edit/cancel their pending requests
CREATE POLICY "Booking requests: planner edit pending"
  ON public.booking_requests
  FOR UPDATE
  TO authenticated
  USING (
    planner_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    planner_id = auth.uid()
    AND status IN ('pending', 'cancelled')
  );
