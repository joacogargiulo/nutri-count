/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Express app con las rutas /api/*, sin app.listen() ni middlewares de Vite/estaticos.
// La usa tanto server.ts (desarrollo local / hosting Node tradicional) como
// netlify/functions/api.ts (produccion en Netlify, via serverless-http).

import express from 'express';
import { db } from './src/service/db';
import { UserRole } from './src/types';

const app = express();

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
    const { hash_contrasena, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error de servidor' });
  }
});

// Registrar cuenta (nutricionista o paciente)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol, nombre_usuario, fecha_nacimiento, genero } = req.body;
    if (!nombre || !apellido || !email || !password || !rol || !nombre_usuario || !fecha_nacimiento || !genero) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el registro (Nombre de usuario, Fecha de nacimiento y Género son requeridos)' });
    }
    if (rol !== UserRole.NUTRICIONISTA && rol !== UserRole.PACIENTE) {
      return res.status(400).json({ error: 'El rol especificado es inválido' });
    }
    const result = await db.register(nombre, apellido, email, password, rol, nombre_usuario, genero, fecha_nacimiento);
    if (!result.success || !result.user) {
      return res.status(409).json({ error: result.error });
    }
    const { hash_contrasena, ...safeUser } = result.user;
    res.json({ user: safeUser });
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
    const patients = await db.getPatients(Number(nutricionistaId));
    res.json({ patients: patients.map(({ hash_contrasena, ...p }) => p) });
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
    if (!result.success || !result.patient) {
      return res.status(400).json({ error: result.error });
    }
    const { hash_contrasena, ...safePatient } = result.patient;
    res.json({ patient: safePatient });
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
    const plan = await db.getPatientPlan(Number(patientId));
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
    const result = await db.savePatientPlan(patientId, nutricionistaId, planDetails);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ plan: result.plan });
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
    const ingestas = await db.getPatientIngestas(Number(patientId), date);
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
    const success = await db.deleteIngesta(Number(id));
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
    const { nombre_alimento, calorias, proteinas, carbohidratos, grasas, medida_cantidad, medida_unidad, origen } = req.body;
    if (!nombre_alimento || calorias === undefined || proteinas === undefined || carbohidratos === undefined || grasas === undefined) {
      return res.status(400).json({ error: 'Faltan campos sobre el alimento' });
    }
    const aliment = await db.addAlimento({
      nombre_alimento,
      calorias: Number(calorias),
      proteinas: Number(proteinas),
      carbohidratos: Number(carbohidratos),
      grasas: Number(grasas),
      medida_cantidad: Number(medida_cantidad || 100),
      medida_unidad: medida_unidad || 'g',
      origen: origen || 'Local'
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

    // First check if this exact barcode already exists in local DB to avoid duplicating, otherwise return it
    const existing = await db.getAlimentoByBarcode(code);

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
      medida_unidad: 'g',
      codigo_barras: code,
      origen: 'OpenFoodFacts'
    });

    res.json({ alimento: newAlimento, isNew: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor consultando código de barra' });
  }
});

export default app;
