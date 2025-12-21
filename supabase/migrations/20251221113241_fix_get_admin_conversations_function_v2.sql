/*
  # Fix get_admin_conversations Function

  1. Changes
    - Drop and recreate function with correct column names
    - Use read_at instead of is_read
    - Use sender='user' instead of from_admin=false
    - Fix query to properly count unread messages from users

  2. Purpose
    - Fix admin message loading to show all user conversations
    - Properly calculate unread message counts
*/

DROP FUNCTION IF EXISTS get_admin_conversations();

CREATE OR REPLACE FUNCTION get_admin_conversations()
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  role text,
  last_message_at timestamptz,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.name,
    u.email,
    u.role,
    max(m.created_at) as last_message_at,
    count(*) FILTER (
      WHERE m.sender = 'user' AND m.read_at IS NULL
    ) as unread_count
  FROM public.profiles u
  JOIN public.admin_messages m ON m.user_id = u.id
  GROUP BY u.id, u.name, u.email, u.role
  ORDER BY
    unread_count DESC,
    last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
