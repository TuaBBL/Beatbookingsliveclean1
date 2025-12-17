/*
  # Add RLS Policies for Admin Access - Artist Profiles Table
  
  1. Security Changes
    - Ensure RLS enabled on artist_profiles table
    - Add self-read policy: artists can read their own profile
    - Add admin-read policy: admins can read all artist profiles
  
  2. Important Notes
    - Self-access policy added FIRST
    - Admin override policy added SECOND
    - No UPDATE or DELETE policies added
    - Read-only visibility for admin dashboard
*/

-- Ensure RLS is enabled on artist_profiles table
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

-- Self-read policy: artist owns their profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'artist_profiles' 
    AND policyname = 'Artist profiles: owner read'
  ) THEN
    CREATE POLICY "Artist profiles: owner read"
    ON public.artist_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Admin read-all policy: admins can read all artist profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'artist_profiles' 
    AND policyname = 'Artist profiles: admin read all'
  ) THEN
    CREATE POLICY "Artist profiles: admin read all"
    ON public.artist_profiles
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
