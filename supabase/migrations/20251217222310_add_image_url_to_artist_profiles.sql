/*
  # Add Image URL to Artist Profiles
  
  1. Changes
    - Add image_url column to artist_profiles table
    - This allows demo artists to have images without user profiles
  
  2. Purpose
    - Real artists: image_url from profiles table (user's profile pic)
    - Demo artists: image_url from artist_profiles table (external Pexels URLs)
  
  3. Notes
    - Nullable field (real artists don't need it)
    - Used for demo artists that have null user_id
*/

-- Add image_url column for demo artists
ALTER TABLE artist_profiles 
  ADD COLUMN IF NOT EXISTS image_url TEXT;