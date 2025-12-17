/*
  # Add RLS Policies for Admin Access - Events Table
  
  1. Security Changes
    - Ensure RLS enabled on events table
    - Add self-read policy: event creators can read their own events
    - Add admin-read policy: admins can read all events
  
  2. Important Notes
    - Self-access policy added FIRST
    - Admin override policy added SECOND
    - No UPDATE or DELETE policies added
    - Read-only visibility for admin dashboard
*/

-- Ensure RLS is enabled on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Self-read policy: creator can read own events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Events: creator read'
  ) THEN
    CREATE POLICY "Events: creator read"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (creator_id = auth.uid());
  END IF;
END $$;

-- Admin read-all policy: admins can read all events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'events' 
    AND policyname = 'Events: admin read all'
  ) THEN
    CREATE POLICY "Events: admin read all"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_admin = true
      )
    );
  END IF;
END $$;
