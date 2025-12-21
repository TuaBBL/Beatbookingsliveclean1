/*
  # Create Music Pool Links Table

  1. New Tables
    - `music_pool_links`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - the user who created the link
      - `artist_id` (uuid, nullable, references artist_profiles) - for artists
      - `link_url` (text) - the external music pool link
      - `title` (text, nullable) - optional title for the link
      - `description` (text, nullable) - optional description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on music_pool_links table
    - Anyone authenticated can read all links
    - Users can create their own links
    - Users can update/delete their own links
    - Admins can manage all links

  3. Indexes
    - Index on user_id for fast lookups
    - Index on artist_id for artist-specific queries
    - Index on created_at for sorting

  4. Constraints
    - Unique constraint on user_id to allow one link per user
*/

CREATE TABLE IF NOT EXISTS music_pool_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  artist_id uuid REFERENCES artist_profiles(id) ON DELETE SET NULL,
  link_url text NOT NULL,
  title text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_music_pool_links_user_id ON music_pool_links(user_id);
CREATE INDEX IF NOT EXISTS idx_music_pool_links_artist_id ON music_pool_links(artist_id);
CREATE INDEX IF NOT EXISTS idx_music_pool_links_created_at ON music_pool_links(created_at DESC);

ALTER TABLE music_pool_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all music pool links"
  ON music_pool_links
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own music pool links"
  ON music_pool_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music pool links"
  ON music_pool_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music pool links"
  ON music_pool_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all music pool links"
  ON music_pool_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_music_pool_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_music_pool_links_updated_at
  BEFORE UPDATE ON music_pool_links
  FOR EACH ROW
  EXECUTE FUNCTION update_music_pool_links_updated_at();
