/*
  # Cleanup Booking Requests RLS Policies

  1. Remove duplicate/conflicting policies
  2. Keep only essential policies
  
  3. Final Policy Set
    - SELECT: planner read own, artist read own, admin read all
    - INSERT: planner create (with active artist check)
    - UPDATE: artist respond (accept/decline), planner edit pending
    - DELETE: planner delete own
    
  4. Important Notes
    - Removed "artist update status" duplicate
    - Removed "planner update own" duplicate
    - Kept specific policies for clarity
*/

-- Drop duplicate policies
DROP POLICY IF EXISTS "Booking requests: artist update status" 
  ON public.booking_requests;

DROP POLICY IF EXISTS "Booking requests: planner update own" 
  ON public.booking_requests;

-- Ensure we have the core policies (they should exist from earlier migrations)
-- These are just to verify they exist, will skip if they do

DO $$
BEGIN
  -- Verify planner edit pending exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_requests' 
      AND policyname = 'Booking requests: planner edit pending'
  ) THEN
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
  END IF;

  -- Verify artist respond exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'booking_requests' 
      AND policyname = 'Booking requests: artist respond'
  ) THEN
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
  END IF;
END $$;
