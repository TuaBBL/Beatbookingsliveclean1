/*
  # Add is_active column to subscriptions
  
  1. Changes
    - Add is_active boolean column to subscriptions table
    - Default to false
    - Not nullable
  
  2. Notes
    - Required for subscription activation logic
    - Works alongside status field for state management
*/

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN is_active boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Ensure unique constraint on artist_id
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_artist_id_unique
ON subscriptions (artist_id);
