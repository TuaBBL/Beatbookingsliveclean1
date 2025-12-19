/*
  # Add missing foreign key constraint to booking_requests

  1. Changes
    - Add foreign key constraint from booking_requests.planner_id to profiles.id
    - This enables proper joins between booking_requests and profiles tables
    - Fixes the artist inbox not loading planner information

  2. Important Notes
    - The constraint was missing from the original booking_requests table creation
    - This is required for the Supabase query builder to properly join tables
    - Cascading delete ensures data integrity when a planner is deleted
*/

-- Add foreign key constraint for planner_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'booking_requests_planner_id_fkey'
      AND table_name = 'booking_requests'
  ) THEN
    ALTER TABLE public.booking_requests
      ADD CONSTRAINT booking_requests_planner_id_fkey
      FOREIGN KEY (planner_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;
