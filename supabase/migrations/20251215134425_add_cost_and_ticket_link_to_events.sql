/*
  # Add cost and ticket link fields to events table

  1. Changes
    - Add `cost` field to store event ticket price
    - Add `ticket_link` field to store link where users can purchase tickets
    
  2. Notes
    - Both fields are optional (nullable)
    - Cost is stored as a numeric value to support decimal prices
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'cost'
  ) THEN
    ALTER TABLE events ADD COLUMN cost numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'ticket_link'
  ) THEN
    ALTER TABLE events ADD COLUMN ticket_link text;
  END IF;
END $$;