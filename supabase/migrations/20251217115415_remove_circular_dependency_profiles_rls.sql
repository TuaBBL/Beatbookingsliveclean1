/*
  # Remove Circular Dependency from Profiles RLS
  
  1. Changes
    - Drop all existing SELECT policies on profiles
    - Create single simple policy: users can read their own profile
    - Remove admin policy that causes circular dependency
  
  2. Security
    - Users can only read their own profile (no circular dependency)
    - For admin access, we'll use service role key or separate approach
  
  3. Notes
    - This fixes login blocking by removing the subquery that creates circular dependency
    - Admin functionality will work through service role or separate mechanism
*/

-- Drop ALL existing SELECT policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "User can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON public.profiles;

-- Create single simple policy with no subqueries or circular dependencies
CREATE POLICY "Enable read access for users to own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
