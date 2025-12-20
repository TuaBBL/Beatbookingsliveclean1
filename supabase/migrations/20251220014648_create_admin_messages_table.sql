/*
  # Create Admin Messages Table

  1. New Tables
    - `admin_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `sender` (text, 'admin' or 'user')
      - `message` (text)
      - `created_at` (timestamptz)
      - `read_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `admin_messages` table
    - Policy: Users can read their own messages
    - Policy: Users can insert messages as 'user' sender
    - Policy: Admin can do everything

  3. Indexes
    - Index on user_id for efficient queries
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('admin', 'user')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_admin_messages_user_id ON admin_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_created_at ON admin_messages(created_at DESC);

ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
  ON admin_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages"
  ON admin_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND sender = 'user'
  );

CREATE POLICY "Admin can read all messages"
  ON admin_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'genetua@gtrax.net'
    )
  );

CREATE POLICY "Admin can insert messages"
  ON admin_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'genetua@gtrax.net'
    )
    AND sender = 'admin'
  );

CREATE POLICY "Admin can update messages"
  ON admin_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'genetua@gtrax.net'
    )
  );
