/*
  # Add RLS Policies for Admin Access - Profiles Table
  
  1. Security Changes
    - Enable RLS on profiles table (CRITICAL - login depends on this)
    - Add self-read policy: users can read their own profile
    - Add admin-read policy: admins can read all profiles
  
  2. Important Notes
    - Self-access policy added FIRST
    - Admin override policy added SECOND
    - No UPDATE or DELETE policies added
    - Read-only visibility for admin dashboard
*/

-- Enable RLS on profiles table (CRITICAL)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Self-read policy: users can read their own profile (MANDATORY for login)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Profiles: users read own profile'
  ) THEN
    CREATE POLICY "Profiles: users read own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());
  END IF;
END $$;

-- Admin read-all policy: admins can read all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Profiles: admins read all profiles'
  ) THEN
    CREATE POLICY "Profiles: admins read all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_admin = true
      )
    );
  END IF;
END $$;
