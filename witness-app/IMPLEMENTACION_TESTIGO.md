# Implementación App Móvil Testigo - War Room

## ✅ IMPLEMENTACIÓN COMPLETA (v3.0 - Refactor Navegación)

### PRINCIPIOS NO NEGOCIABLES APLICADOS

1. ✅ **Navegación estándar de app móvil** - Drawer (menú hamburguesa) funcional
2. ✅ **El testigo NO opera el sistema** - Solo reporta hechos
3. ✅ **Toda evidencia pertenece a una incidencia** - NO existe "enviar evidencia" sin incidencia
4. ✅ **El testigo nunca cierra la mesa** - Solo hace check-in y check-out personal
5. ✅ **NO wizards** - Navegación libre entre secciones
6. ✅ **NO flujos encadenados** - Cada pantalla es accesible directamente

---

## 0. AUTENTICACIÓN (LOGIN)

### Pantalla única (sin menú)
- ✅ Input: Documento de identidad
- ✅ Validación contra `witnesses` (campaña activa)
- ✅ Sin registro, sin contraseña, sin recuperación
- ✅ Mensaje de error simple si no es válido
- ✅ Redirige a `/(drawer)/home` después del login

---

## 1. LAYOUT PRINCIPAL (POST-LOGIN)

### ESTRUCTURA DE NAVEGACIÓN: DRAWER (Menú Hamburguesa)

**Implementación:**
- ✅ Usa `expo-router/drawer` con `@react-navigation/drawer`
- ✅ Grupo de rutas: `app/(drawer)/`
- ✅ Header fijo personalizado en el drawer
- ✅ Navegación libre entre todas las secciones

### HEADER DEL DRAWER (siempre visible al abrir menú)
- ✅ Logo War Room
- ✅ Nombre del testigo
- ✅ Mesa asignada (número)
- ✅ Hora simulada (sincronizada cada 5s)

### MENÚ HAMBURGUESA - 4 OPCIONES:
1. ✅ **Inicio** (icono: Home)
2. ✅ **Reportar incidencia** (icono: FileWarning)
3. ✅ **Mi actividad** (icono: Activity)
4. ✅ **Cerrar sesión** (icono: LogOut, acción destructiva)

**CARACTERÍSTICAS:**
- ✅ Abre desde el ícono ☰ en el header de cada pantalla
- ✅ Permite navegación LIBRE entre secciones
- ✅ "Cerrar sesión" visible y funcional con confirmación
- ✅ NO oculto, NO reemplazado por botones sueltos
- ✅ Iconos con colores activo/inactivo

---

## 2. PANTALLAS (NO WIZARDS, NO FLUJOS SECUENCIALES)

### A. INICIO (`(drawer)/home.tsx`)

**Contenido:**
- ✅ Estado del testigo:
  - "No ha confirmado presencia"
  - "Presencia confirmada"
- ✅ Información de la mesa asignada
- ✅ Puesto de votación y municipio

**Acciones integradas (NO pantallas separadas):**
1. ✅ **"Confirmar presencia"** (solo si NO ha hecho check-in)
   - Acción directa con Alert de confirmación
   - Inserta en `presence_records`
   - Genera evento CHECK_IN
   - Se puede ejecutar solo una vez

2. ✅ **"Reportar una incidencia"** (siempre visible)
   - Navega a `(drawer)/report-incident`

3. ✅ **"Registrar mi salida"** (solo si YA hizo check-in)
   - Acción directa con Alert de confirmación
   - Actualiza `presence_records` con `checked_out_at`
   - Genera evento CHECK_OUT
   - Mensaje: "No cierra la mesa, solo tu retiro personal"

**Mensaje informativo:**
- ✅ "Toda incidencia debe estar acompañada de evidencia fotográfica"

---

### B. REPORTAR INCIDENCIA (`(drawer)/report-incident.tsx`)

**Una sola pantalla, sin pasos, sin wizard**

