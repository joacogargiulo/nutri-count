# Guía de Arquitectura, Configuración y Despliegue de Nutri Count

Este proyecto, **Nutri Count**, fue desarrollado como resultado del análisis del documento del **Taller Integrador III (Grupo de Gonella)**. Consiste en una plataforma bidireccional (Nutricionista - Paciente) para la gestión del seguimiento calórico y macronutricional diario en tiempo real.

---

## 🏛️ Arquitectura del Sistema

Aplicación web de tres capas: una SPA en React, una API REST en Express y una base PostgreSQL en Supabase. En producción la API corre como función serverless de Netlify (el mismo `api-app.ts` que usa el servidor local).

```
 ┌────────────────────────────────────────────────────────┐
 │                   FRONTEND (navegador)                 │
 │      React 19 + Tailwind CSS 4 + Lucide + html5-qrcode │
 └───────────────────────────┬────────────────────────────┘
                             │  HTTPS  /api/*  (Authorization: Bearer <token>)
 ┌───────────────────────────▼────────────────────────────┐
 │  BACKEND  api-app.ts (Express)                         │
 │  local: server.ts  ·  Netlify: netlify/functions/api.ts│
 │  autenticación (token firmado), autorización por rol y │
 │  vínculo, validaciones, reglas de negocio              │
 └──────────────┬─────────────────────────┬───────────────┘
                │ supabase-js             │ HTTPS
 ┌──────────────▼──────────────┐ ┌────────▼────────────────┐
 │ SUPABASE (PostgreSQL)       │ │ Open Food Facts (API    │
 │ docs/DB_SCHEMA.sql          │ │ pública, códigos barras)│
 └─────────────────────────────┘ └─────────────────────────┘
```

### Tecnologías Aplicadas:
- **Frontend**: React 19, Tailwind CSS 4, Lucide-React (iconos) y `html5-qrcode` (lector de códigos de barras con la cámara).
- **Backend**: Express (Node.js) con TypeScript (`tsx` en desarrollo), `bcryptjs` para el hash de contraseñas y `serverless-http` para Netlify.
- **Integraciones externas**: API de **Open Food Facts** para identificar productos por código de barras (RF-05). El producto consultado se guarda en `Alimentos` para no volver a consultarlo.
- **Base de Datos**: Supabase PostgreSQL con claves foráneas, restricciones `CHECK`/`UNIQUE` e índices (ver `docs/DB_SCHEMA.sql`).

### Seguridad
- Al iniciar sesión o registrarse, la API devuelve un **token firmado (HMAC-SHA256, 7 días)** que el frontend envía en cada petición. El secreto sale de `AUTH_SECRET` si está definida; si no, se deriva de `SUPABASE_KEY`.
- Cada ruta valida el rol y la pertenencia de los datos: un paciente solo accede a lo suyo; un nutricionista, a pacientes con vínculo activo.
- Las contraseñas se guardan con bcrypt; el hash nunca sale de la API.

---

## 🛠️ Configuración de Supabase (Base de Datos Relacional)

Para poder integrar la base de datos Supabase en el proyecto de producción, siga estos sencillos pasos:

1. **Crear Proyecto en Supabase**:
   - Inicie sesión en [supabase.com](https://supabase.com).
   - Cree un nuevo proyecto e introduzca el nombre, contraseña e indique la ubicación del servidor.

2. **Ejecutar el Schema de la Base de Datos**:
   - Vaya a la pestaña **SQL Editor** del dashboard de su proyecto Supabase.
   - Abra un nuevo Query, copie y pegue el contenido completo de `docs/DB_SCHEMA.sql` y haga clic en **Run**.
   - Esto creará automáticamente las tablas, llaves foráneas, restricciones únicas e índices necesarios.

3. **Configurar Variables de Entorno**:
   - Edite/Cree un archivo `.env` en la raíz del proyecto para definir las credenciales:
     ```env
     # Supabase Configuration
     SUPABASE_URL="https://tu-proyecto-id.supabase.co"
     SUPABASE_KEY="tu-anon-public-key-de-supabase"
     ```
   - Ambas variables son **obligatorias**: sin ellas el servidor no arranca (no existe modo en memoria).
   - Opcional: `AUTH_SECRET` para firmar los tokens de sesión con un secreto propio.
   - En Netlify se cargan en *Site configuration → Environment variables*.

4. **Base ya creada (migración)**: `DB_SCHEMA.sql` borra y recrea todo. Para una base con datos, ejecutar en su lugar `docs/MIGRACION_restricciones.sql`, que solo agrega restricciones e índices.
   - Un proyecto gratuito de Supabase se **pausa por inactividad**: si la app deja de responder, restaurarlo desde el dashboard.

---

## 🚀 Cómo Iniciar la Aplicación

### Requisitos:
- Node.js instalado (v18 o superior recomendado)

### Comandos de Ejecución:
En el terminal de la raíz del proyecto, ejecute:

```bash
# instalar dependencias
npm install

# iniciar servidor de desarrollo en puerto 3000 (Express + Vite)
npm run dev

# compilar para producción
npm run build

# iniciar servidor de producción
npm run start
```

---

## 📖 Casos de Uso Cubiertos

El sistema cumple rigurosamente con los requerimientos de la materia **Taller Integrador III**:

1. **RF-01: Gestión de Cuentas**: Ofrece formularios estéticos e independientes de inicio de sesión y registro de cuentas (Paciente o Nutricionista). El rol se guarda en la base (`Relacion_Rol_Usuario`) y la interfaz muestra el panel de nutricionista o de paciente según corresponda.
2. **RF-02: Vinculación Profesional-Paciente**: Los Nutricionistas disponen de un módulo interactivo para buscar y vincular pacientes registrados de forma directa introduciendo su correo electrónico.
3. **RF-03: Prescripción de Metas y Objetivos**: El profesional puede seleccionar cualquier paciente vinculado, consultar su estado y prescribir un Plan Nutricional con fecha de inicio, fecha de fin y metas específicas de Calorías (kcal), Proteínas (g), Carbohidratos (g) y Grasas (g).
4. **RF-04 & RF-06: Portal de Carga Alimentaria**: Los pacientes pueden buscar comidas dentro de un catálogo precargado y registrar la cantidad consumida en gramos, calculando proporcionalmente y al instante la ingesta calórica y la masa de cada macronutriente.
5. **RF-05: Escaneo de Códigos de Barra**: Integración real con la API internacional de **Open Food Facts** para leer un código de barras y descargar su información nutricional directa. Se usa la cámara del dispositivo (requiere HTTPS o `localhost`) y se ofrecen códigos de prueba para la demo.
6. **RF-07: Dashboard y Semáforos**: Representaciones visuales de progreso calórico diario en forma de gráficos y anillos de objetivos. Los nutricionistas ven la lista completa de sus pacientes vinculados decorada con un sistema de alarma semafórica que indica en rojo, amarillo o verde el cumplimiento del progreso calórico del paciente.
