/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Cargar variables de entorno ANTES de importar cualquier modulo que las lea a nivel top-level
// (los imports de ES modules se evaluan en orden, asi que esto tiene que ir primero).
import 'dotenv/config';

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './api-app';

const PORT = 3000;

async function startServer() {
  // ==================== FRONTEND SERVER MIDDLEWARES ====================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support catchall router fallback for Express v4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Nutri Count is running live at http://localhost:${PORT}`);
  });
}

startServer();
