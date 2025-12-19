/*
  # Fix subscription CHECK constraints

  1. Updates
    - Add "test" to the plan CHECK constraint
    - Add "pending" to the status CHECK constraint
  
  2. Changes
    - Drop existing CHECK constraints
    - Recreate with updated values
*/

-- Drop existing CHECK constraints
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add updated CHECK constraints with new values
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_plan_check 
CHECK (plan = ANY (ARRAY['free'::text, 'standard'::text, 'premium'::text, 'free_forever'::text, 'test'::text]));

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'pending'::text]));
