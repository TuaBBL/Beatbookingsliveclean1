/*
  # Fix Demo Artists Visibility

  1. Problem
    - Current RLS policy hides artists without active subscriptions
    - Demo artists have no subscriptions at all
    - This breaks the homepage and artist directory

  2. Solution
    - Update RLS policy to allow demo artists to be visible
    - Demo artists (type='demo') should always be public
    - Real artists still require active subscriptions

  3. Security
    - Demo artists are public seed data
    - Real artists still protected by subscription enforcement
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Public can view active artist profiles" ON artist_profiles;

-- Create updated policy that allows demo artists
CREATE POLICY "Public can view active artists and demos"
ON artist_profiles
FOR SELECT
TO public
USING (
  -- Demo artists are always visible
  type = 'demo'
  OR
  -- Real artists need active subscription
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.artist_id = artist_profiles.id
    AND subscriptions.is_active = true
  )
  OR
  -- Artists can view their own profile
  auth.uid() = user_id
);
