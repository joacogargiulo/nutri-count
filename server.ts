/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './src/service/db';
import { UserRole } from './src/types';

// Load environmental variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body-parser
  app.use(express.json());

  // ==================== API ROUTES ====================

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', supabaseConfigured: db.isSupabaseConfigured() });
  });

  // Authenticacion login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Faltan credenciales' });
      }
      const user = await db.authenticate(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      res.json({ user });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error de servidor' });
    }
  });

  // Registrar cuenta (nutricionista o paciente)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { nombre, apellido, email, password, rol, dni, fecha_nacimiento, genero } = req.body;
      if (!nombre || !apellido || !email || !password || !rol || !dni || !fecha_nacimiento || !genero) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para el registro (DNI, Fecha de nacimiento y Género son requeridos)' });
      }
      if (rol !== UserRole.NUTRICIONISTA && rol !== UserRole.PACIENTE) {
        return res.status(400).json({ error: 'El rol especificado es inválido' });
      }
      const user = await db.register(nombre, apellido, email, password, rol, genero, dni, fecha_nacimiento);
      res.json({ user });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error de servidor' });
    }
  });

  // Obtener pacientes del nutricionista
  app.get('/api/patients', async (req, res) => {
    try {
      const { nutricionistaId } = req.query;
      if (!nutricionistaId || typeof nutricionistaId !== 'string') {
        return res.status(400).json({ error: 'Falta ID de nutricionista' });
      }
      const patients = await db.getPatients(nutricionistaId);
      res.json({ patients });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Vincular paciente
  app.post('/api/patients/link', async (req, res) => {
    try {
      const { nutricionistaId, email } = req.body;
      if (!nutricionistaId || !email) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      const result = await db.linkPatient(nutricionistaId, email.trim());
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      res.json({ patient: result.patient });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Dar de baja un paciente
  app.post('/api/patients/unlink', async (req, res) => {
    try {
      const { nutricionistaId, patientId } = req.body;
      if (!nutricionistaId || !patientId) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }
      console.log(`[API POST /api/patients/unlink] nutricionistaId=${nutricionistaId}, patientId=${patientId}`);
      const result = await db.unlinkPatient(nutricionistaId, patientId);
      console.log(`[API POST /api/patients/unlink] Result:`, result);
      if (!result.success) {
        return res.status(400).json({ error: result.error || 'No se pudo realizar la baja' });
      }
      res.json(result);
    } catch (e: any) {
      console.error(`[API POST /api/patients/unlink] Error:`, e);
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Obtener plan de nutricion activo del paciente
  app.get('/api/plans', async (req, res) => {
    try {
      const { patientId } = req.query;
      if (!patientId || typeof patientId !== 'string') {
        return res.status(400).json({ error: 'Falta ID de paciente' });
      }
      const plan = await db.getPatientPlan(patientId);
      res.json({ plan });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Guardar Plan de Nutricion
  app.post('/api/plans', async (req, res) => {
    try {
      const { patientId, nutricionistaId, planDetails } = req.body;
      if (!patientId || !nutricionistaId || !planDetails) {
        return res.status(400).json({ error: 'Faltan parámetros del plan' });
      }
      const plan = await db.savePatientPlan(patientId, nutricionistaId, planDetails);
      res.json({ plan });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Obtener registros de alimento (Ingestas) de un paciente para una fecha
  app.get('/api/ingestas', async (req, res) => {
    try {
      const { patientId, date } = req.query;
      if (!patientId || !date || typeof patientId !== 'string' || typeof date !== 'string') {
        return res.status(400).json({ error: 'ID de paciente y fecha "YYYY-MM-DD" son requeridos' });
      }
      const ingestas = await db.getPatientIngestas(patientId, date);
      res.json({ ingestas });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Registrar ingesta (Agregar comida consumida)
  app.post('/api/ingestas', async (req, res) => {
    try {
      const { patientId, id_plan, id_alimento, cantidad, tipo_comida, fecha_hora_consumo } = req.body;
      if (!patientId || !id_alimento || !cantidad || !tipo_comida || !fecha_hora_consumo) {
        return res.status(400).json({ error: 'Faltan campos para registrar comida' });
      }
      const ingesta = await db.addIngesta(patientId, {
        id_plan,
        id_alimento,
        cantidad,
        tipo_comida,
        fecha_hora_consumo
      });
      res.json({ ingesta });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Eliminar un registro de ingesta por ID
  app.delete('/api/ingestas/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const success = await db.deleteIngesta(id);
      if (!success) {
        return res.status(404).json({ error: 'Registro de ingesta no encontrado' });
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Obtener catalogo de alimentos disponibles localmente
  app.get('/api/alimentos', async (req, res) => {
    try {
      const alimentos = await db.getAlimentos();
      res.json({ alimentos });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Dar de alta un nuevo alimento
  app.post('/api/alimentos', async (req, res) => {
    try {
      const { id_alimento, nombre_alimento, calorias, proteinas, carbohidratos, grasas, medida_cantidad, medida_unidad } = req.body;
      if (!nombre_alimento || calorias === undefined || proteinas === undefined || carbohidratos === undefined || grasas === undefined) {
        return res.status(400).json({ error: 'Faltan campos sobre el alimento' });
      }
      const aliment = await db.addAlimento({
        id_alimento,
        nombre_alimento,
        calorias: Number(calorias),
        proteinas: Number(proteinas),
        carbohidratos: Number(carbohidratos),
        grasas: Number(grasas),
        medida_cantidad: Number(medida_cantidad || 100),
        medida_unidad: medida_unidad || 'g'
      });
      res.json({ alimento: aliment });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Error' });
    }
  });

  // Escaneo de Producto mediante código de barra
  // Realiza una petición a la API externa (Open Food Facts)
  app.get('/api/barcode/:code', async (req, res) => {
    try {
      const { code } = req.params;
      if (!code) {
        return res.status(400).json({ error: 'El código de barras es requerido' });
      }

      console.log(`[API] Buscando código de barra en Open Food Facts: ${code}`);
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      if (!response.ok) {
        return res.status(400).json({ error: 'Error consultando la API de Open Food Facts' });
      }

      const data: any = await response.json();
      if (!data || data.status === 0 || !data.product) {
        return res.status(444).json({ error: 'Producto no identificado' });
      }

      const product = data.product;
      const nutriments = product.nutriments || {};

      // Formulate standard Alimento from returned Open Food Facts structure
      // OFFs has values listed /100g, let's normalize to standard measure_qty: 100g
      const nombre = product.product_name_es || product.product_name || `Producto Envasado (${code})`;
      const calorias_100g = Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0);
      const proteinas_100g = Number((nutriments['proteins_100g'] || 0).toFixed(1));
      const carbs_100g = Number((nutriments['carbohydrates_100g'] || 0).toFixed(1));
      const grasas_100g = Number((nutriments['fat_100g'] || 0).toFixed(1));

      // First check if this nourishment already exists in local DB to avoid duplicating, otherwise return it
      const localAlimentos = await db.getAlimentos();
      const existing = localAlimentos.find(a => 
        a.nombre_alimento.toLowerCase() === nombre.toLowerCase() && 
        a.calorias === calorias_100g
      );

      if (existing) {
        return res.json({ alimento: existing, isNew: false });
      }

      // Add to local list dynamically, returning the new ID
      const newAlimento = await db.addAlimento({
        nombre_alimento: nombre,
        calorias: calorias_100g,
        proteinas: proteinas_100g,
        carbohidratos: carbs_100g,
        grasas: grasas_100g,
        medida_cantidad: 100,
        medida_unidad: 'g'
      });

      res.json({ alimento: newAlimento, isNew: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Error del servidor consultando código de barra' });
    }
  });


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
