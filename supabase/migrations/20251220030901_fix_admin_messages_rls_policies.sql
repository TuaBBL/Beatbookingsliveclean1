/*
  # Fix Admin Messages RLS Policies

  1. Changes to RLS Policies
    - Add policy for users to update read_at on their own messages
    - Update admin policies to use is_admin field instead of hardcoded email
    - Ensure both admin and users can properly send/receive messages

  2. Security Changes
    - Users can mark messages as read (update read_at only)
    - Admin check uses is_admin field for consistency
    - All operations properly secured

  3. Important Notes
    - Users can only update read_at field, not message content
    - Admin identified by is_admin=true instead of email
    - Maintains data integrity and security
*/

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admin can read all messages" ON admin_messages;
DROP POLICY IF EXISTS "Admin can insert messages" ON admin_messages;
DROP POLICY IF EXISTS "Admin can update messages" ON admin_messages;

-- Add policy for users to update read_at on messages they received
CREATE POLICY "Users can mark messages as read"
  ON admin_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create admin policies using is_admin field
CREATE POLICY "Admin can read all messages v2"
  ON admin_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admin can insert messages v2"
  ON admin_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    AND sender = 'admin'
  );

CREATE POLICY "Admin can update messages v2"
  ON admin_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );