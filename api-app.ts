// Express app con las rutas /api/*, sin app.listen() ni middlewares de Vite/estaticos.
// La usa tanto server.ts (desarrollo local / hosting Node tradicional) como
// netlify/functions/api.ts (produccion en Netlify, via serverless-http).

import express, { Request, Response, NextFunction } from 'express';
import { db } from './src/service/db';
import { createToken, requireAuth } from './src/service/auth';
import { UserRole, TIPOS_COMIDA, TipoComida } from './src/types';

const app = express();

app.use(express.json());

// ==================== HELPERS ====================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const GENEROS = ['Masculino', 'Femenino', 'Otro', 'No especificado'];

const isId = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;
const toId = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return isId(n) ? n : null;
};
const isNum = (v: unknown, min: number, max: number, inclusiveMin = true): v is number =>
  typeof v === 'number' && Number.isFinite(v) && (inclusiveMin ? v >= min : v > min) && v <= max;
const isDate = (v: unknown): v is string => {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().startsWith(v);
};

const normalizeEmail = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

// Envuelve un handler async: cualquier excepcion se loguea y responde 500 sin filtrar detalles internos.
const route = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response) => {
    fn(req, res).catch((e: any) => {
      console.error(`[API ${req.method} ${req.path}]`, e);
      if (!res.headersSent) res.status(500).json({ error: 'Error interno del servidor' });
    });
  };

const isNutri = (req: Request) => req.auth?.rol === UserRole.NUTRICIONISTA;
const isPaciente = (req: Request) => req.auth?.rol === UserRole.PACIENTE;

// Un paciente solo accede a sus propios datos; un nutricionista, a los de pacientes con vinculo activo.
async function canAccessPatient(req: Request, patientId: number): Promise<boolean> {
  if (isPaciente(req)) return req.auth!.id === patientId;
  return db.hasActiveLink(req.auth!.id, patientId);
}

// Rango [desde, hasta) en UTC del dia local del cliente. `tz` es Date.getTimezoneOffset() (minutos, UTC-3 => 180).
function dayRange(date: string, tzParam: unknown): { desde: string; hasta: string } {
  const tz = Math.max(-840, Math.min(840, Math.trunc(Number(tzParam) || 0)));
  const start = new Date(`${date}T00:00:00Z`).getTime() + tz * 60000;
  return { desde: new Date(start).toISOString(), hasta: new Date(start + 86400000).toISOString() };
}

// ==================== API ROUTES ====================

app.get('/api/health', route(async (_req, res) => {
  const ok = await db.ping();
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'database_unreachable' });
}));

// ---------- Autenticacion ----------

app.post('/api/auth/login', route(async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!email || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }
  const user = await db.authenticate(email, password);
  if (!user || !user.rol) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  res.json({ user, token: createToken(user.id_usuario, user.rol) });
}));

app.post('/api/auth/register', route(async (req, res) => {
  const { nombre, apellido, password, rol, fecha_nacimiento, genero } = req.body || {};
  const email = normalizeEmail(req.body?.email);

  if (![nombre, apellido, fecha_nacimiento, genero, password].every(v => typeof v === 'string' && v.trim()) || !email) {
    return res.status(400).json({ error: 'Faltan campos obligatorios para el registro (nombre, apellido, email, contraseña, fecha de nacimiento y género)' });
  }
  if (rol !== UserRole.NUTRICIONISTA && rol !== UserRole.PACIENTE) {
    return res.status(400).json({ error: 'El rol especificado es inválido' });
  }
  if (!EMAIL_RE.test(email) || email.length > 150) {
    return res.status(400).json({ error: 'Ingresá un correo electrónico válido (ej: nombre@dominio.com)' });
  }
  if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres e incluir letras y números' });
  }
  if (nombre.trim().length > 100 || apellido.trim().length > 100) {
    return res.status(400).json({ error: 'Nombre y apellido no pueden superar los 100 caracteres' });
  }
  if (!isDate(fecha_nacimiento) || fecha_nacimiento > new Date().toISOString().split('T')[0] || fecha_nacimiento < '1900-01-01') {
    return res.status(400).json({ error: 'La fecha de nacimiento no es válida' });
  }
  if (!GENEROS.includes(genero)) {
    return res.status(400).json({ error: 'El género indicado no es válido' });
  }

  const result = await db.register(nombre.trim(), apellido.trim(), email, password, rol, genero, fecha_nacimiento);
  if (!result.success || !result.user) {
    const duplicate = /ya est/.test(result.error || '');
    return res.status(duplicate ? 409 : 500).json({ error: result.error });
  }
  res.json({ user: result.user, token: createToken(result.user.id_usuario, rol) });
}));

// Todo lo que sigue requiere sesion valida
app.use('/api', requireAuth);

// ---------- Pacientes ----------

// Pacientes del nutricionista autenticado
app.get('/api/patients', route(async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Solo los nutricionistas pueden ver su lista de pacientes' });
  res.json({ patients: await db.getPatients(req.auth!.id) });
}));

