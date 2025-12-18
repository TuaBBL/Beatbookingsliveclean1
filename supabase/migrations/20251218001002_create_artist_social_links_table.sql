/*
  # Create Artist Social Links Table

  1. New Tables
    - `artist_social_links`
      - `id` (uuid, primary key) - Unique identifier for each social link
      - `artist_id` (uuid, foreign key) - References artist_profiles.id
      - `platform` (text) - Social media platform name (instagram, facebook, twitter, etc.)
      - `url` (text) - Full URL to the social media profile
      - `created_at` (timestamptz) - Timestamp of when the link was created

  2. Constraints
    - Unique constraint on (artist_id, platform) to prevent duplicate platforms per artist

  3. Security
    - Enable RLS on artist_social_links table
    - Artists can view, create, update, and delete their own social links
    - Everyone can read all social links (public information)
*/

CREATE TABLE IF NOT EXISTS artist_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint to prevent duplicate platforms per artist
CREATE UNIQUE INDEX IF NOT EXISTS artist_social_links_artist_platform_unique 
  ON artist_social_links(artist_id, platform);

-- Enable Row Level Security
ALTER TABLE artist_social_links ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read social links (public information)
CREATE POLICY "Anyone can view social links"
  ON artist_social_links
  FOR SELECT
  TO public
  USING (true);

-- Policy: Artists can insert their own social links
CREATE POLICY "Artists can create own social links"
  ON artist_social_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artist_profiles
      WHERE artist_profiles.id = artist_social_links.artist_id
      AND artist_profiles.user_id = auth.uid()
    )
  );

-- Policy: Artists can update their own social links
CREATE POLICY "Artists can update own social links"
  ON artist_social_links
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM artist_profiles
      WHERE artist_profiles.id = artist_social_links.artist_id
      AND artist_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM artist_profiles
      WHERE artist_profiles.id = artist_social_links.artist_id
      AND artist_profiles.user_id = auth.uid()
    )
  );

-- Policy: Artists can delete their own social links
CREATE POLICY "Artists can delete own social links"
  ON artist_social_links
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM artist_profiles
      WHERE artist_profiles.id = artist_social_links.artist_id
      AND artist_profiles.user_id = auth.uid()
    )
  );