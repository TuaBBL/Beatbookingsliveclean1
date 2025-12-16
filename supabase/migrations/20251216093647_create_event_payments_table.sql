/*
  # Create event_payments table for Stripe payment tracking

  1. New Tables
    - `event_payments`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `creator_id` (uuid, foreign key to profiles)
      - `stripe_session_id` (text, unique, indexed)
      - `stripe_payment_intent_id` (text, nullable)
      - `status` (text: 'pending', 'paid', 'failed')
      - `amount` (numeric)
      - `currency` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `event_payments` table
    - Add policy for users to view only their own payment records
    - Service role can manage all payments (for webhook processing)

  3. Indexes
    - Index on `stripe_session_id` for fast webhook lookups
    - Index on `event_id` for event-related queries
*/

CREATE TABLE IF NOT EXISTS event_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE NOT NULL,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'aud',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_payments_stripe_session_id
  ON event_payments(stripe_session_id);

CREATE INDEX IF NOT EXISTS idx_event_payments_event_id
  ON event_payments(event_id);

CREATE INDEX IF NOT EXISTS idx_event_payments_creator_id
  ON event_payments(creator_id);

ALTER TABLE event_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment records"
  ON event_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);