**Estructura:**
1. ✅ Dropdown CATEGORÍA (obligatorio)
2. ✅ Dropdown INCIDENCIA (dependiente de categoría)
3. ✅ Textarea DESCRIPCIÓN (solo si "Incidencia no catalogada", máx 240 caracteres)
4. ✅ EVIDENCIA fotográfica (SIEMPRE OBLIGATORIA)
5. ✅ Botón "Enviar incidencia"

**CATEGORÍAS (FIJAS, CONGELADAS):**

**A. Problemas operativos (6)**
1. Apertura tardía de la mesa ⚠️
2. No llegaron jurados electorales ⚠️
3. Material electoral incompleto ⚠️
4. Mesa no abrió ⚠️
5. Testigo no pudo ingresar ⚠️
6. Incidencia no catalogada ⚠️

**B. Restricción al testigo (6)**
1. No permiten observar el procedimiento ⚠️
2. No permiten tomar fotografías ⚠️
3. Testigo fue retirado ⚠️
4. Presión o intimidación ⚠️
5. Restricción durante escrutinio ⚠️
6. Incidencia no catalogada ⚠️

**C. Irregularidades en resultados (5)**
1. Conteo iniciado antes de la hora oficial ⚠️
2. Formulario E14 incompleto ⚠️
3. Formulario E14 alterado ⚠️
4. No permiten verificar el conteo ⚠️
5. Incidencia no catalogada ⚠️

⚠️ **TODAS requieren evidencia fotográfica obligatoria**

**Validación:**
- ✅ Categoría seleccionada
- ✅ Incidencia seleccionada
- ✅ Si "no catalogada": descripción obligatoria
- ✅ Al menos 1 foto capturada

**Al enviar:**
- ✅ Inserta en `incident_records`
- ✅ Asocia evidencia en `evidence_records`
- ✅ Genera evento INCIDENT en `demo_timeline_events`
- ✅ Confirmación clara y regresa automáticamente

---

### C. MI ACTIVIDAD (`(drawer)/my-activity.tsx`)

**Solo lectura - Log personal del testigo**

**Contenido:**
- ✅ CHECK_IN del testigo (si existe)
- ✅ Incidencias reportadas por ESTE testigo
- ✅ Evidencias enviadas (asociadas a incidencias)
- ✅ CHECK_OUT del testigo (si existe)
- ✅ Hora de cada evento
- ✅ Iconos y colores por tipo de evento

**NO muestra:**
- ❌ Eventos de otros testigos
- ❌ Opciones de edición
- ❌ Opciones de borrado
- ❌ Eventos del sistema no generados por el testigo

---

### D. CERRAR SESIÓN

**Funcionalidad:**
- ✅ Opción visible en el drawer
- ✅ Alert de confirmación antes de ejecutar
- ✅ Limpia sesión del contexto
- ✅ Limpia AsyncStorage
- ✅ Redirige a Login (`/`)

---

## 📁 ESTRUCTURA DE ARCHIVOS (REFACTOR v3.0)

### Raíz (app/)
```
app/
├── _layout.tsx              # Root layout con Stack y GestureHandler
├── index.tsx                # Login (sin menú)
├── +not-found.tsx           # 404
└── (drawer)/                # Grupo con Drawer Navigation
    ├── _layout.tsx          # Drawer config + custom header
    ├── home.tsx             # Inicio (con check-in/out integrados)
    ├── report-incident.tsx  # Reportar incidencia (una sola pantalla)
    └── my-activity.tsx      # Log personal
```

### Componentes (components/)
- `Header.tsx` - Header interno (no usado en drawer, deprecado)
- `WitnessHeader.tsx` - Header principal (no usado, info en drawer)
- `Logo.tsx` - Logo War Room con tamaños
- `Button.tsx` - Botón reutilizable

### Servicios (lib/)
- `supabase.ts` - Cliente Supabase
- `auth-service.ts` - Login, logout, gestión de sesión
- `simulation-service.ts` - Sincronización hora simulada

### Tipos (types/)
- `witness.ts` - Interfaces y catálogo de incidencias

