/*
  # Create Admin Conversations Function

  1. New Functions
    - `get_admin_conversations()` - Returns list of users with message history
      - Shows user details (name, email, role)
      - Calculates unread message count
      - Orders by unread messages first, then most recent activity

  2. Purpose
    - Support admin message interface
    - Aggregate conversation data efficiently
    - Filter and sort conversations appropriately
*/

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
