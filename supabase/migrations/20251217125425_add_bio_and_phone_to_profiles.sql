/*
  # Add bio and phone number fields

  1. Changes
    - Add `phone_number` column to `profiles` table
    - Add `bio` column to `artist_profiles` table
  
  2. Details
    - `phone_number` (text, nullable) - User's contact phone number
    - `bio` (text, nullable) - Artist biography/description
  
  3. Notes
    - Both fields are optional (nullable)
    - No RLS changes required (inherits existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE artist_profiles ADD COLUMN bio text;
  END IF;
END $$;
