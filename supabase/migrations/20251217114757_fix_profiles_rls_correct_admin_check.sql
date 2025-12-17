/*
  # Fix Profiles RLS - Correct Admin Check
  
  1. Changes
    - Fix admin policy to check if the CURRENT USER is admin
    - Not if the profile being read is admin
  
  2. Security
    - Users can read their own profile
    - Admins (where their own profile has is_admin=true) can read all profiles
*/

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;

-- Policy 1: Any authenticated user can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 2: Users who are admins can read all profiles
-- Check if there exists a profile for auth.uid() where is_admin = true
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
);
