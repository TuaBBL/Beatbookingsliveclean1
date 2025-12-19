/*
  # Add artist RLS policies for subscriptions

  1. New Policies
    - Artists can INSERT their own subscription
    - Artists can UPDATE their own subscription
  
  2. Security
    - Ensures artists can only modify subscriptions for their own artist_id
    - Service role (webhooks) bypasses RLS
*/

-- Artist can insert their own subscription
CREATE POLICY "Artist can insert own subscription"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM artist_profiles ap
    WHERE ap.id = artist_id
    AND ap.user_id = auth.uid()
  )
);

-- Artist can update their own subscription
CREATE POLICY "Artist can update own subscription"
ON subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM artist_profiles ap
    WHERE ap.id = subscriptions.artist_id
    AND ap.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM artist_profiles ap
    WHERE ap.id = artist_id
    AND ap.user_id = auth.uid()
  )
);
