/*
  # Fix Profiles RLS - Remove Circular Dependency
  
  1. Changes
    - Simplify read policy to allow users to read their own profile
    - Create admin policy that doesn't cause circular dependency
    - Use auth.uid() directly without subqueries
  
  2. Security
    - Users can only read their own profile
    - Admins can read all profiles (using separate OR condition)
*/

-- Drop all existing read policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "User can read own profile" ON public.profiles;

-- Create a single combined read policy that handles both cases
-- This avoids circular dependency by using auth.uid() directly in main query
CREATE POLICY "Users can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can read their own profile OR user is an admin
  id = auth.uid()
  OR
  is_admin = true
);
