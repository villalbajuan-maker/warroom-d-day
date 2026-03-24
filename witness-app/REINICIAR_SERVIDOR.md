# ⚠️ IMPORTANTE: Necesitas reiniciar el servidor de desarrollo

## Problema detectado

La aplicación está usando una URL antigua (`0ec90b57d6e95fcbda19832f.supabase.co`) que está en caché del servidor de desarrollo.

Los archivos de configuración están correctos con:
- ✅ URL: `https://mefbodbwqrbzdnvfvwfx.supabase.co`
- ✅ Anon Key: Correcta

Pero el servidor de desarrollo necesita reiniciarse para cargar la nueva configuración.

## Cómo reiniciar el servidor

### Opción 1: Desde la terminal
1. Presiona `Ctrl+C` en la terminal donde está corriendo el servidor
2. Espera a que se detenga completamente
3. Ejecuta nuevamente: `npm run dev`

### Opción 2: Si estás en Bolt
1. Detén el preview
2. Limpia el cache del navegador
3. Vuelve a iniciar el preview

### Opción 3: Hard refresh completo
1. Cierra todas las pestañas del preview
2. Limpia el cache del navegador (Ctrl+Shift+Del)
3. Abre nuevamente la aplicación

## Verificación después de reiniciar

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Deberías ver este mensaje al cargar:
   ```
   [SUPABASE] Config loaded: {
     finalUrl: 'https://mefbodbwqrbzdnvfvwfx.supabase.co',
     ...
   }
   ```

4. Ingresa el documento: `1045678912`
5. Deberías ver este request exitoso:
   ```
   GET https://mefbodbwqrbzdnvfvwfx.supabase.co/rest/v1/witnesses?select=*&document_number=eq.1045678912
   ```

## Si persiste el error

Si después de reiniciar sigue apareciendo la URL antigua (`0ec90b57d6e95fcbda19832f`), significa que hay otro lugar donde está cacheada. En ese caso:

1. Borra la carpeta `.expo` si existe:
   ```bash
   rm -rf .expo
   ```

2. Borra node_modules y reinstala:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Reinicia el servidor nuevamente

## Documentos válidos para probar

Una vez que el servidor esté reiniciado y la URL sea la correcta:

- `1023456789` → Juan David Gómez Restrepo
- `1034567891` → María Fernanda Londoño Ruiz
- `1045678912` → Carlos Andrés Mejía Torres

Todos estos documentos existen en la base de datos y deberían funcionar.
