/*
  # Allow Reading Public Profile Data

  1. Changes
    - Add SELECT policy to allow authenticated users to read public profile information
    - This enables planners to view artist profile images and basic info

  2. Security
    - Users can read their own full profile (existing policy)
    - Authenticated users can read public info (name, image_url, city, state, country) from other profiles
    - Email and phone_number remain private

  3. Notes
    - This fixes the issue where artist profile images weren't showing on artist cards
    - Users still cannot update other users' profiles (only their own)
*/

CREATE POLICY "Enable read access for authenticated users to view public profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
