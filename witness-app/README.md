# War Room · Testigo

Aplicación móvil PWA para testigos electorales del sistema War Room.

## Características

- **Mobile First**: Diseñada exclusivamente para dispositivos móviles
- **PWA**: Se puede instalar en iOS y Android vía "Agregar a pantalla de inicio"
- **Tiempo Real**: Conectada a Supabase, alimenta el Control Room instantáneamente
- **Offline Ready**: Cola de envío básica si se pierde conexión

## Pantallas

1. **Bienvenida/Identificación**: Muestra datos del testigo asignado
2. **Estado de Mesa**: Pantalla principal con acciones disponibles
3. **Confirmar Presencia**: Registro de check-in del testigo
4. **Reportar Incidencia**: Catálogo de incidencias críticas
5. **Enviar Evidencia**: Captura de fotos/videos
6. **Cierre de Mesa**: Finalización oficial de la jornada

## Tecnologías

- **React Native + Expo Router**: Framework móvil
- **TypeScript**: Tipado estático
- **Supabase**: Base de datos y autenticación
- **PWA**: Progressive Web App

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build Web

```bash
npm run build:web
```

## Configuración de Supabase

Consulta `SUPABASE_SETUP.md` para las instrucciones de configuración de tablas.

## Identidad Visual

- **Fondo**: #0A0B0D (Negro profundo)
- **Texto**: #E5E5E5 (Gris claro)
- **Crítico**: #7A1515 (Rojo War Room)
- **Éxito**: #10B981 (Verde)
- **Alerta**: #FCD34D (Amarillo)

## Tipos de Eventos

La app genera estos eventos en tiempo real:

- `CHECK_IN`: Confirmación de presencia
- `INCIDENT`: Reporte de incidencia
- `EVIDENCE`: Envío de evidencia
- `TABLE_CLOSE`: Cierre de mesa

## Notas Importantes

- La app NO muestra resultados al testigo
- El testigo SOLO reporta, no consulta
- Diseñada para uso con una sola mano
- Sin capacitación previa necesaria
- Funciona bajo presión y con mala señal
