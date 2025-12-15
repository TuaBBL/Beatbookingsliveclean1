/*
  # Add venue field to events table

  1. Changes
    - Add `venue` column to `events` table
      - Type: text (nullable)
      - Stores the venue name or location where the event will be held
  
  2. Notes
    - This field is optional to maintain backward compatibility
    - Existing events will have null values for venue
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'venue'
  ) THEN
    ALTER TABLE events ADD COLUMN venue text;
  END IF;
END $$;