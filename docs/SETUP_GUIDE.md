# Guía de instalación de Nutri Count

La descripción del sistema, la arquitectura y el modelo de datos están en el documento técnico del proyecto. Esta guía solo explica cómo ponerlo en marcha.

## 1. Base de datos (Supabase)

1. Crear un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecutar completo `docs/DB_SCHEMA.sql`. Crea las tablas, claves, restricciones e índices. Borra y recrea todo, así que solo se usa en una base nueva.
3. Ejecutar `docs/SEED_ALIMENTOS.sql` para cargar el catálogo inicial de alimentos.

Un proyecto gratuito de Supabase se pausa por inactividad. Si la app deja de responder, restaurarlo desde el panel de Supabase.

## 2. Variables de entorno

Crear un archivo `.env` en la raíz (ver `.env.example`):

```env
SUPABASE_URL="https://tu-proyecto-id.supabase.co"
SUPABASE_KEY="tu-clave-de-supabase"
# Opcional: secreto propio para firmar los tokens de sesión
# AUTH_SECRET=""
```

`SUPABASE_URL` y `SUPABASE_KEY` son obligatorias: sin ellas el servidor no arranca. En Netlify se cargan en *Site configuration → Environment variables*.

## 3. Ejecutar en local

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev     # API y frontend en http://localhost:3000
```

## 4. Despliegue en Netlify

`netlify.toml` ya está configurado: `npm run build` genera el frontend en `dist/` y la API corre como función (`netlify/functions/api.ts`). Las rutas `/api/*` se redirigen a esa función.