// Vincular paciente por email
app.post('/api/patients/link', route(async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Solo los nutricionistas pueden vincular pacientes' });
  const email = normalizeEmail(req.body?.email);
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Ingresá un correo electrónico válido' });
  }
  const result = await db.linkPatient(req.auth!.id, email);
  if (!result.success || !result.patient) {
    const notFound = /no está registrado/.test(result.error || '');
    return res.status(notFound ? 404 : 400).json({ error: result.error });
  }
  res.json({ patient: result.patient });
}));

// Dar de baja un vinculo: el nutricionista indica el paciente; el paciente se da de baja de su nutricionista
app.post('/api/patients/unlink', route(async (req, res) => {
  let result;
  if (isNutri(req)) {
    const patientId = toId(req.body?.patientId);
    if (!patientId) return res.status(400).json({ error: 'Falta ID de paciente' });
    result = await db.unlinkPatient(patientId, req.auth!.id);
  } else {
    result = await db.unlinkPatient(req.auth!.id);
  }
  if (!result.success) return res.status(404).json({ error: result.error });
  res.json({ success: true });
}));

// ---------- Planes nutricionales ----------

// Plan activo de un paciente
app.get('/api/plans', route(async (req, res) => {
  const patientId = toId(req.query.patientId);
  if (!patientId) return res.status(400).json({ error: 'Falta ID de paciente' });
  if (!(await canAccessPatient(req, patientId))) return res.status(403).json({ error: 'No tenés acceso a este paciente' });
  res.json({ plan: await db.getPatientPlan(patientId) });
}));

// Crear plan (reemplaza al plan activo anterior)
app.post('/api/plans', route(async (req, res) => {
  if (!isNutri(req)) return res.status(403).json({ error: 'Solo los nutricionistas pueden prescribir planes' });
  const patientId = toId(req.body?.patientId);
  const d = req.body?.planDetails;
  if (!patientId || !d) return res.status(400).json({ error: 'Faltan parámetros del plan' });

  if (!isNum(d.calorias_objetivo, 0, 20000, false)) {
    return res.status(400).json({ error: 'Las calorías del plan deben ser un número mayor a 0 (máximo 20000)' });
  }
  if (![d.proteinas_objetivo, d.carbohidratos_objetivo, d.grasas_objetivo].every(v => isNum(v, 0, 2000, false))) {
    return res.status(400).json({ error: 'Proteínas, carbohidratos y grasas deben ser números mayores a 0 (máximo 2000 g)' });
  }
  if (!isDate(d.fecha_inicio) || !isDate(d.fecha_fin)) {
    return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias (formato AAAA-MM-DD)' });
  }
  if (d.fecha_fin < d.fecha_inicio) {
    return res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la fecha de inicio' });
  }

  const result = await db.savePatientPlan(patientId, req.auth!.id, {
    calorias_objetivo: d.calorias_objetivo,
    proteinas_objetivo: d.proteinas_objetivo,
    carbohidratos_objetivo: d.carbohidratos_objetivo,
    grasas_objetivo: d.grasas_objetivo,
    fecha_inicio: d.fecha_inicio,
    fecha_fin: d.fecha_fin,
  });
  if (!result.success) return res.status(403).json({ error: result.error });
  res.json({ plan: result.plan });
}));

// ---------- Ingestas ----------

// Ingestas de un paciente para un dia local (date=AAAA-MM-DD, tz=Date.getTimezoneOffset() del cliente)
app.get('/api/ingestas', route(async (req, res) => {
  const patientId = toId(req.query.patientId);
  const date = req.query.date;
  if (!patientId || !isDate(date)) {
    return res.status(400).json({ error: 'ID de paciente y fecha "YYYY-MM-DD" son requeridos' });
  }
  if (!(await canAccessPatient(req, patientId))) return res.status(403).json({ error: 'No tenés acceso a este paciente' });
  const { desde, hasta } = dayRange(date, req.query.tz);
  res.json({ ingestas: await db.getPatientIngestas(patientId, desde, hasta) });
}));

// Registrar comida consumida (solo el propio paciente)
app.post('/api/ingestas', route(async (req, res) => {
  if (!isPaciente(req)) return res.status(403).json({ error: 'Solo los pacientes pueden registrar comidas' });
  const { id_alimento, cantidad, tipo_comida, fecha_hora_consumo } = req.body || {};

  if (!isId(id_alimento)) return res.status(400).json({ error: 'Alimento inválido' });
  if (!isNum(cantidad, 0, 100000, false)) return res.status(400).json({ error: 'La cantidad debe ser un número mayor a 0' });
  if (!TIPOS_COMIDA.includes(tipo_comida)) {
    return res.status(400).json({ error: `El tipo de comida debe ser uno de: ${TIPOS_COMIDA.join(', ')}` });
  }
  const when = new Date(fecha_hora_consumo);
  if (typeof fecha_hora_consumo !== 'string' || isNaN(when.getTime())) {
    return res.status(400).json({ error: 'La fecha y hora de consumo no es válida' });
  }
  if (!(await db.getAlimentoById(id_alimento))) {
    return res.status(404).json({ error: 'El alimento indicado no existe' });
  }

  // El plan vigente lo determina el servidor, no el cliente
  const plan = await db.getPatientPlan(req.auth!.id);
  const ingesta = await db.addIngesta(req.auth!.id, {
    id_plan: plan?.id_plan ?? null,
    id_alimento,
    cantidad,
    tipo_comida: tipo_comida as TipoComida,
    fecha_hora_consumo: when.toISOString(),
  });
  res.json({ ingesta });
}));

