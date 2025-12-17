/*
  # Add RLS Policies for Admin Access - Messages Table
  
  1. Security Changes
    - Ensure RLS enabled on messages table
    - Add participant-read policy: users can read their own messages (sender or recipient)
    - Add admin-read policy: admins can read all messages
  
  2. Important Notes
    - Self-access policy added FIRST
    - Admin override policy added SECOND
    - No UPDATE or DELETE policies added
    - Read-only visibility for admin dashboard
*/

-- Ensure RLS is enabled on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participant-read policy: users can read messages they are involved in
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Messages: participants read'
  ) THEN
    CREATE POLICY "Messages: participants read"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
      sender_id = auth.uid() 
      OR recipient_id = auth.uid()
    );
  END IF;
END $$;

-- Admin read-all policy: admins can read all messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Messages: admin read all'
  ) THEN
    CREATE POLICY "Messages: admin read all"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.is_admin = true
      )
    );
  END IF;
END $$;
