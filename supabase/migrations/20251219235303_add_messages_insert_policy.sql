/*
  # Add INSERT Policy for Messages Table

  1. Security Changes
    - Add INSERT policy for authenticated users to send messages
    - Users can only insert messages where they are the sender

  2. Important Notes
    - This allows planners and artists to send messages to each other
    - Sender must be authenticated user
    - No validation on recipient (allows messaging between any users)
*/

-- Add INSERT policy for messages
CREATE POLICY "Messages: authenticated users can send"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
  );