### Contextos (contexts/)
- `WitnessContext.tsx` - Estado global (session, logout, updateStatus)

---

## 🗄️ TABLAS DE SUPABASE UTILIZADAS

### witnesses
- Autenticación por `document_number`
- Datos personales del testigo

### assignments
- Asignación de mesa al testigo
- Relación con polling_table, polling_place, municipality

### presence_records
```sql
campaign_id, assignment_id, witness_id
checked_in_at, checked_out_at
```

### incident_records
```sql
campaign_id, polling_table_id, witness_id
canonical_type (categoría), canonical_subtype (tipo específico)
description, occurred_at
```

### evidence_records
```sql
campaign_id, polling_table_id, witness_id
evidence_type ('photo')
file_uri, captured_at
related_incident_id (obligatorio - SIEMPRE asociado a incidencia)
```

### demo_timeline_events
```sql
campaign_id, event_type, scheduled_at
polling_table_id, witness_id
payload (jsonb)
```

**Tipos de eventos:**
- CHECK_IN
- CHECK_OUT
- INCIDENT

---

## ✅ VALIDACIÓN FINAL CUMPLIDA

### ✅ Menú hamburguesa existe y navega
- Drawer funcional con `expo-router/drawer`
- 4 opciones visibles: Inicio, Reportar incidencia, Mi actividad, Cerrar sesión
- Navegación libre entre secciones
- Iconos activos/inactivos

### ✅ "Cerrar sesión" funciona
- Visible en el drawer
- Alert de confirmación
- Limpia sesión y redirige a Login

### ✅ NO hay wizard alguno
- Todas las pantallas son independientes
- NO flujos paso a paso
- NO navegación forzada
- NO pantallas secuenciales obligatorias

### ✅ Cada sección es accesible directamente
- Desde el menú hamburguesa
- Sin pasar por otras pantallas
- Sin restricciones de flujo

---

## 🎯 CAMBIOS CLAVE - REFACTOR v3.0

### Eliminado completamente:
- ❌ Wizards y flujos guiados
- ❌ Pantallas `confirm-presence.tsx` y `checkout.tsx` separadas
- ❌ Navegación Stack individual por pantalla
- ❌ Headers personalizados por pantalla (reemplazados por drawer header)

### Implementado:
- ✅ **Drawer Navigation** (`@react-navigation/drawer`)
- ✅ **Menú hamburguesa funcional** con 4 opciones
- ✅ **Header en drawer** con logo, testigo, mesa, hora
- ✅ **Check-in y check-out integrados** en home con Alerts
- ✅ **Navegación libre** sin restricciones
- ✅ **GestureHandlerRootView** para soporte de gestos

### Mantenido (sin cambios):
- ✅ Login por documento
- ✅ Reportar incidencia en una sola pantalla
- ✅ Evidencia SIEMPRE obligatoria
- ✅ 17 incidencias catalogadas
- ✅ Mi actividad como log personal

---

## 🚀 ESTADO FINAL

**✅ 100% IMPLEMENTADO según prompt de refactor destructivo**

### Navegación:
- ✅ Menú hamburguesa funcional
- ✅ 4 opciones visibles y operativas
- ✅ Cerrar sesión con confirmación
- ✅ Navegación libre sin wizards
- ✅ Header con info del testigo en el drawer

### Funcionalidad:
- ✅ Login operativo
- ✅ Check-in integrado con Alert
- ✅ Check-out integrado con Alert
- ✅ Reportar incidencia (una sola pantalla)
- ✅ Evidencia SIEMPRE obligatoria
- ✅ Log personal visible
- ✅ Sincronización con Control Room

### Técnico:
- ✅ TypeScript sin errores
- ✅ PWA mobile-first
- ✅ Drawer navigation con expo-router
- ✅ GestureHandler configurado
- ✅ Contexto de sesión operativo

**La aplicación tiene ahora una navegación estándar de app móvil profesional, sin wizards, sin flujos forzados, lista para uso real en el Día D.**
