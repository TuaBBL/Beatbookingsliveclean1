/*
  # Create Artist Reviews Table and Rating Calculation Function

  1. New Tables
    - `artist_reviews`
      - `id` (uuid, primary key) - Unique identifier for each review
      - `artist_id` (uuid, foreign key) - References artist_profiles.id
      - `planner_id` (uuid, foreign key) - References profiles.id of the reviewer
      - `rating` (integer) - Rating from 1 to 5 stars
      - `review_text` (text) - Written review content
      - `created_at` (timestamptz) - Timestamp of when the review was created

  2. Constraints
    - Unique constraint on (artist_id, planner_id) to prevent duplicate reviews
    - Check constraint to ensure rating is between 1 and 5

  3. Functions
    - `get_artist_rating_stats` - Calculates average rating and total count per artist

  4. Security
    - Enable RLS on artist_reviews table
    - Planners can create reviews for artists
    - Everyone can read all reviews (public information)
    - Planners can update/delete their own reviews
*/

CREATE TABLE IF NOT EXISTS artist_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  planner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create unique constraint to prevent duplicate reviews from same planner
CREATE UNIQUE INDEX IF NOT EXISTS artist_reviews_artist_planner_unique 
  ON artist_reviews(artist_id, planner_id);

-- Create index for faster queries on artist_id
CREATE INDEX IF NOT EXISTS artist_reviews_artist_id_idx ON artist_reviews(artist_id);

-- Enable Row Level Security
ALTER TABLE artist_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read reviews (public information)
CREATE POLICY "Anyone can view reviews"
  ON artist_reviews
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated planners can create reviews
CREATE POLICY "Planners can create reviews"
  ON artist_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = artist_reviews.planner_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = artist_reviews.planner_id
      AND profiles.role = 'planner'
    )
  );

-- Policy: Planners can update their own reviews
CREATE POLICY "Planners can update own reviews"
  ON artist_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = artist_reviews.planner_id)
  WITH CHECK (auth.uid() = artist_reviews.planner_id);

-- Policy: Planners can delete their own reviews
CREATE POLICY "Planners can delete own reviews"
  ON artist_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = artist_reviews.planner_id);

-- Function to calculate artist rating statistics
CREATE OR REPLACE FUNCTION get_artist_rating_stats(p_artist_id uuid)
RETURNS TABLE (
  average_rating numeric,
  review_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*) as review_count
  FROM artist_reviews
  WHERE artist_id = p_artist_id;
END;
$$ LANGUAGE plpgsql STABLE;