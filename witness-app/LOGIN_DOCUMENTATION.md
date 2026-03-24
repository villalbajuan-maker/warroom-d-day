# Sistema de Login por Documento - War Room Testigo

## Implementación Completada

Se ha implementado exitosamente el sistema de autenticación por número de documento para testigos electorales.

## Características Implementadas

### 1. Autenticación por Documento
- Login mediante número de documento (sin email ni password)
- Validación contra la tabla `witnesses` en Supabase
- Verificación automática de asignación de mesa
- Carga de contexto operativo completo

### 2. Estructura de Datos
Se conecta con las siguientes tablas de Supabase:
- `witnesses` - Datos del testigo
- `assignments` - Asignación de mesa
- `territorial_polling_tables` - Mesa electoral
- `territorial_polling_places` - Puesto de votación
- `territorial_municipalities` - Municipio
- `territorial_departments` - Departamento

### 3. Flujo de Login

**Pantalla de Login (`app/index.tsx`)**
- Campo único: número de documento
- Teclado numérico
- Botón "Ingresar"
- Loading state durante autenticación
- Manejo de errores claros

**Validaciones**
1. Busca testigo por `document_number`
2. Valida que tenga asignación activa
3. Carga datos territoriales (mesa, puesto, municipio, departamento)
4. Crea sesión completa
5. Guarda en localStorage

**Mensajes de Error**
- "Documento no encontrado en esta campaña"
- "Este testigo no tiene una mesa asignada"
- Errores de conexión y carga de datos

### 4. Gestión de Sesión

**WitnessContext (`contexts/WitnessContext.tsx`)**
- Maneja sesión global del testigo
- Persistencia en localStorage
- Funciones:
  - `setSession()` - Establecer sesión
  - `updateStatus()` - Actualizar estado
  - `logout()` - Cerrar sesión
  - `isLoading` - Estado de carga

**Servicio de Autenticación (`lib/auth-service.ts`)**
- `authenticateByDocument()` - Login por documento
- `saveSession()` - Guardar sesión
- `loadSession()` - Cargar sesión guardada
- `clearSession()` - Limpiar sesión

### 5. Pantallas Actualizadas

Todas las pantallas ahora usan `session` en lugar de datos mock:

- **Home** - Muestra datos reales del testigo y mesa
- **Confirm Presence** - Registra en `presence_records` y `demo_timeline_events`
- **Report Incident** - Registra en `incident_records` con estructura correcta
- **Send Evidence** - Registra en `evidence_records` con metadata
- **Close Table** - Registra cierre oficial de mesa

### 6. Estructura de Datos de Sesión

```typescript
{
  witness: {
    id: string,
    campaign_id: string,
    document_number: string,
    full_name: string,
    phone: string,
    whatsapp: string,
    email: string | null,
    role: string
  },
  assignment: {
    id: string,
    witness_id: string,
    polling_table_id: string,
    polling_place_id: string,
    municipality_id: string,
    department_id: string
  },
  polling_table: {
    id: string,
    table_number: number
  },
  polling_place: {
    id: string,
    name: string,
    address: string | null
  },
  municipality: {
    id: string,
    name: string
  },
  department: {
    id: string,
    name: string
  },
  campaign_id: string,
  status: 'not_started' | 'present' | 'incident_reported' | 'closed'
}
```

### 7. Inserciones a Base de Datos

**Presence Records**
```sql
INSERT INTO presence_records (
  campaign_id,
  assignment_id,
  checked_in_at
)
```

**Incident Records**
```sql
INSERT INTO incident_records (
  campaign_id,
  polling_table_id,
  witness_id,
  canonical_type,
  canonical_subtype,
  description,
  occurred_at
)
```

**Evidence Records**
```sql
INSERT INTO evidence_records (
  campaign_id,
  polling_table_id,
  witness_id,
  evidence_type,
  file_uri,
  file_hash,
  file_mime_type,
  file_size_bytes,
  captured_at
)
```

**Timeline Events**
```sql
INSERT INTO demo_timeline_events (
  campaign_id,
  event_type,
  scheduled_at,
  polling_table_id,
  witness_id,
  payload
)
```

## Seguridad

- NO usa Supabase Auth
- NO crea usuarios automáticamente
- Validación estricta por documento
- Sesión en localStorage (no persistente largas duraciones)
- Redirección automática si no hay sesión

## Restricciones

- Un testigo SOLO ve su mesa
- Un testigo SOLO puede reportar para su mesa
- No hay registro público
- No hay edición de datos personales
- Logout manual disponible via context

## Pruebas

Para probar el login:
1. Tener un testigo en la tabla `witnesses` con `document_number`
2. Ese testigo debe tener un registro en `assignments`
3. Ingresar el documento en la pantalla de login
4. El sistema validará y cargará todos los datos

## Compilación

✅ TypeScript: Sin errores
✅ Todas las pantallas actualizadas
✅ Contexto global funcional
✅ Persistencia de sesión implementada
