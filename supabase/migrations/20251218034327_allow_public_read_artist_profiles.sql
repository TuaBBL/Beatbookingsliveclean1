/*
  # Allow Public Read Access to Artist Profiles

  1. Security Changes
    - Add public read policy for artist_profiles table
    - This allows the home page to display all artists to visitors and planners
    - Artists are public profiles meant to be discovered
  
  2. Important Notes
    - Existing policies (owner read, admin read) remain unchanged
    - Only SELECT access is granted to public
    - No INSERT, UPDATE, or DELETE permissions for public users
*/

-- Public read policy: anyone can view artist profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'artist_profiles' 
    AND policyname = 'Artist profiles: public read'
  ) THEN
    CREATE POLICY "Artist profiles: public read"
    ON public.artist_profiles
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;
