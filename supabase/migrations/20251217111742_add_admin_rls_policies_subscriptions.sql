/*
  # Add RLS Policies for Admin Access - Subscriptions Table
  
  1. Security Changes
    - Ensure RLS enabled on subscriptions table
    - Add self-read policy: artists can read their own subscription via artist_profiles join
    - Add admin-read policy: admins can read all subscriptions
  
  2. Important Notes
    - Self-access policy added FIRST
    - Admin override policy added SECOND
    - No UPDATE or DELETE policies added
    - Read-only visibility for admin dashboard
*/

-- Ensure RLS is enabled on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Self-read policy: artist can read own subscription
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'Subscriptions: owner read'
  ) THEN
    CREATE POLICY "Subscriptions: owner read"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.artist_profiles ap
        WHERE ap.id = subscriptions.artist_id
          AND ap.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Admin read-all policy: admins can read all subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND policyname = 'Subscriptions: admin read all'
  ) THEN
    CREATE POLICY "Subscriptions: admin read all"
    ON public.subscriptions
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
