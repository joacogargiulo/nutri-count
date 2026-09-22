# Guía de Arquitectura, Configuración y Despliegue de Nutri Count

Este proyecto, **Nutri Count**, fue desarrollado como resultado del análisis del documento del **Taller Integrador III (Grupo de Gonella)**. Consiste en una plataforma bidireccional (Nutricionista - Paciente) para la gestión del seguimiento calórico y macronutricional diario en tiempo real.

---

## 🏛️ Arquitectura del Sistema

El sistema implementa una **arquitectura híbrida fullstack** para garantizar una experiencia interactiva sin fricciones, adaptada tanto para simulaciones académicas inmediatas en entornos de prueba (*Vite Live Server*) como para producción con persistencia en la nube (**Supabase PostgreSQL**).

```
 ┌────────────────────────────────────────────────────────┐
 │                   FRONTEND CLIENT                      │
 │   React 19 + Tailwind CSS + Lucide Icons + Motion      │
 └───────────────────────────┬────────────────────────────┘
                             │
                  Peticiones HTTP (REST API)
                             │
 ┌───────────────────────────▼────────────────────────────┐
 │                     BACKEND SERVER                     │
 │          Express (NodeJS) + tsx / esbuild              │
 └───────────────────────────┬────────────────────────────┘
                             │
              ¿Están configuradas las claves?
                             │
              ┌──────────────┴──────────────┐
              │ Sí                          │ No
    ┌─────────▼─────────┐         ┌─────────▼─────────┐
    │     SUPABASE      │         │ STATEful MEMORY   │
    │   PostgreSQL DB   │         │ (Preview Engine)  │
    └───────────────────┘         └───────────────────┘
```

### Tecnologías Aplicadas:
- **Frontend**: React 19, Tailwind CSS (para diseño adaptativo y responsive), Lucide-React para iconografía unificada y Motion para microinteracciones fluidas.
- **Backend**: Express (Node.js) con soporte de compilación y empaquetamiento optimizado mediante `esbuild` y `tsx`.
- **Integraciones externas**: API de **Open Food Facts** para la consulta automatizada y normalización del código de barras (RF-05).
- **Base de Datos**: Supabase PostgreSQL con soporte de restricciones de unicidad e índices para optimizaciones de consultas de ingesta.

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
   - Si no define estas variables, el servidor Express activará automáticamente el motor de datos **Stateful Memory Fallback**. Esto garantiza que todas las transacciones (registro, carga manual, vinculación y escaneo de barra) sigan funcionando de forma dinámica persistiendo los cambios en tiempo de ejecución.

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

1. **RF-01: Gestión de Cuentas**: Ofrece formularios estéticos e independientes de inicio de sesión y registro de cuentas (Paciente o Nutricionista). El sistema de login detecta de forma autónoma el rol y despliega las portadas y workflows correspondientes.
2. **RF-02: Vinculación Profesional-Paciente**: Los Nutricionistas disponen de un módulo interactivo para buscar y vincular pacientes registrados de forma directa introduciendo su correo electrónico.
3. **RF-03: Prescripción de Metas y Objetivos**: El profesional puede seleccionar cualquier paciente vinculado, consultar su estado y prescribir un Plan Nutricional con fecha de inicio, fecha de fin y metas específicas de Calorías (kcal), Proteínas (g), Carbohidratos (g) y Grasas (g).
4. **RF-04 & RF-06: Portal de Carga Alimentaria**: Los pacientes pueden buscar comidas dentro de un catálogo precargado y registrar la cantidad consumida en gramos, calculando proporcionalmente y al instante la ingesta calórica y la masa de cada macronutriente.
5. **RF-05: Escaneo de Códigos de Barra**: Integración real con la API internacional de **Open Food Facts** para leer un código de barras y descargar su información nutricional directa. Se ofrece un simulador interactivo de cámara y códigos de barras integrados.
6. **RF-07: Dashboard y Semáforos**: Representaciones visuales de progreso calórico diario en forma de gráficos y anillos de objetivos. Los nutricionistas ven la lista completa de sus pacientes vinculados decorada con un sistema de alarma semafórica que indica en rojo, amarillo o verde el cumplimiento del progreso calórico del paciente.
