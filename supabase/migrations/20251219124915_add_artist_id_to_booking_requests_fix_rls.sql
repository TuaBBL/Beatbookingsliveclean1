/*
  # Add artist_id to booking_requests and fix RLS to use subscriptions only

  1. Schema Changes
    - Add `artist_id` column to `booking_requests` table
      - References `artist_profiles.id` (the artist profile ID, not user ID)
      - Foreign key constraint to ensure data integrity
      - Populated from existing artist_user_id via artist_profiles lookup
    
  2. Security Changes
    - Drop existing "Booking requests: planner create active artists only" policy
    - Create new simplified policy that uses ONLY subscriptions table
    - Policy checks: planner_id = auth.uid() AND artist has active subscription
    - No reference to profiles table or roles
    - Subscriptions table is single source of truth
  
  3. Important Notes
    - Maintains artist_user_id for backwards compatibility
    - New artist_id column enables direct subscription lookup
    - Founding Artists (free_forever with is_active=true) are bookable
    - Cancelled subscriptions (is_active=false) block new bookings
    - Database-level enforcement, no frontend checks required
*/

-- Add artist_id column (nullable initially)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'booking_requests' AND column_name = 'artist_id'
  ) THEN
    ALTER TABLE public.booking_requests ADD COLUMN artist_id uuid;
  END IF;
END $$;

-- Populate artist_id from artist_profiles based on artist_user_id
UPDATE public.booking_requests br
SET artist_id = ap.id
FROM public.artist_profiles ap
WHERE ap.user_id = br.artist_user_id
  AND br.artist_id IS NULL;

-- Make artist_id NOT NULL now that it's populated
ALTER TABLE public.booking_requests 
  ALTER COLUMN artist_id SET NOT NULL;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'booking_requests_artist_id_fkey'
      AND table_name = 'booking_requests'
  ) THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT booking_requests_artist_id_fkey
      FOREIGN KEY (artist_id)
      REFERENCES public.artist_profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Drop old policy that referenced profiles
DROP POLICY IF EXISTS "Booking requests: planner create active artists only" 
  ON public.booking_requests;

DROP POLICY IF EXISTS "Booking requests: planner create"
  ON public.booking_requests;

-- Create new policy using ONLY subscriptions table
CREATE POLICY "Booking requests: planner create active artists only"
  ON public.booking_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    planner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.subscriptions s
      WHERE s.artist_id = booking_requests.artist_id
        AND s.is_active = true
    )
  );
