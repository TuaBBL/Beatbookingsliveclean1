/*
  # Clean up artist_profiles RLS policies
  
  1. Problem
    - Multiple conflicting SELECT policies exist
    - "Artist profiles: public read" with qual=true is too permissive
    - "Public can view active artists and demos" is the correct policy but being overridden
    
  2. Solution
    - Drop all old/duplicate public SELECT policies
    - Keep only the subscription-aware policy that allows:
      * Demo artists (always visible)
      * Real artists with active subscriptions
      * Artists viewing their own profiles
    - Keep admin and owner policies for authenticated users
    
  3. Security
    - Ensures proper subscription enforcement
    - Demo artists remain visible for browsing
    - Admins can view all artists
*/

-- Drop old conflicting policies
DROP POLICY IF EXISTS "Artist profiles: public read" ON artist_profiles;
DROP POLICY IF EXISTS "Public can read all artist profiles" ON artist_profiles;
DROP POLICY IF EXISTS "Anyone can view artist profiles" ON artist_profiles;
DROP POLICY IF EXISTS "Public can view active artist profiles" ON artist_profiles;

-- Keep the subscription-aware policy (recreate to ensure it's correct)
DROP POLICY IF EXISTS "Public can view active artists and demos" ON artist_profiles;

CREATE POLICY "Public can view active artists and demos"
ON artist_profiles
FOR SELECT
TO public
USING (
  type = 'demo'
  OR
  EXISTS (
    SELECT 1 FROM subscriptions
    WHERE subscriptions.artist_id = artist_profiles.id
    AND subscriptions.is_active = true
  )
  OR
  auth.uid() = user_id
);