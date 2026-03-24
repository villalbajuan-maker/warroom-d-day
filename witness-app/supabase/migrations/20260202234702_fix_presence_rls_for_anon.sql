/*
  # Fix RLS policies for presence_records to work without auth

  1. Security Changes
    - Drop existing policies that require authentication
    - Create new policies that allow anon role to manage presence records
    - Policies still ensure data integrity by validating assignment exists

  2. Important Notes
    - This allows unauthenticated access but validates assignment_id exists
    - In production, proper Supabase Auth should be implemented
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Witnesses can insert own presence" ON presence_records;
DROP POLICY IF EXISTS "Witnesses can view own presence" ON presence_records;
DROP POLICY IF EXISTS "Witnesses can update own checkout" ON presence_records;

-- Policy: Allow anon to insert presence records for valid assignments
CREATE POLICY "Allow insert presence for valid assignments"
  ON presence_records
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = presence_records.assignment_id
      AND assignments.campaign_id = presence_records.campaign_id
    )
  );

-- Policy: Allow anon to view all presence records
CREATE POLICY "Allow view all presence records"
  ON presence_records
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow anon to update checkout time
CREATE POLICY "Allow update checkout time"
  ON presence_records
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = presence_records.assignment_id
      AND assignments.campaign_id = presence_records.campaign_id
    )
  );
