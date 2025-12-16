/*
  # Create favourites table

  1. New Tables
    - `favourites`
      - `id` (uuid, primary key) - Unique identifier
      - `planner_id` (uuid, foreign key) - References profiles.id
      - `artist_id` (uuid, foreign key) - References artist_profiles.id
      - `created_at` (timestamptz) - When the favourite was created

  2. Security
    - Enable RLS on `favourites` table
    - Add policy for planners to manage their own favourites
*/

CREATE TABLE IF NOT EXISTS favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(planner_id, artist_id)
);

ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planners can view own favourites"
  ON favourites FOR SELECT
  TO authenticated
  USING (auth.uid() = planner_id);

CREATE POLICY "Planners can insert own favourites"
  ON favourites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = planner_id);

CREATE POLICY "Planners can delete own favourites"
  ON favourites FOR DELETE
  TO authenticated
  USING (auth.uid() = planner_id);