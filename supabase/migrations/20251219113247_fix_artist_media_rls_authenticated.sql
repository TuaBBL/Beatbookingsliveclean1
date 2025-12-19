/*
  # Fix artist_media RLS policies for authenticated users

  1. Changes
    - Update INSERT policy to use `TO authenticated` instead of `TO public`
    - Update DELETE policy to use `TO authenticated` instead of `TO public`
    - Ensures authenticated artists can upload and delete their own media
  
  2. Security
    - INSERT requires user to own the artist profile
    - DELETE requires user to own the artist profile
    - SELECT remains public for viewing media
    
  3. Important Notes
    - Using `TO public` prevents authenticated users from matching the policy
    - Must use `TO authenticated` for operations requiring authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Artist media: owner insert" ON artist_media;
DROP POLICY IF EXISTS "Artist media: owner delete" ON artist_media;

-- Recreate INSERT policy with TO authenticated
CREATE POLICY "Artist media: owner insert"
ON artist_media
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM artist_profiles ap
    WHERE ap.id = artist_media.artist_id
      AND ap.user_id = auth.uid()
  )
);

-- Recreate DELETE policy with TO authenticated  
CREATE POLICY "Artist media: owner delete"
ON artist_media
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM artist_profiles ap
    WHERE ap.id = artist_media.artist_id
      AND ap.user_id = auth.uid()
  )
);