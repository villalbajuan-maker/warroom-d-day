/*
  # Enable RLS for presence_records

  1. Security Changes
    - Enable Row Level Security on presence_records table
    - Add policy for authenticated witnesses to insert their own presence records
    - Add policy for authenticated witnesses to view their own presence records
    - Add policy for authenticated witnesses to update their own checkout time

  2. Important Notes
    - Witnesses can only insert/view/update records for their own assignment
    - The assignment_id connects the witness to their table assignment
*/

-- Enable RLS
ALTER TABLE presence_records ENABLE ROW LEVEL SECURITY;

-- Policy: Witnesses can insert their own presence records
CREATE POLICY "Witnesses can insert own presence"
  ON presence_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = presence_records.assignment_id
      AND assignments.witness_id IN (
        SELECT id FROM witnesses 
        WHERE document_number = (auth.jwt() ->> 'document_number')
        AND campaign_id = presence_records.campaign_id
      )
    )
  );

-- Policy: Witnesses can view their own presence records
CREATE POLICY "Witnesses can view own presence"
  ON presence_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = presence_records.assignment_id
      AND assignments.witness_id IN (
        SELECT id FROM witnesses 
        WHERE document_number = (auth.jwt() ->> 'document_number')
        AND campaign_id = presence_records.campaign_id
      )
    )
  );

-- Policy: Witnesses can update their own checkout time
CREATE POLICY "Witnesses can update own checkout"
  ON presence_records
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = presence_records.assignment_id
      AND assignments.witness_id IN (
        SELECT id FROM witnesses 
        WHERE document_number = (auth.jwt() ->> 'document_number')
        AND campaign_id = presence_records.campaign_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments
      WHERE assignments.id = presence_records.assignment_id
      AND assignments.witness_id IN (
        SELECT id FROM witnesses 
        WHERE document_number = (auth.jwt() ->> 'document_number')
        AND campaign_id = presence_records.campaign_id
      )
    )
  );
