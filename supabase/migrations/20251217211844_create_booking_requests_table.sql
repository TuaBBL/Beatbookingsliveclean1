/*
  # Create Booking Requests Table

  1. New Tables
    - `booking_requests`
      - `id` (uuid, primary key) - Unique identifier for each booking request
      - `planner_id` (uuid, not null) - References the planner who created the request
      - `artist_user_id` (uuid, not null) - References the artist user receiving the request
      - `event_name` (text, not null) - Name of the event
      - `event_date` (date, not null) - Date of the event
      - `event_location` (text, not null) - Location of the event
      - `message` (text) - Optional message from planner to artist
      - `status` (text, not null, default 'pending') - Status: pending, accepted, declined, cancelled
      - `created_at` (timestamptz, default now()) - Timestamp of request creation

  2. Security
    - Enable RLS on `booking_requests` table
    - Policy: Planners can create booking requests
    - Policy: Planners can read their own sent requests
    - Policy: Artists can read requests sent to them
    - Policy: Admins can read all requests

  3. Important Notes
    - Uses artist_user_id to reference the user directly (not artist_profiles.id)
    - Status values: pending, accepted, declined, cancelled
    - No update/delete policies yet (will be added in future)
    - All policies check authentication properly
*/

-- Create booking_requests table
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id uuid NOT NULL,
  artist_user_id uuid NOT NULL,
  event_name text NOT NULL,
  event_date date NOT NULL,
  event_location text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Planner can create requests
CREATE POLICY "Booking requests: planner create"
  ON public.booking_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (planner_id = auth.uid());

-- Policy: Planner can read own requests
CREATE POLICY "Booking requests: planner read"
  ON public.booking_requests
  FOR SELECT
  TO authenticated
  USING (planner_id = auth.uid());

-- Policy: Artist can read requests sent to them
CREATE POLICY "Booking requests: artist read"
  ON public.booking_requests
  FOR SELECT
  TO authenticated
  USING (artist_user_id = auth.uid());

-- Policy: Admin can read all
CREATE POLICY "Booking requests: admin read all"
  ON public.booking_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.is_admin = true
    )
  );