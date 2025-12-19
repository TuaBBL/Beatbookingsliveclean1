/*
  # Add subscription enforcement via RLS

  1. New Policies
    - Public can only read artist_profiles with active subscriptions
    - Authenticated users (planners) can only see active artist profiles
  
  2. Security
    - Ensures inactive artists are hidden from discovery
    - Artists can still read their own profiles regardless of status
    - Service role bypasses RLS for admin functions
  
  3. Notes
    - Uses LEFT JOIN to check subscription status
    - Only artists with is_active = true are visible publicly
*/

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Public can read all artist profiles" ON artist_profiles;
DROP POLICY IF EXISTS "Anyone can view artist profiles" ON artist_profiles;

-- Create new policy that filters by subscription status
CREATE POLICY "Public can view active artist profiles"
ON artist_profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.artist_id = artist_profiles.id
    AND subscriptions.is_active = true
  )
  OR
  auth.uid() = user_id
);
