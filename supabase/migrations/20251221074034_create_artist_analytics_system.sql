/*
  # Create Artist Analytics System

  1. New Tables
    - `artist_profile_views`
      - `id` (uuid, primary key)
      - `artist_id` (uuid, references artist_profiles)
      - `viewer_id` (uuid, nullable, references auth.users) - null for anonymous
      - `viewed_at` (timestamptz)
      - `session_id` (text) - to deduplicate views in same session
    
    - `featured_artists`
      - `id` (uuid, primary key)
      - `artist_id` (uuid, references artist_profiles)
      - `month` (date) - first day of month
      - `score` (numeric) - calculated score
      - `views_count` (integer)
      - `bookings_count` (integer)
      - `reviews_count` (integer)
      - `average_rating` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Anyone can insert profile views
    - Artists can read their own analytics
    - Admins can read all analytics
    - Anyone can read featured artists

  3. Functions
    - `get_artist_analytics` - returns analytics for a specific artist
    - `calculate_featured_artists` - calculates monthly featured artists
    - `track_artist_view` - tracks a profile view with deduplication

  4. Indexes
    - Index on artist_id for fast lookups
    - Index on viewed_at for time-based queries
    - Index on month for featured artists
*/

CREATE TABLE IF NOT EXISTS artist_profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artist_profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now(),
  session_id text,
  UNIQUE(artist_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_views_artist_id ON artist_profile_views(artist_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON artist_profile_views(viewed_at DESC);

ALTER TABLE artist_profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track profile views"
  ON artist_profile_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Artists can read their own views"
  ON artist_profile_views
  FOR SELECT
  TO authenticated
  USING (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all views"
  ON artist_profile_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS featured_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artist_profiles(id) ON DELETE CASCADE NOT NULL,
  month date NOT NULL,
  score numeric DEFAULT 0,
  views_count integer DEFAULT 0,
  bookings_count integer DEFAULT 0,
  reviews_count integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(artist_id, month)
);

CREATE INDEX IF NOT EXISTS idx_featured_artists_month ON featured_artists(month DESC);
CREATE INDEX IF NOT EXISTS idx_featured_artists_score ON featured_artists(score DESC);

ALTER TABLE featured_artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read featured artists"
  ON featured_artists
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage featured artists"
  ON featured_artists
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

CREATE OR REPLACE FUNCTION track_artist_view(
  p_artist_id uuid,
  p_session_id text,
  p_viewer_id uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO artist_profile_views (artist_id, viewer_id, session_id)
  VALUES (p_artist_id, p_viewer_id, p_session_id)
  ON CONFLICT (artist_id, session_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION get_artist_analytics(
  p_artist_id uuid,
  p_days integer DEFAULT 30
)
RETURNS json AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total_views', (
      SELECT COUNT(*)
      FROM artist_profile_views
      WHERE artist_id = p_artist_id
      AND viewed_at >= NOW() - (p_days || ' days')::interval
    ),
    'unique_viewers', (
      SELECT COUNT(DISTINCT viewer_id)
      FROM artist_profile_views
      WHERE artist_id = p_artist_id
      AND viewed_at >= NOW() - (p_days || ' days')::interval
      AND viewer_id IS NOT NULL
    ),
    'total_booking_requests', (
      SELECT COUNT(*)
      FROM booking_requests
      WHERE artist_id = p_artist_id
      AND created_at >= NOW() - (p_days || ' days')::interval
    ),
    'accepted_bookings', (
      SELECT COUNT(*)
      FROM booking_requests
      WHERE artist_id = p_artist_id
      AND status = 'accepted'
      AND created_at >= NOW() - (p_days || ' days')::interval
    ),
    'pending_bookings', (
      SELECT COUNT(*)
      FROM booking_requests
      WHERE artist_id = p_artist_id
      AND status = 'pending'
      AND created_at >= NOW() - (p_days || ' days')::interval
    ),
    'total_reviews', (
      SELECT COUNT(*)
      FROM artist_reviews
      WHERE artist_id = p_artist_id
      AND created_at >= NOW() - (p_days || ' days')::interval
    ),
    'average_rating', (
      SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
      FROM artist_reviews
      WHERE artist_id = p_artist_id
      AND created_at >= NOW() - (p_days || ' days')::interval
    ),
    'views_by_day', (
      SELECT json_agg(
        json_build_object(
          'date', day::date,
          'views', COALESCE(view_count, 0)
        )
        ORDER BY day
      )
      FROM (
        SELECT generate_series(
          NOW() - (p_days || ' days')::interval,
          NOW(),
          '1 day'::interval
        )::date AS day
      ) days
      LEFT JOIN (
        SELECT DATE(viewed_at) AS view_date, COUNT(*) AS view_count
        FROM artist_profile_views
        WHERE artist_id = p_artist_id
        AND viewed_at >= NOW() - (p_days || ' days')::interval
        GROUP BY DATE(viewed_at)
      ) views ON days.day = views.view_date
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION calculate_featured_artists(p_month date DEFAULT DATE_TRUNC('month', NOW()))
RETURNS void AS $$
DECLARE
  v_artist RECORD;
  v_score numeric;
BEGIN
  FOR v_artist IN
    SELECT 
      ap.id AS artist_id,
      COUNT(DISTINCT apv.id) AS views_count,
      COUNT(DISTINCT br.id) FILTER (WHERE br.status IN ('accepted', 'pending')) AS bookings_count,
      COUNT(DISTINCT ar.id) AS reviews_count,
      COALESCE(AVG(ar.rating), 0) AS average_rating
    FROM artist_profiles ap
    LEFT JOIN artist_profile_views apv ON ap.id = apv.artist_id
      AND apv.viewed_at >= p_month
      AND apv.viewed_at < p_month + INTERVAL '1 month'
    LEFT JOIN booking_requests br ON ap.id = br.artist_id
      AND br.created_at >= p_month
      AND br.created_at < p_month + INTERVAL '1 month'
    LEFT JOIN artist_reviews ar ON ap.id = ar.artist_id
      AND ar.created_at >= p_month
      AND ar.created_at < p_month + INTERVAL '1 month'
    WHERE ap.type != 'demo'
    GROUP BY ap.id
  LOOP
    v_score := (v_artist.views_count * 1.0) +
               (v_artist.bookings_count * 10.0) +
               (v_artist.reviews_count * 5.0) +
               (v_artist.average_rating * 3.0);

    INSERT INTO featured_artists (
      artist_id,
      month,
      score,
      views_count,
      bookings_count,
      reviews_count,
      average_rating
    )
    VALUES (
      v_artist.artist_id,
      p_month,
      v_score,
      v_artist.views_count,
      v_artist.bookings_count,
      v_artist.reviews_count,
      v_artist.average_rating
    )
    ON CONFLICT (artist_id, month)
    DO UPDATE SET
      score = v_score,
      views_count = v_artist.views_count,
      bookings_count = v_artist.bookings_count,
      reviews_count = v_artist.reviews_count,
      average_rating = v_artist.average_rating;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;