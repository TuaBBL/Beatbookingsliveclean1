/*
  # Create email_otps table for OTP authentication

  1. New Tables
    - `email_otps`
      - `email` (text, primary key) - User's email address
      - `otp_hash` (text) - SHA-256 hash of the 6-digit OTP
      - `expires_at` (timestamptz) - When the OTP expires (10 minutes from creation)
      - `attempts` (integer) - Number of verification attempts (max 5)
      - `created_at` (timestamptz) - When the OTP was first created
      - `updated_at` (timestamptz) - When the OTP was last updated

  2. Security
    - Enable RLS on `email_otps` table
    - No direct user access - only Edge Functions can interact with this table
    - Service role key required for all operations

  3. Important Notes
    - This table stores hashed OTPs, never plain text
    - OTPs expire after 10 minutes
    - Maximum 5 verification attempts per OTP
    - Old OTPs are overwritten when a new one is requested
*/

CREATE TABLE IF NOT EXISTS email_otps (
  email text PRIMARY KEY,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- No policies needed - only service role can access this table
-- This ensures OTPs can only be managed by Edge Functions with service role key

-- Create index for faster lookups by expiration
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

-- Create a function to clean up expired OTPs (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM email_otps WHERE expires_at < now();
END;
$$;