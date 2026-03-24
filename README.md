# War Room D-Day

Este repositorio ahora contiene dos aplicaciones relacionadas del ecosistema War Room:

- `control-room`: la app web de monitoreo y centro de control, ubicada en la raiz del proyecto.
- `witness-app`: la app de testigos electorales, ubicada en [`witness-app`](/Users/juanvillalba/Downloads/warroom-d-day/witness-app).

## Estructura

- [package.json](/Users/juanvillalba/Downloads/warroom-d-day/package.json): scripts y configuracion del repo
- [src](/Users/juanvillalba/Downloads/warroom-d-day/src): codigo del Control Room
- [witness-app/package.json](/Users/juanvillalba/Downloads/warroom-d-day/witness-app/package.json): scripts y dependencias de la app de testigos
- [witness-app/app](/Users/juanvillalba/Downloads/warroom-d-day/witness-app/app): rutas Expo Router de la app de testigos

## Desarrollo

Instalar dependencias desde la raiz:

```bash
npm install
```

Levantar el centro de control:

```bash
npm run dev:control-room
```

Levantar la app de testigos:

```bash
npm run dev:witness
```

## Build

Build del centro de control:

```bash
npm run build:control-room
```

Build de la app de testigos:

```bash
npm run build:witness
```

## Variables de entorno

- El Control Room usa [.env](/Users/juanvillalba/Downloads/warroom-d-day/.env)
- La app de testigos usa [witness-app/.env](/Users/juanvillalba/Downloads/warroom-d-day/witness-app/.env)

## Despliegue en Vercel

Cada app debe desplegarse como proyecto separado en Vercel:

- `control-room`: root directory `.` y configuracion en [vercel.json](/Users/juanvillalba/Downloads/warroom-d-day/vercel.json)
- `witness-app`: root directory `witness-app` y configuracion en [witness-app/vercel.json](/Users/juanvillalba/Downloads/warroom-d-day/witness-app/vercel.json)

## Guia Exacta De Despliegue

### Proyecto 1: Control Room

1. En Vercel, crear un proyecto nuevo desde este mismo repositorio.
2. Asignar el nombre que quieras para el centro de control.
3. En `Root Directory`, dejar `.`.
4. Verificar estos valores:

```txt
Build Command: npm run build:control-room
Output Directory: dist
Install Command: npm install
```

5. Cargar estas variables de entorno:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_MAPBOX_TOKEN
```

6. Deploy.

### Proyecto 2: Witness App

1. En Vercel, crear otro proyecto nuevo desde este mismo repositorio.
2. Asignar el nombre que quieras para la app de testigos.
3. En `Root Directory`, seleccionar `witness-app`.
4. Verificar estos valores:

```txt
Build Command: npm run build:web
Output Directory: dist
Install Command: npm install
```

5. Cargar estas variables de entorno:

```txt
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

6. Deploy.

### Notas Operativas

- Ambas apps viven en el mismo repo, pero deben existir como proyectos separados en Vercel.
- El `control-room` compila con Vite y publica el `dist` de la raiz.
- `witness-app` compila con Expo web y publica el `dist` interno de [witness-app/dist](/Users/juanvillalba/Downloads/warroom-d-day/witness-app/dist).
- Si luego conectas dominios, puedes usar por ejemplo un subdominio para cada app.
