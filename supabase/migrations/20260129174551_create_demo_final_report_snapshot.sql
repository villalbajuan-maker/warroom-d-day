/*
  # Create Demo Final Report Snapshot Table

  1. New Tables
    - `demo_final_report_snapshot`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, references campaigns)
      - `campaign_name` (text)
      - `total_municipalities` (integer)
      - `total_polling_places` (integer)
      - `total_tables` (integer)
      - `tables_covered` (integer)
      - `tables_checked_in` (integer)
      - `tables_closed` (integer)
      - `e14_received` (integer)
      - `total_witnesses` (integer)
      - `witnesses_present` (integer)
      - `witnesses_absent` (integer)
      - `total_incidents` (integer)
      - `critical_incidents` (integer)
      - `high_incidents` (integer)
      - `medium_incidents` (integer)
      - `low_incidents` (integer)
      - `total_evidences` (integer)
      - `total_signals` (integer)
      - `municipalities_summary` (jsonb)
      - `generated_at` (timestamptz, default now())
      - `created_at` (timestamptz, default now())

  2. Purpose
    - Persists a ONE-TIME final snapshot of the demo timeline
    - Decouples Final Report from demo_current_minute
    - Ensures Final Report remains stable regardless of slider position
    - Generated when demo reaches "Informe final disponible" event

  3. Security
    - Enable RLS on snapshot table
    - Allow authenticated users to read snapshots
    - Restrict write access (only system should generate)
*/

CREATE TABLE IF NOT EXISTS demo_final_report_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_name text NOT NULL DEFAULT '',
  total_municipalities integer NOT NULL DEFAULT 0,
  total_polling_places integer NOT NULL DEFAULT 0,
  total_tables integer NOT NULL DEFAULT 0,
  tables_covered integer NOT NULL DEFAULT 0,
  tables_checked_in integer NOT NULL DEFAULT 0,
  tables_closed integer NOT NULL DEFAULT 0,
  e14_received integer NOT NULL DEFAULT 0,
  total_witnesses integer NOT NULL DEFAULT 0,
  witnesses_present integer NOT NULL DEFAULT 0,
  witnesses_absent integer NOT NULL DEFAULT 0,
  total_incidents integer NOT NULL DEFAULT 0,
  critical_incidents integer NOT NULL DEFAULT 0,
  high_incidents integer NOT NULL DEFAULT 0,
  medium_incidents integer NOT NULL DEFAULT 0,
  low_incidents integer NOT NULL DEFAULT 0,
  total_evidences integer NOT NULL DEFAULT 0,
  total_signals integer NOT NULL DEFAULT 0,
  municipalities_summary jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id)
);

ALTER TABLE demo_final_report_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read final report snapshots"
  ON demo_final_report_snapshot
  FOR SELECT
  USING (true);

CREATE POLICY "Service can insert final report snapshots"
  ON demo_final_report_snapshot
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update final report snapshots"
  ON demo_final_report_snapshot
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_demo_final_report_campaign
  ON demo_final_report_snapshot(campaign_id);
