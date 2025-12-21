/*
  # Create Auto Announcements for Events and Artists

  1. New Functions
    - `create_event_published_announcement()` - Creates announcement when event is published
    - `create_new_artist_announcement()` - Creates announcement when new artist joins

  2. Purpose
    - Automatically notify all users on homepage when new events are published
    - Automatically notify all users on homepage when new artists join the platform

  3. Triggers
    - Trigger on events table when status changes to 'published'
    - Trigger on artist_profiles table when new real artist is created
*/

-- Function to create announcement when event is published
CREATE OR REPLACE FUNCTION create_event_published_announcement()
RETURNS TRIGGER AS $$
DECLARE
  creator_name text;
BEGIN
  -- Only create announcement if status changed to 'published'
  IF (TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'published') OR
     (TG_OP = 'INSERT' AND NEW.status = 'published') THEN
    
    -- Get creator name
    SELECT p.name INTO creator_name
    FROM profiles p
    WHERE p.id = NEW.creator_id;
    
    -- Create announcement
    INSERT INTO admin_announcements (
      title,
      message,
      created_by,
      priority,
      is_active
    )
    VALUES (
      'New Event: ' || NEW.title,
      'Check out this new event in ' || NEW.city || ', ' || NEW.state || ' on ' || to_char(NEW.event_date, 'DD Mon YYYY') || '! ' ||
      CASE WHEN NEW.description IS NOT NULL THEN substring(NEW.description, 1, 150) ELSE '' END,
      NEW.creator_id,
      5,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Function to create announcement when new artist joins
CREATE OR REPLACE FUNCTION create_new_artist_announcement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create announcement for real artists (not demo)
  IF NEW.type = 'real' THEN
    INSERT INTO admin_announcements (
      title,
      message,
      created_by,
      priority,
      is_active
    )
    VALUES (
      'New Artist: ' || NEW.stage_name,
      'Welcome ' || NEW.stage_name || ' to the platform! A talented ' || NEW.genre || ' artist from ' || NEW.location || ' has just joined.',
      NEW.user_id,
      10,
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Create trigger for event publishing
DROP TRIGGER IF EXISTS trigger_event_published_announcement ON events;
CREATE TRIGGER trigger_event_published_announcement
  AFTER INSERT OR UPDATE OF status ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_published_announcement();

-- Create trigger for new artists
DROP TRIGGER IF EXISTS trigger_new_artist_announcement ON artist_profiles;
CREATE TRIGGER trigger_new_artist_announcement
  AFTER INSERT ON artist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_new_artist_announcement();
