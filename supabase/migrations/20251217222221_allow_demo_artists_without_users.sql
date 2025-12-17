/*
  # Allow Demo Artists Without User Accounts
  
  1. Changes
    - Make artist_profiles.user_id nullable to support demo artists
    - Demo artists (type='demo') don't require real user accounts
    - Real artists (type='real') still require user accounts
  
  2. Purpose
    - Enable demo/sample artist data for browsing and testing
    - Separate demo artists from real artists using the 'type' field
    - Demo artists appear in listings but don't need authentication
  
  3. Security
    - RLS policies already check user_id for real artists
    - Demo artists with null user_id cannot be edited by users
    - Admin policies remain unchanged
*/

-- Make user_id nullable to allow demo artists without user accounts
ALTER TABLE artist_profiles 
  ALTER COLUMN user_id DROP NOT NULL;