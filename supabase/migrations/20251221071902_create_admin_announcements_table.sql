/*
  # Create Admin Announcements Table

  1. New Tables
    - `admin_announcements`
      - `id` (uuid, primary key)
      - `title` (text) - announcement title
      - `message` (text) - announcement message
      - `is_active` (boolean) - whether announcement is currently visible
      - `priority` (integer) - display order (lower numbers first)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, references auth.users) - admin who created it
  
  2. Security
    - Enable RLS on `admin_announcements` table
    - Allow all users to read active announcements
    - Only admins can insert, update, delete announcements

  3. Notes
    - Used for homepage notifications about upcoming features and updates
    - Visible to all users (read-only)
    - Only admins can manage through admin dashboard
*/

CREATE TABLE IF NOT EXISTS admin_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_announcements_is_active ON admin_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_announcements_priority ON admin_announcements(priority);

ALTER TABLE admin_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active announcements"
  ON admin_announcements
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can read all announcements"
  ON admin_announcements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert announcements"
  ON admin_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update announcements"
  ON admin_announcements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete announcements"
  ON admin_announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_announcement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_announcement_updated_at
  BEFORE UPDATE ON admin_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcement_updated_at();