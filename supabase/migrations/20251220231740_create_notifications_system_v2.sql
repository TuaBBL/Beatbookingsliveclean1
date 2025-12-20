/*
  # Create Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text) - type of notification (booking_request, booking_accepted, booking_declined, new_review, new_message, etc.)
      - `title` (text) - notification title
      - `message` (text) - notification message
      - `link` (text, nullable) - optional link to relevant page
      - `is_read` (boolean) - whether the notification has been read
      - `created_at` (timestamptz)
      - `related_id` (uuid, nullable) - ID of related entity (booking, review, etc.)
  
  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for users to update their own notifications (mark as read)
    - Add policy for authenticated users to insert notifications

  3. Functions
    - Create function to automatically create notifications for booking events
    - Create function to automatically create notifications for review events
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION create_booking_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  artist_user_id uuid;
  planner_name text;
BEGIN
  SELECT ap.user_id INTO artist_user_id
  FROM artist_profiles ap
  WHERE ap.id = NEW.artist_id;

  SELECT p.name INTO planner_name
  FROM profiles p
  WHERE p.id = NEW.planner_id;

  IF artist_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, related_id)
    VALUES (
      artist_user_id,
      'booking_request',
      'New Booking Request',
      planner_name || ' has sent you a booking request for ' || NEW.event_name,
      '/artist/bookings',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_booking_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  artist_user_id uuid;
  planner_name text;
  artist_stage_name text;
BEGIN
  SELECT p.name INTO planner_name
  FROM profiles p
  WHERE p.id = NEW.planner_id;

  SELECT ap.stage_name, ap.user_id INTO artist_stage_name, artist_user_id
  FROM artist_profiles ap
  WHERE ap.id = NEW.artist_id;

  IF OLD.status != NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, type, title, message, link, related_id)
      VALUES (
        NEW.planner_id,
        'booking_accepted',
        'Booking Request Accepted',
        artist_stage_name || ' has accepted your booking request for ' || NEW.event_name,
        '/planner/confirmed',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO notifications (user_id, type, title, message, link, related_id)
      VALUES (
        NEW.planner_id,
        'booking_declined',
        'Booking Request Declined',
        artist_stage_name || ' has declined your booking request for ' || NEW.event_name,
        '/planner/bookings',
        NEW.id
      );
    ELSIF NEW.status = 'cancelled' THEN
      IF artist_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, link, related_id)
        VALUES (
          artist_user_id,
          'booking_cancelled',
          'Booking Cancelled',
          planner_name || ' has cancelled the booking for ' || NEW.event_name,
          '/artist/bookings',
          NEW.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_review_notification()
RETURNS TRIGGER AS $$
DECLARE
  artist_user_id uuid;
  planner_name text;
BEGIN
  SELECT ap.user_id INTO artist_user_id
  FROM artist_profiles ap
  WHERE ap.id = NEW.artist_id;

  SELECT p.name INTO planner_name
  FROM profiles p
  WHERE p.id = NEW.planner_id;

  IF artist_user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, related_id)
    VALUES (
      artist_user_id,
      'new_review',
      'New Review Received',
      planner_name || ' left you a ' || NEW.rating || '-star review',
      '/artist/dashboard',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_booking_request_notification'
  ) THEN
    CREATE TRIGGER trigger_booking_request_notification
      AFTER INSERT ON booking_requests
      FOR EACH ROW
      EXECUTE FUNCTION create_booking_request_notification();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_booking_status_notification'
  ) THEN
    CREATE TRIGGER trigger_booking_status_notification
      AFTER UPDATE ON booking_requests
      FOR EACH ROW
      EXECUTE FUNCTION create_booking_status_notification();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_review_notification'
  ) THEN
    CREATE TRIGGER trigger_review_notification
      AFTER INSERT ON artist_reviews
      FOR EACH ROW
      EXECUTE FUNCTION create_review_notification();
  END IF;
END $$;