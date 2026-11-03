// Servidor de desarrollo local: la API de api-app.ts mas el frontend servido por Vite.
// En produccion (Netlify) no se usa: el frontend es estatico y la API corre en netlify/functions/api.ts.

// Cargar variables de entorno ANTES de importar cualquier modulo que las lea a nivel top-level
// (los imports de ES modules se evaluan en orden, asi que esto tiene que ir primero).
import 'dotenv/config';

import { createServer as createViteServer } from 'vite';
import app from './api-app';

const PORT = 3000;

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Nutri Count is running live at http://localhost:${PORT}`);
  });
}

startServer();
