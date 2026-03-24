/*
  # Enable RLS for witness mobile app login

  1. Security Changes
    - Enable RLS on witnesses table
    - Enable RLS on assignments table
    - Enable RLS on territorial tables
    - Add policies for anon role to allow SELECT operations needed for login

  2. Policies
    - witnesses: Allow SELECT for anon users (login lookup by document_number)
    - assignments: Allow SELECT for anon users (loading witness assignments)
    - territorial_*: Allow SELECT for anon users (loading location data)
*/

-- Enable RLS on witnesses table
ALTER TABLE witnesses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on territorial tables
ALTER TABLE territorial_polling_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorial_polling_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorial_municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE territorial_departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DO $$
BEGIN
  DROP POLICY IF EXISTS "witnesses_select_anon_policy" ON witnesses;
  DROP POLICY IF EXISTS "assignments_select_anon_policy" ON assignments;
  DROP POLICY IF EXISTS "polling_tables_select_anon_policy" ON territorial_polling_tables;
  DROP POLICY IF EXISTS "polling_places_select_anon_policy" ON territorial_polling_places;
  DROP POLICY IF EXISTS "municipalities_select_anon_policy" ON territorial_municipalities;
  DROP POLICY IF EXISTS "departments_select_anon_policy" ON territorial_departments;
END $$;

-- Create policy for anon users to read witnesses (for login)
CREATE POLICY "witnesses_select_anon_policy"
  ON witnesses
  FOR SELECT
  TO anon
  USING (true);

-- Create policy for anon users to read assignments
CREATE POLICY "assignments_select_anon_policy"
  ON assignments
  FOR SELECT
  TO anon
  USING (true);

-- Create policy for anon users to read polling tables
CREATE POLICY "polling_tables_select_anon_policy"
  ON territorial_polling_tables
  FOR SELECT
  TO anon
  USING (true);

-- Create policy for anon users to read polling places
CREATE POLICY "polling_places_select_anon_policy"
  ON territorial_polling_places
  FOR SELECT
  TO anon
  USING (true);

-- Create policy for anon users to read municipalities
CREATE POLICY "municipalities_select_anon_policy"
  ON territorial_municipalities
  FOR SELECT
  TO anon
  USING (true);

-- Create policy for anon users to read departments
CREATE POLICY "departments_select_anon_policy"
  ON territorial_departments
  FOR SELECT
  TO anon
  USING (true);
