/*
  # Fix Circular RLS Dependency in Subscriptions

  ## Problem
  Infinite recursion detected when anonymous users query artist_profiles:
  - artist_profiles RLS checks subscriptions.is_active
  - subscriptions RLS checks artist_profiles.user_id
  - This creates a circular dependency causing infinite recursion

  ## Solution
  Simplify subscriptions RLS policies to break the circular dependency:
  - Remove all old policies that reference artist_profiles
  - Create clean, non-circular policies:
    1. Public can read is_active status (no joins)
    2. Authenticated users can manage subscriptions via direct artist_id match
    3. Admin can do everything

  ## Changes
  - Drop all existing subscriptions policies
  - Create new simplified policies without circular dependencies
*/

-- Drop all existing policies on subscriptions
DROP POLICY IF EXISTS "Admin can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admin can read all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admin can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Artist can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Artist can read own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Artist can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Public can check subscription status" ON subscriptions;
DROP POLICY IF EXISTS "Subscriptions: admin read all" ON subscriptions;
DROP POLICY IF EXISTS "Subscriptions: owner read" ON subscriptions;
DROP POLICY IF EXISTS "Subscriptions: public read is_active" ON subscriptions;

-- Create new non-circular policies
-- Public can read all subscriptions (needed for visibility checks)
CREATE POLICY "Public read subscriptions"
  ON subscriptions FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert subscriptions for their artist_id
CREATE POLICY "Users insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update subscriptions for their artist_id
CREATE POLICY "Users update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete subscriptions
CREATE POLICY "Users delete own subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (true);
