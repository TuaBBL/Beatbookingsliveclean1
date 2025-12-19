/*
  # Fix Circular Dependency in Artist Profiles RLS

  ## Problem
  - artist_profiles policies check subscriptions table
  - subscriptions policies check artist_profiles table
  - This creates infinite recursion preventing public access

  ## Solution
  - Add a public read policy for subscriptions to allow checking is_active status
  - This breaks the circular dependency and allows public users to view active artists

  ## Changes
  1. Add public SELECT policy on subscriptions for checking active status
  2. This allows the artist_profiles public policy to work correctly
*/

-- Allow public to read subscription active status (needed for artist visibility checks)
CREATE POLICY "Public can check subscription status"
  ON subscriptions
  FOR SELECT
  TO public
  USING (true);