// Eliminar una ingesta propia
app.delete('/api/ingestas/:id', route(async (req, res) => {
  if (!isPaciente(req)) return res.status(403).json({ error: 'Solo los pacientes pueden eliminar sus registros' });
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'ID de registro inválido' });
  if (!(await db.deleteIngesta(id, req.auth!.id))) {
    return res.status(404).json({ error: 'Registro de ingesta no encontrado' });
  }
  res.json({ success: true });
}));

// ---------- Alimentos ----------

app.get('/api/alimentos', route(async (_req, res) => {
  res.json({ alimentos: await db.getAlimentos() });
}));

// Dar de alta un alimento (valores nutricionales por medida_cantidad)
app.post('/api/alimentos', route(async (req, res) => {
  const b = req.body || {};
  const nombre = typeof b.nombre_alimento === 'string' ? b.nombre_alimento.trim() : '';
  if (!nombre || nombre.length > 255) {
    return res.status(400).json({ error: 'El nombre del alimento es obligatorio (máximo 255 caracteres)' });
  }
  const { calorias, proteinas, carbohidratos, grasas } = b;
  if (!isNum(calorias, 0, 10000) || ![proteinas, carbohidratos, grasas].every(v => isNum(v, 0, 1000))) {
    return res.status(400).json({ error: 'Calorías y macronutrientes deben ser números válidos mayores o iguales a 0' });
  }
  const medida_cantidad = b.medida_cantidad === undefined ? 100 : b.medida_cantidad;
  const medida_unidad = b.medida_unidad === undefined ? 'g' : b.medida_unidad;
  if (!isNum(medida_cantidad, 0, 100000, false) || typeof medida_unidad !== 'string' || !medida_unidad.trim() || medida_unidad.length > 20) {
    return res.status(400).json({ error: 'La medida del alimento no es válida' });
  }
  if (await db.getAlimentoByName(nombre)) {
    return res.status(409).json({ error: 'Ya existe un alimento con ese nombre en el catálogo' });
  }
  // Los alimentos de Open Food Facts solo se crean desde /api/barcode
  const alimento = await db.addAlimento({
    nombre_alimento: nombre, calorias, proteinas, carbohidratos, grasas,
    medida_cantidad, medida_unidad: medida_unidad.trim(), origen: 'Local',
  });
  res.json({ alimento });
}));

// Escaneo de producto: busca primero en la base local y, si no esta, en Open Food Facts
app.get('/api/barcode/:code', route(async (req, res) => {
  const code = req.params.code.trim();
  if (!/^\d{8,14}$/.test(code)) {
    return res.status(400).json({ error: 'El código de barras debe tener entre 8 y 14 dígitos' });
  }

  const existing = await db.getAlimentoByBarcode(code);
  if (existing) return res.json({ alimento: existing, isNew: false });

  let data: any;
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, {
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) return res.status(404).json({ error: 'Producto no identificado' });
    if (!response.ok) return res.status(502).json({ error: 'Open Food Facts no está disponible en este momento' });
    data = await response.json();
  } catch (e: any) {
    console.error('[API barcode] Open Food Facts:', e?.message || e);
    return res.status(504).json({ error: 'No se pudo consultar Open Food Facts (sin respuesta). Probá de nuevo o cargá el alimento manualmente.' });
  }

  if (!data || data.status === 0 || !data.product) {
    return res.status(404).json({ error: 'Producto no identificado' });
  }

  // Open Food Facts informa los valores cada 100 g
  const product = data.product;
  const n = product.nutriments || {};
  const alimento = await db.addAlimento({
    nombre_alimento: product.product_name_es || product.product_name || `Producto Envasado (${code})`,
    calorias: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
    proteinas: Number((n['proteins_100g'] || 0).toFixed(1)),
    carbohidratos: Number((n['carbohydrates_100g'] || 0).toFixed(1)),
    grasas: Number((n['fat_100g'] || 0).toFixed(1)),
    medida_cantidad: 100,
    medida_unidad: 'g',
    codigo_barras: code,
    origen: 'OpenFoodFacts',
  });
  res.json({ alimento, isNew: true });
}));

// JSON mal formado u otros errores de middleware: responder JSON en vez del HTML por defecto de Express
app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido' });
  console.error('[API]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
