// Envuelve el mismo Express app de api-app.ts (usado tambien por server.ts en local)
// para correrlo como una funcion serverless de Netlify. Las variables de entorno
// (SUPABASE_URL, SUPABASE_KEY) las inyecta Netlify directamente, no hace falta dotenv aca.

import serverless from 'serverless-http';
import app from '../../api-app';

export const handler = serverless(app);
