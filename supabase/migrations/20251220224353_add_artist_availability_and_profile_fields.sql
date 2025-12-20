/*
  # Add Artist Availability and Profile Fields

  ## New Tables
  
  1. `artist_availability` - Manual calendar entries for artists
    - `id` (uuid, primary key)
    - `artist_id` (uuid, foreign key to artist_profiles)
    - `event_date` (date)
    - `start_time` (time)
    - `end_time` (time)
    - `title` (text) - event/booking title
    - `description` (text, optional) - notes about the availability block
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  ## Modified Tables

  1. `artist_profiles` - Add equipment and pricing fields
    - `equipment` (text, optional) - equipment they have/need
    - `price_tier_1` (numeric, optional) - first pricing option
    - `price_tier_1_description` (text, optional) - description of first tier
    - `price_tier_2` (numeric, optional) - second pricing option
    - `price_tier_2_description` (text, optional) - description of second tier

  2. `profiles` - Add country code for phone numbers
    - `phone_country_code` (text, default '+61') - country calling code

  ## Security
  
  - Enable RLS on artist_availability table
  - Artists can manage their own availability entries
  - Planners can view availability (read-only)
*/

-- Create artist_availability table
CREATE TABLE IF NOT EXISTS artist_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artist_profiles(id) ON DELETE CASCADE NOT NULL,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE artist_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artist_availability
CREATE POLICY "Artists can view own availability"
  ON artist_availability
  FOR SELECT
  TO authenticated
  USING (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Artists can insert own availability"
  ON artist_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Artists can update own availability"
  ON artist_availability
  FOR UPDATE
  TO authenticated
  USING (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Artists can delete own availability"
  ON artist_availability
  FOR DELETE
  TO authenticated
  USING (
    artist_id IN (
      SELECT id FROM artist_profiles WHERE user_id = auth.uid()
    )
  );

-- Add equipment and pricing fields to artist_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_profiles' AND column_name = 'equipment'
  ) THEN
    ALTER TABLE artist_profiles ADD COLUMN equipment text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_profiles' AND column_name = 'price_tier_1'
  ) THEN
    ALTER TABLE artist_profiles ADD COLUMN price_tier_1 numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_profiles' AND column_name = 'price_tier_1_description'
  ) THEN
    ALTER TABLE artist_profiles ADD COLUMN price_tier_1_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_profiles' AND column_name = 'price_tier_2'
  ) THEN
    ALTER TABLE artist_profiles ADD COLUMN price_tier_2 numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_profiles' AND column_name = 'price_tier_2_description'
  ) THEN
    ALTER TABLE artist_profiles ADD COLUMN price_tier_2_description text;
  END IF;
END $$;

-- Add phone country code to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_country_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_country_code text DEFAULT '+61';
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_artist_availability_artist_date 
  ON artist_availability(artist_id, event_date);
