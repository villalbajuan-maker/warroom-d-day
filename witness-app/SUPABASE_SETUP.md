# Configuración de Supabase para War Room · Testigo

Esta aplicación requiere las siguientes tablas en Supabase para funcionar correctamente.

## Tablas Requeridas

### 1. presence_records
Registra cuando un testigo confirma su presencia en la mesa.

```sql
CREATE TABLE IF NOT EXISTS presence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  witness_id TEXT NOT NULL,
  table_number TEXT NOT NULL,
  municipality TEXT NOT NULL,
  polling_station TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE presence_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users"
  ON presence_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read for authenticated users"
  ON presence_records FOR SELECT
  TO authenticated
  USING (true);
```

### 2. incident_records
Almacena los reportes de incidencias de los testigos.

```sql
CREATE TABLE IF NOT EXISTS incident_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  witness_id TEXT NOT NULL,
  table_number TEXT NOT NULL,
  municipality TEXT NOT NULL,
  polling_station TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE incident_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users"
  ON incident_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read for authenticated users"
  ON incident_records FOR SELECT
  TO authenticated
  USING (true);
```

### 3. evidence_records
Guarda referencias a evidencias (fotos/videos) subidas por testigos.

```sql
CREATE TABLE IF NOT EXISTS evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  witness_id TEXT NOT NULL,
  table_number TEXT NOT NULL,
  municipality TEXT NOT NULL,
  polling_station TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('photo', 'video')),
  incident_id UUID REFERENCES incident_records(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE evidence_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users"
  ON evidence_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read for authenticated users"
  ON evidence_records FOR SELECT
  TO authenticated
  USING (true);
```

### 4. demo_timeline_events
Registra todos los eventos para el Control Room (opcional si ya existe).

```sql
CREATE TABLE IF NOT EXISTS demo_timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  municipality TEXT NOT NULL,
  polling_station TEXT NOT NULL,
  table_number TEXT NOT NULL,
  witness_name TEXT,
  description TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE demo_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users"
  ON demo_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read for authenticated users"
  ON demo_timeline_events FOR SELECT
  TO authenticated
  USING (true);
```

## Storage Bucket (Opcional)

Si deseas almacenar archivos de evidencia en Supabase Storage:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT DO NOTHING;
```

## Variables de Entorno

Asegúrate de que tu archivo `.env` contenga:

```
EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```
