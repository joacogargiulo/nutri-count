/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import {
  Usuario, Persona, UserRole, RelacionNutricionistaPaciente,
  Alimento, PlanNutricional, EstadoPlan, RegistroIngesta, TipoComida
} from '../types';

// Detect Supabase keys
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Initialize real Supabase client (only if credentials exist)
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

console.log(isSupabaseConfigured
  ? `[DB] Nutri Count - Real Supabase keys detected. Attempting connection probe...`
  : `[DB] Nutri Count - No Supabase keys found. Using stateful memory client.`
);

// Immediately verify connection and table capability if configured
if (isSupabaseConfigured && supabase) {
  (async () => {
    try {
      // Query a single record from the 'Alimentos' table to verify read permissions and connection durability
      const { data, error } = await supabase.from('alimentos').select('id_alimento').limit(1);
      if (error) {
        console.error(' [DB] ❌ La clave o URL de Supabase está configurada, pero falló la consulta de prueba.');
        console.error(` [DB] Detalle del error de Supabase: ${error.message} (${error.code || 'sin código'})`);
        console.error(' [DB] Consejo: Asegúrate de haber ejecutado el script SQL de creación de tablas en la SQL Editor de Supabase y que las políticas de seguridad (RLS) permitan lecturas.');
      } else {
        console.log(' [DB] 🎉 ✅ ¡Conexión con Supabase verificada con éxito!');
        console.log(' [DB] La base de datos responde correctamente y las tablas principales están listas.');
      }
    } catch (err: any) {
      console.error(' [DB] ❌ Error inesperado de red o autenticación al intentar probar la conexión con Supabase:', err?.message || err);
    }
  })();
}

// State for Stateful In-Memory Fallback DB
interface MemoryDB {
  personas: Persona[];
  usuarios: Usuario[];
  relaciones: RelacionNutricionistaPaciente[];
  alimentos: Alimento[];
  planes: PlanNutricional[];
  ingestas: RegistroIngesta[];
}

const mockPersonas: Persona[] = [
  { id_persona: 1, nombre: 'Bernardo', apellido: 'Gonella', genero: 'Masculino', fecha_nacimiento: '1985-05-15' },
  { id_persona: 2, nombre: 'Agustin', apellido: 'Posse', genero: 'Masculino', fecha_nacimiento: '1998-10-20' },
  { id_persona: 3, nombre: 'Joaquin', apellido: 'Gargiulo', genero: 'Masculino', fecha_nacimiento: '2000-02-12' },
  { id_persona: 4, nombre: 'Marcos', apellido: 'Parra', genero: 'Masculino', fecha_nacimiento: '1999-07-28' },
  { id_persona: 5, nombre: 'Matias', apellido: 'Garzon', genero: 'Masculino', fecha_nacimiento: '2001-11-04' },
];

const mockUsuarios: Usuario[] = [
  { id_usuario: 1, nombre_usuario: 'bernardo.g', email: 'bernardo@nutricount.com', hash_contrasena: 'admin', id_persona: 1, rol: UserRole.NUTRICIONISTA },
  { id_usuario: 2, nombre_usuario: 'agustin.p', email: 'agustin@nutricount.com', hash_contrasena: 'user', id_persona: 2, rol: UserRole.PACIENTE },
  { id_usuario: 3, nombre_usuario: 'joaquin.g', email: 'joaquin@nutricount.com', hash_contrasena: 'user', id_persona: 3, rol: UserRole.PACIENTE },
  { id_usuario: 4, nombre_usuario: 'marcos.p', email: 'marcos@nutricount.com', hash_contrasena: 'user', id_persona: 4, rol: UserRole.PACIENTE },
];

// Las contraseñas de los usuarios demo se guardan en texto plano arriba por legibilidad;
// se hashean una sola vez al cargar el modulo para que authenticate() siempre compare con bcrypt.
mockUsuarios.forEach(u => {
  if (u.hash_contrasena) u.hash_contrasena = bcrypt.hashSync(u.hash_contrasena, 10);
});

const mockRelaciones: RelacionNutricionistaPaciente[] = [
  { id_relacion: 1, id_nutricionista: 1, id_paciente: 2, fecha_vinculacion: '2026-06-01' },
  { id_relacion: 2, id_nutricionista: 1, id_paciente: 3, fecha_vinculacion: '2026-06-02' },
  { id_relacion: 3, id_nutricionista: 1, id_paciente: 4, fecha_vinculacion: '2026-06-03' },
];

const mockAlimentos: Alimento[] = [
  // LACTEOS
  { id_alimento: 1, nombre_alimento: 'Leche entera', calorias: 60, proteinas: 3.2, carbohidratos: 4.5, grasas: 3.3, medida_cantidad: 100, medida_unidad: 'ml' },
  { id_alimento: 2, nombre_alimento: 'Leche descremada', calorias: 34, proteinas: 3.4, carbohidratos: 5.0, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'ml' },
  { id_alimento: 3, nombre_alimento: 'Yogur natural entero', calorias: 61, proteinas: 3.5, carbohidratos: 4.7, grasas: 3.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 4, nombre_alimento: 'Yogur natural descremado', calorias: 56, proteinas: 5.7, carbohidratos: 7.7, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 5, nombre_alimento: 'Yogur griego natural', calorias: 97, proteinas: 9.0, carbohidratos: 3.6, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 6, nombre_alimento: 'Queso crema', calorias: 342, proteinas: 6.0, carbohidratos: 4.0, grasas: 34.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 7, nombre_alimento: 'Queso untable light', calorias: 180, proteinas: 10.0, carbohidratos: 6.0, grasas: 12.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 8, nombre_alimento: 'Queso mozzarella', calorias: 280, proteinas: 22.0, carbohidratos: 2.2, grasas: 22.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 9, nombre_alimento: 'Queso tybo / barra', calorias: 330, proteinas: 24.0, carbohidratos: 2.0, grasas: 26.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 10, nombre_alimento: 'Queso port salut', calorias: 290, proteinas: 22.0, carbohidratos: 2.0, grasas: 23.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 11, nombre_alimento: 'Ricota entera', calorias: 174, proteinas: 11.0, carbohidratos: 3.0, grasas: 13.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 12, nombre_alimento: 'Manteca', calorias: 717, proteinas: 0.9, carbohidratos: 0.1, grasas: 81.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 13, nombre_alimento: 'Crema de leche', calorias: 340, proteinas: 2.0, carbohidratos: 3.0, grasas: 36.0, medida_cantidad: 100, medida_unidad: 'g' },

  // HUEVOS
  { id_alimento: 14, nombre_alimento: 'Huevo entero', calorias: 143, proteinas: 12.6, carbohidratos: 0.7, grasas: 9.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 15, nombre_alimento: 'Clara de huevo', calorias: 52, proteinas: 10.9, carbohidratos: 0.7, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 16, nombre_alimento: 'Yema de huevo', calorias: 322, proteinas: 15.9, carbohidratos: 3.6, grasas: 26.5, medida_cantidad: 100, medida_unidad: 'g' },

  // CARNE VACUNA
  { id_alimento: 17, nombre_alimento: 'Carne picada magra cruda 90/10', calorias: 176, proteinas: 20.0, carbohidratos: 0.0, grasas: 10.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 18, nombre_alimento: 'Carne picada comun cruda 80/20', calorias: 254, proteinas: 17.0, carbohidratos: 0.0, grasas: 20.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 19, nombre_alimento: 'Nalga cruda', calorias: 150, proteinas: 21.0, carbohidratos: 0.0, grasas: 6.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 20, nombre_alimento: 'Bola de lomo cruda', calorias: 160, proteinas: 21.0, carbohidratos: 0.0, grasas: 7.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 21, nombre_alimento: 'Cuadrada cruda', calorias: 165, proteinas: 21.0, carbohidratos: 0.0, grasas: 8.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 22, nombre_alimento: 'Peceto crudo', calorias: 145, proteinas: 22.0, carbohidratos: 0.0, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 23, nombre_alimento: 'Lomo crudo', calorias: 180, proteinas: 20.0, carbohidratos: 0.0, grasas: 10.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 24, nombre_alimento: 'Bife angosto crudo', calorias: 210, proteinas: 19.0, carbohidratos: 0.0, grasas: 14.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 25, nombre_alimento: 'Vacio crudo', calorias: 240, proteinas: 18.0, carbohidratos: 0.0, grasas: 18.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 26, nombre_alimento: 'Asado crudo', calorias: 290, proteinas: 17.0, carbohidratos: 0.0, grasas: 24.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 27, nombre_alimento: 'Matambre crudo', calorias: 250, proteinas: 18.0, carbohidratos: 0.0, grasas: 19.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 28, nombre_alimento: 'Higado vacuno crudo', calorias: 135, proteinas: 20.0, carbohidratos: 4.0, grasas: 4.0, medida_cantidad: 100, medida_unidad: 'g' },

  // POLLO Y AVES
  { id_alimento: 29, nombre_alimento: 'Pechuga de pollo sin piel cruda', calorias: 120, proteinas: 23.0, carbohidratos: 0.0, grasas: 2.6, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 30, nombre_alimento: 'Pechuga de pollo sin piel cocida', calorias: 165, proteinas: 31.0, carbohidratos: 0.0, grasas: 3.6, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 31, nombre_alimento: 'Muslo de pollo sin piel crudo', calorias: 125, proteinas: 19.0, carbohidratos: 0.0, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 32, nombre_alimento: 'Pata-muslo con piel crudo', calorias: 215, proteinas: 17.0, carbohidratos: 0.0, grasas: 16.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 33, nombre_alimento: 'Ala de pollo con piel cruda', calorias: 220, proteinas: 18.0, carbohidratos: 0.0, grasas: 16.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 34, nombre_alimento: 'Pollo entero con piel crudo', calorias: 190, proteinas: 18.0, carbohidratos: 0.0, grasas: 13.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 35, nombre_alimento: 'Pavo pechuga cruda', calorias: 110, proteinas: 24.0, carbohidratos: 0.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },

  // CERDO
  { id_alimento: 36, nombre_alimento: 'Bondiola de cerdo cruda', calorias: 260, proteinas: 17.0, carbohidratos: 0.0, grasas: 21.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 37, nombre_alimento: 'Carre de cerdo crudo', calorias: 165, proteinas: 21.0, carbohidratos: 0.0, grasas: 8.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 38, nombre_alimento: 'Solomillo de cerdo crudo', calorias: 120, proteinas: 22.0, carbohidratos: 0.0, grasas: 3.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 39, nombre_alimento: 'Costilla de cerdo cruda', calorias: 290, proteinas: 17.0, carbohidratos: 0.0, grasas: 24.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 40, nombre_alimento: 'Jamon cocido', calorias: 145, proteinas: 20.0, carbohidratos: 2.0, grasas: 6.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 41, nombre_alimento: 'Panceta', calorias: 540, proteinas: 37.0, carbohidratos: 1.0, grasas: 42.0, medida_cantidad: 100, medida_unidad: 'g' },

  // PESCADOS Y MARISCOS
  { id_alimento: 42, nombre_alimento: 'Merluza cruda', calorias: 80, proteinas: 17.0, carbohidratos: 0.0, grasas: 1.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 43, nombre_alimento: 'Atun al natural escurrido', calorias: 116, proteinas: 26.0, carbohidratos: 0.0, grasas: 1.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 44, nombre_alimento: 'Atun en aceite escurrido', calorias: 198, proteinas: 29.0, carbohidratos: 0.0, grasas: 8.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 45, nombre_alimento: 'Salmon crudo', calorias: 208, proteinas: 20.0, carbohidratos: 0.0, grasas: 13.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 46, nombre_alimento: 'Sardina', calorias: 208, proteinas: 25.0, carbohidratos: 0.0, grasas: 11.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 47, nombre_alimento: 'Caballa', calorias: 205, proteinas: 19.0, carbohidratos: 0.0, grasas: 14.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 48, nombre_alimento: 'Lenguado crudo', calorias: 86, proteinas: 18.0, carbohidratos: 0.0, grasas: 1.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 49, nombre_alimento: 'Corvina cruda', calorias: 100, proteinas: 20.0, carbohidratos: 0.0, grasas: 2.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 50, nombre_alimento: 'Camarones cocidos', calorias: 99, proteinas: 24.0, carbohidratos: 0.2, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 51, nombre_alimento: 'Calamar crudo', calorias: 92, proteinas: 15.6, carbohidratos: 3.1, grasas: 1.4, medida_cantidad: 100, medida_unidad: 'g' },

  // PANES Y HARINAS
  { id_alimento: 52, nombre_alimento: 'Pan blanco', calorias: 265, proteinas: 8.5, carbohidratos: 49.0, grasas: 3.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 53, nombre_alimento: 'Pan integral', calorias: 247, proteinas: 13.0, carbohidratos: 41.0, grasas: 4.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 54, nombre_alimento: 'Pan frances', calorias: 270, proteinas: 8.8, carbohidratos: 56.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 55, nombre_alimento: 'Pan lactal blanco', calorias: 260, proteinas: 8.0, carbohidratos: 49.0, grasas: 3.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 56, nombre_alimento: 'Pan lactal integral', calorias: 250, proteinas: 10.0, carbohidratos: 43.0, grasas: 4.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 57, nombre_alimento: 'Tortilla de trigo', calorias: 310, proteinas: 8.0, carbohidratos: 52.0, grasas: 8.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 58, nombre_alimento: 'Harina de trigo 000/0000', calorias: 364, proteinas: 10.0, carbohidratos: 76.0, grasas: 1.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 59, nombre_alimento: 'Harina integral', calorias: 340, proteinas: 13.0, carbohidratos: 72.0, grasas: 2.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 60, nombre_alimento: 'Harina de avena', calorias: 389, proteinas: 16.9, carbohidratos: 66.3, grasas: 6.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 61, nombre_alimento: 'Pan rallado', calorias: 395, proteinas: 13.0, carbohidratos: 72.0, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' },

  // CEREALES, ARROZ Y PASTAS
  { id_alimento: 62, nombre_alimento: 'Arroz blanco crudo', calorias: 365, proteinas: 7.1, carbohidratos: 80.0, grasas: 0.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 63, nombre_alimento: 'Arroz blanco cocido', calorias: 130, proteinas: 2.7, carbohidratos: 28.2, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 64, nombre_alimento: 'Arroz integral crudo', calorias: 370, proteinas: 7.5, carbohidratos: 77.0, grasas: 2.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 65, nombre_alimento: 'Arroz integral cocido', calorias: 112, proteinas: 2.3, carbohidratos: 23.5, grasas: 0.8, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 66, nombre_alimento: 'Fideos secos crudos', calorias: 371, proteinas: 13.0, carbohidratos: 75.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 67, nombre_alimento: 'Fideos cocidos', calorias: 158, proteinas: 5.8, carbohidratos: 30.9, grasas: 0.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 68, nombre_alimento: 'Avena tradicional seca', calorias: 389, proteinas: 16.9, carbohidratos: 66.3, grasas: 6.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 69, nombre_alimento: 'Quinoa cruda', calorias: 368, proteinas: 14.1, carbohidratos: 64.2, grasas: 6.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 70, nombre_alimento: 'Quinoa cocida', calorias: 120, proteinas: 4.4, carbohidratos: 21.3, grasas: 1.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 71, nombre_alimento: 'Polenta / harina de maiz seca', calorias: 365, proteinas: 7.0, carbohidratos: 79.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 72, nombre_alimento: 'Polenta cocida en agua', calorias: 70, proteinas: 1.6, carbohidratos: 15.0, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 73, nombre_alimento: 'Copos de maiz sin azucar', calorias: 357, proteinas: 7.5, carbohidratos: 84.0, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 74, nombre_alimento: 'Granola comun', calorias: 450, proteinas: 10.0, carbohidratos: 64.0, grasas: 17.0, medida_cantidad: 100, medida_unidad: 'g' },

  // LEGUMBRES
  { id_alimento: 75, nombre_alimento: 'Lentejas secas', calorias: 352, proteinas: 24.6, carbohidratos: 63.0, grasas: 1.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 76, nombre_alimento: 'Lentejas cocidas', calorias: 116, proteinas: 9.0, carbohidratos: 20.0, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 77, nombre_alimento: 'Garbanzos secos', calorias: 364, proteinas: 19.0, carbohidratos: 61.0, grasas: 6.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 78, nombre_alimento: 'Garbanzos cocidos', calorias: 164, proteinas: 8.9, carbohidratos: 27.4, grasas: 2.6, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 79, nombre_alimento: 'Porotos negros cocidos', calorias: 132, proteinas: 8.9, carbohidratos: 23.7, grasas: 0.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 80, nombre_alimento: 'Porotos blancos cocidos', calorias: 139, proteinas: 9.7, carbohidratos: 25.1, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 81, nombre_alimento: 'Arvejas cocidas', calorias: 84, proteinas: 5.4, carbohidratos: 15.6, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 82, nombre_alimento: 'Soja cocida', calorias: 172, proteinas: 18.2, carbohidratos: 8.4, grasas: 9.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 83, nombre_alimento: 'Hummus', calorias: 166, proteinas: 7.9, carbohidratos: 14.3, grasas: 9.6, medida_cantidad: 100, medida_unidad: 'g' },

  // FRUTAS
  { id_alimento: 84, nombre_alimento: 'Banana', calorias: 89, proteinas: 1.1, carbohidratos: 22.8, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 85, nombre_alimento: 'Manzana', calorias: 52, proteinas: 0.3, carbohidratos: 13.8, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 86, nombre_alimento: 'Naranja', calorias: 47, proteinas: 0.9, carbohidratos: 11.8, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 87, nombre_alimento: 'Mandarina', calorias: 53, proteinas: 0.8, carbohidratos: 13.3, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 88, nombre_alimento: 'Pera', calorias: 57, proteinas: 0.4, carbohidratos: 15.2, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 89, nombre_alimento: 'Durazno', calorias: 39, proteinas: 0.9, carbohidratos: 9.5, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 90, nombre_alimento: 'Ciruela', calorias: 46, proteinas: 0.7, carbohidratos: 11.4, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 91, nombre_alimento: 'Uva', calorias: 69, proteinas: 0.7, carbohidratos: 18.1, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 92, nombre_alimento: 'Frutilla', calorias: 32, proteinas: 0.7, carbohidratos: 7.7, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 93, nombre_alimento: 'Arandanos', calorias: 57, proteinas: 0.7, carbohidratos: 14.5, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 94, nombre_alimento: 'Mango', calorias: 60, proteinas: 0.8, carbohidratos: 15.0, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 95, nombre_alimento: 'Anana', calorias: 50, proteinas: 0.5, carbohidratos: 13.1, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 96, nombre_alimento: 'Kiwi', calorias: 61, proteinas: 1.1, carbohidratos: 14.7, grasas: 0.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 97, nombre_alimento: 'Sandia', calorias: 30, proteinas: 0.6, carbohidratos: 7.6, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 98, nombre_alimento: 'Melon', calorias: 34, proteinas: 0.8, carbohidratos: 8.2, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 99, nombre_alimento: 'Palta', calorias: 160, proteinas: 2.0, carbohidratos: 8.5, grasas: 14.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 100, nombre_alimento: 'Limon', calorias: 29, proteinas: 1.1, carbohidratos: 9.3, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },

  // VERDURAS Y HORTALIZAS
  { id_alimento: 101, nombre_alimento: 'Lechuga cruda', calorias: 15, proteinas: 1.4, carbohidratos: 2.9, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 102, nombre_alimento: 'Tomate crudo', calorias: 18, proteinas: 0.9, carbohidratos: 3.9, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 103, nombre_alimento: 'Cebolla cruda', calorias: 40, proteinas: 1.1, carbohidratos: 9.3, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 104, nombre_alimento: 'Zanahoria cruda', calorias: 41, proteinas: 0.9, carbohidratos: 9.6, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 105, nombre_alimento: 'Morron rojo crudo', calorias: 31, proteinas: 1.0, carbohidratos: 6.0, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 106, nombre_alimento: 'Morron verde crudo', calorias: 20, proteinas: 0.9, carbohidratos: 4.6, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 107, nombre_alimento: 'Espinaca cruda', calorias: 23, proteinas: 2.9, carbohidratos: 3.6, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 108, nombre_alimento: 'Acelga cruda', calorias: 19, proteinas: 1.8, carbohidratos: 3.7, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 109, nombre_alimento: 'Brocoli crudo', calorias: 34, proteinas: 2.8, carbohidratos: 6.6, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 110, nombre_alimento: 'Coliflor cruda', calorias: 25, proteinas: 1.9, carbohidratos: 5.0, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 111, nombre_alimento: 'Zapallito crudo', calorias: 17, proteinas: 1.2, carbohidratos: 3.1, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 112, nombre_alimento: 'Zucchini crudo', calorias: 17, proteinas: 1.2, carbohidratos: 3.1, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 113, nombre_alimento: 'Berenjena cruda', calorias: 25, proteinas: 1.0, carbohidratos: 5.9, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 114, nombre_alimento: 'Pepino crudo', calorias: 15, proteinas: 0.7, carbohidratos: 3.6, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 115, nombre_alimento: 'Repollo crudo', calorias: 25, proteinas: 1.3, carbohidratos: 5.8, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 116, nombre_alimento: 'Champinones crudos', calorias: 22, proteinas: 3.1, carbohidratos: 3.3, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 117, nombre_alimento: 'Ajo crudo', calorias: 149, proteinas: 6.4, carbohidratos: 33.1, grasas: 0.5, medida_cantidad: 100, medida_unidad: 'g' },

  // TUBERCULOS Y SIMILARES
  { id_alimento: 118, nombre_alimento: 'Papa cruda', calorias: 77, proteinas: 2.0, carbohidratos: 17.5, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 119, nombre_alimento: 'Papa hervida', calorias: 87, proteinas: 1.9, carbohidratos: 20.1, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 120, nombre_alimento: 'Batata cruda', calorias: 86, proteinas: 1.6, carbohidratos: 20.1, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 121, nombre_alimento: 'Batata hervida', calorias: 76, proteinas: 1.4, carbohidratos: 17.7, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 122, nombre_alimento: 'Mandioca cruda', calorias: 160, proteinas: 1.4, carbohidratos: 38.1, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 123, nombre_alimento: 'Choclo cocido', calorias: 96, proteinas: 3.4, carbohidratos: 21.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 124, nombre_alimento: 'Calabaza cocida', calorias: 20, proteinas: 0.7, carbohidratos: 4.9, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },

  // FRUTOS SECOS, SEMILLAS Y GRASAS
  { id_alimento: 125, nombre_alimento: 'Aceite de oliva', calorias: 884, proteinas: 0.0, carbohidratos: 0.0, grasas: 100.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 126, nombre_alimento: 'Aceite de girasol', calorias: 884, proteinas: 0.0, carbohidratos: 0.0, grasas: 100.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 127, nombre_alimento: 'Mayonesa', calorias: 680, proteinas: 1.0, carbohidratos: 1.0, grasas: 75.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 128, nombre_alimento: 'Mani', calorias: 567, proteinas: 25.8, carbohidratos: 16.1, grasas: 49.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 129, nombre_alimento: 'Mantequilla de mani', calorias: 588, proteinas: 25.0, carbohidratos: 20.0, grasas: 50.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 130, nombre_alimento: 'Almendras', calorias: 579, proteinas: 21.2, carbohidratos: 21.6, grasas: 49.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 131, nombre_alimento: 'Nueces', calorias: 654, proteinas: 15.2, carbohidratos: 13.7, grasas: 65.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 132, nombre_alimento: 'Castanas de caju', calorias: 553, proteinas: 18.2, carbohidratos: 30.2, grasas: 43.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 133, nombre_alimento: 'Semillas de chia', calorias: 486, proteinas: 16.5, carbohidratos: 42.1, grasas: 30.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 134, nombre_alimento: 'Semillas de lino', calorias: 534, proteinas: 18.3, carbohidratos: 28.9, grasas: 42.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 135, nombre_alimento: 'Semillas de girasol', calorias: 584, proteinas: 20.8, carbohidratos: 20.0, grasas: 51.5, medida_cantidad: 100, medida_unidad: 'g' },

  // AZUCARES, DULCES Y BASICOS
  { id_alimento: 136, nombre_alimento: 'Azucar', calorias: 387, proteinas: 0.0, carbohidratos: 100.0, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 137, nombre_alimento: 'Miel', calorias: 304, proteinas: 0.3, carbohidratos: 82.4, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 138, nombre_alimento: 'Dulce de leche', calorias: 315, proteinas: 7.0, carbohidratos: 55.0, grasas: 7.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 139, nombre_alimento: 'Mermelada', calorias: 250, proteinas: 0.3, carbohidratos: 65.0, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 140, nombre_alimento: 'Cacao amargo', calorias: 228, proteinas: 19.6, carbohidratos: 57.9, grasas: 13.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 141, nombre_alimento: 'Chocolate comun', calorias: 535, proteinas: 7.7, carbohidratos: 59.0, grasas: 30.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 142, nombre_alimento: 'Sal', calorias: 0, proteinas: 0.0, carbohidratos: 0.0, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 143, nombre_alimento: 'Vinagre', calorias: 18, proteinas: 0.0, carbohidratos: 0.0, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 144, nombre_alimento: 'Cafe preparado sin azucar', calorias: 1, proteinas: 0.1, carbohidratos: 0.0, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'ml' },
  { id_alimento: 145, nombre_alimento: 'Yerba mate seca', calorias: 280, proteinas: 12.0, carbohidratos: 50.0, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' }
];

const mockPlanes: PlanNutricional[] = [
  {
    id_plan: 1,
    id_relacion: 1, // vincula a nutricionista 1 con paciente 2
    calorias_objetivo: 2200,
    proteinas_objetivo: 140,
    carbohidratos_objetivo: 250,
    grasas_objetivo: 70,
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-06-30',
    id_estado: EstadoPlan.ACTIVO,
  },
  {
    id_plan: 2,
    id_relacion: 2, // vincula a nutricionista 1 con paciente 3
    calorias_objetivo: 1800,
    proteinas_objetivo: 120,
    carbohidratos_objetivo: 200,
    grasas_objetivo: 55,
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-06-30',
    id_estado: EstadoPlan.ACTIVO,
  }
];

// Seed some initial ingesta records for today
const todayStr = '2026-06-09'; // Matching current local time format

const mockIngestas: RegistroIngesta[] = [
  { id_registro: 1, id_paciente: 2, id_plan: 1, id_alimento: 68, cantidad: 80, tipo_comida: 'Desayuno', fecha_hora_consumo: `${todayStr}T08:30:00Z` },
  { id_registro: 2, id_paciente: 2, id_plan: 1, id_alimento: 5, cantidad: 150, tipo_comida: 'Desayuno', fecha_hora_consumo: `${todayStr}T08:32:00Z` },
  { id_registro: 3, id_paciente: 2, id_plan: 1, id_alimento: 84, cantidad: 120, tipo_comida: 'Desayuno', fecha_hora_consumo: `${todayStr}T08:35:00Z` },
  { id_registro: 4, id_paciente: 2, id_plan: 1, id_alimento: 30, cantidad: 200, tipo_comida: 'Almuerzo', fecha_hora_consumo: `${todayStr}T13:15:00Z` },
  { id_registro: 5, id_paciente: 2, id_plan: 1, id_alimento: 65, cantidad: 150, tipo_comida: 'Almuerzo', fecha_hora_consumo: `${todayStr}T13:20:00Z` },
  { id_registro: 6, id_paciente: 2, id_plan: 1, id_alimento: 125, cantidad: 10, tipo_comida: 'Almuerzo', fecha_hora_consumo: `${todayStr}T13:22:00Z` },
];

// Contadores para simular SERIAL en el fallback de memoria.
// Se fijan una sola vez al cargar el modulo: no recalcular desde .length luego de un delete.
let nextPersonaId = mockPersonas.length + 1;
let nextUsuarioId = mockUsuarios.length + 1;
let nextRelacionId = mockRelaciones.length + 1;
let nextAlimentoId = mockAlimentos.length + 1;
let nextPlanId = mockPlanes.length + 1;
let nextIngestaId = mockIngestas.length + 1;

// Espejo de la tabla Tipos_Comida (5 filas fijas) para traducir tipo_comida <-> id_tipo_comida
// sin necesidad de un JOIN extra contra Supabase.
const TIPOS_COMIDA: { id: number; nombre: TipoComida }[] = [
  { id: 1, nombre: 'Desayuno' },
  { id: 2, nombre: 'Colación' },
  { id: 3, nombre: 'Almuerzo' },
  { id: 4, nombre: 'Merienda' },
  { id: 5, nombre: 'Cena' },
];
const tipoComidaToId = (nombre: TipoComida): number => TIPOS_COMIDA.find(t => t.nombre === nombre)!.id;
const idToTipoComida = (id: number): TipoComida => TIPOS_COMIDA.find(t => t.id === id)?.nombre || 'Desayuno';

let state: MemoryDB = {
  personas: mockPersonas,
  usuarios: mockUsuarios,
  relaciones: mockRelaciones,
  alimentos: mockAlimentos,
  planes: mockPlanes,
  ingestas: mockIngestas,
};

// HELPER API FOR FULL DYNAMIC TRANSACTIONS
export const db = {
  isSupabaseConfigured() {
    return isSupabaseConfigured;
  },

  async authenticate(email: string, pass: string): Promise<Usuario | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id_usuario, nombre_usuario, email, hash_contrasena, id_persona,
          personas (nombre, apellido, genero, fecha_nacimiento),
          relacion_rol_usuario (id_rol, roles (nombre_rol))
        `)
        .eq('email', email)
        .single();

      if (error || !data) return null;

      const d = data as any;
      const passwordMatches = await bcrypt.compare(pass, d.hash_contrasena || '');
      if (!passwordMatches) return null;

      const p = d.personas;
      const rolName = d.relacion_rol_usuario?.[0]?.roles?.nombre_rol || UserRole.PACIENTE;

      return {
        id_usuario: d.id_usuario,
        nombre_usuario: d.nombre_usuario,
        email: d.email,
        id_persona: d.id_persona,
        persona: p ? {
          id_persona: d.id_persona,
          nombre: Array.isArray(p) ? p[0]?.nombre : p.nombre,
          apellido: Array.isArray(p) ? p[0]?.apellido : p.apellido,
          genero: Array.isArray(p) ? p[0]?.genero : p.genero,
          fecha_nacimiento: Array.isArray(p) ? p[0]?.fecha_nacimiento : p.fecha_nacimiento
        } : undefined,
        rol: rolName as UserRole
      };
    }

    // In-memory fallback authentication
    const user = state.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const passwordMatches = await bcrypt.compare(pass, user.hash_contrasena || '');
    if (!passwordMatches) return null;

    const persona = state.personas.find(p => p.id_persona === user.id_persona);
    return {
      ...user,
      persona,
    };
  },

  async register(
    nombre: string,
    apellido: string,
    email: string,
    pass: string,
    role: UserRole,
    nombre_usuario: string,
    genero?: string,
    fecha_nacimiento?: string
  ): Promise<{ success: boolean; error?: string; user?: Usuario }> {
    const hash_contrasena = await bcrypt.hash(pass, 10);

    if (isSupabaseConfigured && supabase) {
      const { data: existing } = await supabase
        .from('usuarios')
        .select('email, nombre_usuario')
        .or(`email.eq.${email},nombre_usuario.eq.${nombre_usuario}`);

      if (existing && existing.length > 0) {
        const dupEmail = existing.some((u: any) => u.email === email);
        return { success: false, error: dupEmail ? 'Ese email ya está registrado' : 'Ese nombre de usuario ya está en uso' };
      }

      const { data: personaData, error: personaErr } = await supabase.from('personas').insert([{
        nombre,
        apellido,
        genero: genero || 'No especificado',
        fecha_nacimiento: fecha_nacimiento || null
      }]).select().single();

      if (personaErr || !personaData) {
        return { success: false, error: personaErr?.message || 'Error al crear la persona' };
      }

      const { data: usuarioData, error: usuarioErr } = await supabase.from('usuarios').insert([{
        nombre_usuario,
        email,
        hash_contrasena,
        id_persona: personaData.id_persona
      }]).select().single();

      if (usuarioErr || !usuarioData) {
        return { success: false, error: usuarioErr?.message || 'Error al crear el usuario' };
      }

      // Academic presentation: standard mapping: 1 for Nutricionista, 2 for Paciente
      const rolId = role === UserRole.NUTRICIONISTA ? 1 : 2;
      await supabase.from('relacion_rol_usuario').insert([{
        id_usuario: usuarioData.id_usuario,
        id_rol: rolId
      }]);

      return {
        success: true,
        user: {
          id_usuario: usuarioData.id_usuario,
          nombre_usuario,
          email,
          id_persona: personaData.id_persona,
          persona: personaData as Persona,
          rol: role
        }
      };
    }

    // In memory fallback
    const dupEmail = state.usuarios.some(u => u.email.toLowerCase() === email.toLowerCase());
    const dupUsername = state.usuarios.some(u => u.nombre_usuario.toLowerCase() === nombre_usuario.toLowerCase());
    if (dupEmail || dupUsername) {
      return { success: false, error: dupEmail ? 'Ese email ya está registrado' : 'Ese nombre de usuario ya está en uso' };
    }

    const id_p = nextPersonaId++;
    const id_u = nextUsuarioId++;

    const newPersona: Persona = {
      id_persona: id_p,
      nombre,
      apellido,
      genero: genero || 'No especificado',
      fecha_nacimiento: fecha_nacimiento || ''
    };

    const newUsuario: Usuario = {
      id_usuario: id_u,
      nombre_usuario,
      email,
      hash_contrasena,
      id_persona: id_p,
      rol: role
    };

    state.personas.push(newPersona);
    state.usuarios.push(newUsuario);
    return { success: true, user: { ...newUsuario, persona: newPersona } };
  },

  async getPatients(nutricionistaId: number): Promise<Usuario[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('relacion_nutricionista_paciente')
        .select(`
          id_paciente,
          usuarios!id_paciente (
            id_usuario, nombre_usuario, email, id_persona,
            personas (nombre, apellido, genero, fecha_nacimiento)
          )
        `)
        .eq('id_nutricionista', nutricionistaId)
        .eq('activo', true);

      if (error || !data) return [];

      return data.map((d: any) => {
        const u = d.usuarios;
        const p = u.personas;
        return {
          id_usuario: u.id_usuario,
          nombre_usuario: u.nombre_usuario,
          email: u.email,
          id_persona: u.id_persona,
          rol: UserRole.PACIENTE,
          persona: p ? {
            id_persona: u.id_persona,
            nombre: p.nombre,
            apellido: p.apellido,
            genero: p.genero,
            fecha_nacimiento: p.fecha_nacimiento
          } : undefined
        };
      });
    }

    // Memory fallback
    const linkedIds = state.relaciones
      .filter(r => r.id_nutricionista === nutricionistaId && r.activo !== false)
      .map(r => r.id_paciente);

    return state.usuarios
      .filter(u => linkedIds.includes(u.id_usuario))
      .map(u => ({
        ...u,
        persona: state.personas.find(p => p.id_persona === u.id_persona)
      }));
  },

  async linkPatient(nutricionistaId: number, email: string): Promise<{ success: boolean; error?: string; patient?: Usuario }> {
    if (isSupabaseConfigured && supabase) {
      // Find patient user in Supabase
      const { data: user, error: userErr } = await supabase
        .from('usuarios')
        .select(`
          id_usuario, nombre_usuario, email, id_persona,
          personas (nombre, apellido, genero, fecha_nacimiento)
        `)
        .eq('email', email)
        .single();

      if (userErr || !user) {
        return { success: false, error: 'El usuario no está registrado en Nutri Count' };
      }

      // Check if an active link already exists
      const { data: activeLink } = await supabase
        .from('relacion_nutricionista_paciente')
        .select('*')
        .eq('id_nutricionista', nutricionistaId)
        .eq('id_paciente', user.id_usuario)
        .eq('activo', true)
        .maybeSingle();

      if (activeLink) {
        return { success: false, error: 'Este paciente ya está vinculado a tu cuenta de forma activa.' };
      }

      // Always insert a brand new link to preserve history
      const { error: insertErr } = await supabase.from('relacion_nutricionista_paciente').insert([{
        id_nutricionista: nutricionistaId,
        id_paciente: user.id_usuario,
        fecha_vinculacion: new Date().toISOString().split('T')[0],
        activo: true,
        fecha_desvinculacion: null
      }]);

      if (insertErr) {
        console.error('[DB] Error inserting new relation:', insertErr);
        return { success: false, error: `Error de Supabase al registrar vínculo: ${insertErr.message}` };
      }

      const u = user as any;
      const p = u.personas;
      return {
        success: true,
        patient: {
          id_usuario: u.id_usuario,
          nombre_usuario: u.nombre_usuario,
          email: u.email,
          id_persona: u.id_persona,
          rol: UserRole.PACIENTE,
          persona: p ? {
            id_persona: u.id_persona,
            nombre: Array.isArray(p) ? p[0]?.nombre : p.nombre,
            apellido: Array.isArray(p) ? p[0]?.apellido : p.apellido,
            genero: Array.isArray(p) ? p[0]?.genero : p.genero,
            fecha_nacimiento: Array.isArray(p) ? p[0]?.fecha_nacimiento : p.fecha_nacimiento
          } : undefined
        }
      };
    }

    // Memory fallback
    const patient = state.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!patient) {
      return { success: false, error: 'El usuario no está registrado en Nutri Count' };
    }

    if (patient.rol !== UserRole.PACIENTE) {
      return { success: false, error: 'El usuario no es un Paciente' };
    }

    const activeRel = state.relaciones.find(
      r => r.id_nutricionista === nutricionistaId && r.id_paciente === patient.id_usuario && r.activo !== false
    );

    if (activeRel) {
      return { success: false, error: 'Este paciente ya está vinculado de forma activa' };
    }

    // Always create a new relationship record in memory to preserve history
    const newRel: RelacionNutricionistaPaciente = {
      id_relacion: nextRelacionId++,
      id_nutricionista: nutricionistaId,
      id_paciente: patient.id_usuario,
      fecha_vinculacion: new Date().toISOString().split('T')[0],
      activo: true,
      fecha_desvinculacion: undefined
    };

    state.relaciones.push(newRel);
    return {
      success: true,
      patient: {
        ...patient,
        persona: state.personas.find(p => p.id_persona === patient.id_persona)
      }
    };
  },

  async unlinkPatient(nutricionistaId: number, patientId: number): Promise<{ success: boolean; error?: string }> {
    console.log(`[DB] unlinkPatient (baja lógica) called: nutricionistaId=${nutricionistaId}, patientId=${patientId}`);
    if (isSupabaseConfigured && supabase) {
      const { data: relData, error: relErr } = await supabase
        .from('relacion_nutricionista_paciente')
        .update({
          activo: false,
          fecha_desvinculacion: new Date().toISOString().split('T')[0]
        })
        .eq('id_nutricionista', nutricionistaId)
        .eq('id_paciente', patientId)
        .eq('activo', true)
        .select()
        .maybeSingle();

      if (relErr) {
        console.error('[DB] Error soft-deleting Relacion_Nutricionista_Paciente row:', relErr);
        return {
          success: false,
          error: `Error de Supabase: ${relErr.message} (Código ${relErr.code || 'sin código'}). Asegúrate de tener políticas de seguridad RLS habilitadas para la actualización (UPDATE) en la tabla 'relacion_nutricionista_paciente'.`
        };
      }

      // Automatically cancel any active plan tied to this specific relacion
      if (relData) {
        const { error: planErr } = await supabase
          .from('planes_nutricionales')
          .update({ id_estado: EstadoPlan.CANCELADO })
          .eq('id_relacion', relData.id_relacion)
          .eq('id_estado', EstadoPlan.ACTIVO);

        if (planErr) {
          console.warn('[DB] Warning: could not cancel active plans during unlinking:', planErr);
        }
      }

      return { success: true };
    }

    // Memory fallback
    let updated = false;
    let unlinkedRelId: number | null = null;
    state.relaciones.forEach(r => {
      if (r.id_nutricionista === nutricionistaId && r.id_paciente === patientId && r.activo !== false) {
        r.activo = false;
        r.fecha_desvinculacion = new Date().toISOString().split('T')[0];
        updated = true;
        unlinkedRelId = r.id_relacion;
      }
    });

    // Deactivate/cancel the active plan tied to the relacion that was just unlinked
    if (unlinkedRelId !== null) {
      state.planes.forEach(p => {
        if (p.id_relacion === unlinkedRelId && p.id_estado === EstadoPlan.ACTIVO) {
          p.id_estado = EstadoPlan.CANCELADO;
        }
      });
    }

    return { success: updated };
  },

  async getPatientPlan(patientId: number): Promise<PlanNutricional | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('planes_nutricionales')
        .select(`
          id_plan, id_relacion, calorias_objetivo, proteinas_objetivo, carbohidratos_objetivo,
          grasas_objetivo, fecha_inicio, fecha_fin, id_estado, fecha_creacion,
          relacion_nutricionista_paciente!inner(id_paciente, id_nutricionista)
        `)
        .eq('relacion_nutricionista_paciente.id_paciente', patientId)
        .eq('id_estado', EstadoPlan.ACTIVO)
        .order('fecha_inicio', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return null;

      const record = data[0] as any;
      const rel = record.relacion_nutricionista_paciente;
      return {
        id_plan: record.id_plan,
        id_relacion: record.id_relacion,
        calorias_objetivo: record.calorias_objetivo,
        proteinas_objetivo: record.proteinas_objetivo,
        carbohidratos_objetivo: record.carbohidratos_objetivo,
        grasas_objetivo: record.grasas_objetivo,
        fecha_inicio: record.fecha_inicio,
        fecha_fin: record.fecha_fin,
        id_estado: Number(record.id_estado) as EstadoPlan,
        fecha_creacion: record.fecha_creacion,
        id_paciente: rel?.id_paciente,
        id_nutricionista: rel?.id_nutricionista
      };
    }

    // Memory fallback
    const relIds = state.relaciones.filter(r => r.id_paciente === patientId).map(r => r.id_relacion);
    const activePlan = state.planes.find(
      p => relIds.includes(p.id_relacion) && p.id_estado === EstadoPlan.ACTIVO
    );
    if (!activePlan) return null;
    const rel = state.relaciones.find(r => r.id_relacion === activePlan.id_relacion);
    return { ...activePlan, id_paciente: rel?.id_paciente, id_nutricionista: rel?.id_nutricionista };
  },

  async savePatientPlan(
    patientId: number,
    nutricionistaId: number,
    plan: Omit<PlanNutricional, 'id_plan' | 'id_relacion' | 'id_estado' | 'id_paciente' | 'id_nutricionista'>
  ): Promise<{ success: boolean; error?: string; plan?: PlanNutricional }> {
    if (isSupabaseConfigured && supabase) {
      const { data: rel, error: relErr } = await supabase
        .from('relacion_nutricionista_paciente')
        .select('id_relacion')
        .eq('id_nutricionista', nutricionistaId)
        .eq('id_paciente', patientId)
        .eq('activo', true)
        .maybeSingle();

      if (relErr || !rel) {
        return { success: false, error: 'No existe un vínculo activo entre este nutricionista y este paciente' };
      }

      // Deactivate every active plan this patient has (across any relacion) before inserting the new one
      const { data: relRows } = await supabase
        .from('relacion_nutricionista_paciente')
        .select('id_relacion')
        .eq('id_paciente', patientId);
      const relIds = (relRows || []).map((r: any) => r.id_relacion);

      if (relIds.length > 0) {
        await supabase
          .from('planes_nutricionales')
          .update({ id_estado: EstadoPlan.CANCELADO })
          .in('id_relacion', relIds)
          .eq('id_estado', EstadoPlan.ACTIVO);
      }

      const { data: newPlanData, error: insertErr } = await supabase.from('planes_nutricionales').insert([{
        id_relacion: rel.id_relacion,
        calorias_objetivo: plan.calorias_objetivo,
        proteinas_objetivo: plan.proteinas_objetivo,
        carbohidratos_objetivo: plan.carbohidratos_objetivo,
        grasas_objetivo: plan.grasas_objetivo,
        fecha_inicio: plan.fecha_inicio,
        fecha_fin: plan.fecha_fin,
        id_estado: EstadoPlan.ACTIVO
      }]).select().single();

      if (insertErr || !newPlanData) {
        return { success: false, error: insertErr?.message || 'Error al guardar el plan' };
      }

      return {
        success: true,
        plan: { ...newPlanData, id_paciente: patientId, id_nutricionista: nutricionistaId } as PlanNutricional
      };
    }

    // Memory fallback
    const activeRel = state.relaciones.find(
      r => r.id_nutricionista === nutricionistaId && r.id_paciente === patientId && r.activo !== false
    );
    if (!activeRel) {
      return { success: false, error: 'No existe un vínculo activo entre este nutricionista y este paciente' };
    }

    // Deactivate every active plan this patient has (across any relacion), mirrors the Supabase branch above
    const relIds = state.relaciones.filter(r => r.id_paciente === patientId).map(r => r.id_relacion);
    state.planes.forEach(p => {
      if (relIds.includes(p.id_relacion) && p.id_estado === EstadoPlan.ACTIVO) {
        p.id_estado = EstadoPlan.CANCELADO;
      }
    });

    const newPlan: PlanNutricional = {
      id_plan: nextPlanId++,
      id_relacion: activeRel.id_relacion,
      calorias_objetivo: plan.calorias_objetivo,
      proteinas_objetivo: plan.proteinas_objetivo,
      carbohidratos_objetivo: plan.carbohidratos_objetivo,
      grasas_objetivo: plan.grasas_objetivo,
      fecha_inicio: plan.fecha_inicio,
      fecha_fin: plan.fecha_fin,
      id_estado: EstadoPlan.ACTIVO
    };

    state.planes.push(newPlan);
    return { success: true, plan: { ...newPlan, id_paciente: patientId, id_nutricionista: nutricionistaId } };
  },

  async getPatientIngestas(patientId: number, dateStr: string): Promise<RegistroIngesta[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('registros_ingesta')
        .select(`
          id_registro, id_paciente, id_plan, id_alimento, cantidad, id_tipo_comida, fecha_hora_consumo,
          alimentos (id_alimento, nombre_alimento, calorias, proteinas, carbohidratos, grasas, medida_cantidad, medida_unidad, codigo_barras, origen)
        `)
        .eq('id_paciente', patientId)
        .gte('fecha_hora_consumo', `${dateStr}T00:00:00Z`)
        .lte('fecha_hora_consumo', `${dateStr}T23:59:59Z`);

      if (error || !data) return [];

      return data.map((d: any) => {
        const al = d.alimentos;
        return {
          id_registro: d.id_registro,
          id_paciente: d.id_paciente,
          id_plan: d.id_plan,
          id_alimento: d.id_alimento,
          cantidad: d.cantidad,
          tipo_comida: idToTipoComida(d.id_tipo_comida),
          fecha_hora_consumo: d.fecha_hora_consumo,
          alimento: al ? {
            id_alimento: al.id_alimento,
            nombre_alimento: al.nombre_alimento,
            calorias: al.calorias,
            proteinas: al.proteinas,
            carbohidratos: al.carbohidratos,
            grasas: al.grasas,
            medida_cantidad: al.medida_cantidad,
            medida_unidad: al.medida_unidad,
            codigo_barras: al.codigo_barras,
            origen: al.origen
          } : undefined
        };
      });
    }

    // Memory fallback
    return state.ingestas
      .filter(i => {
        if (i.id_paciente !== patientId) return false;
        // Verify same date match (YYYY-MM-DD format check)
        const itemDate = i.fecha_hora_consumo.split('T')[0];
        return itemDate === dateStr;
      })
      .map(i => ({
        ...i,
        alimento: state.alimentos.find(a => a.id_alimento === i.id_alimento)
      }));
  },

  async addIngesta(
    patientId: number,
    registro: Omit<RegistroIngesta, 'id_registro' | 'id_paciente'>
  ): Promise<RegistroIngesta> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('registros_ingesta').insert([{
        id_paciente: patientId,
        id_plan: registro.id_plan,
        id_alimento: registro.id_alimento,
        cantidad: registro.cantidad,
        id_tipo_comida: tipoComidaToId(registro.tipo_comida),
        fecha_hora_consumo: registro.fecha_hora_consumo
      }]).select().single();

      const alimento = await this.getAlimentoById(registro.id_alimento);
      return {
        id_registro: data?.id_registro,
        id_paciente: patientId,
        id_plan: registro.id_plan,
        id_alimento: registro.id_alimento,
        cantidad: registro.cantidad,
        tipo_comida: registro.tipo_comida,
        fecha_hora_consumo: registro.fecha_hora_consumo,
        alimento: alimento || undefined
      };
    }

    // Memory fallback
    const newRegistro: RegistroIngesta = {
      id_registro: nextIngestaId++,
      id_paciente: patientId,
      id_plan: registro.id_plan,
      id_alimento: registro.id_alimento,
      cantidad: registro.cantidad,
      tipo_comida: registro.tipo_comida,
      fecha_hora_consumo: registro.fecha_hora_consumo
    };
    state.ingestas.push(newRegistro);
    return {
      ...newRegistro,
      alimento: state.alimentos.find(a => a.id_alimento === registro.id_alimento)
    };
  },

  async deleteIngesta(registroId: number): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('registros_ingesta')
        .delete()
        .eq('id_registro', registroId);
      return !error;
    }

    // Memory fallback
    const initialLen = state.ingestas.length;
    state.ingestas = state.ingestas.filter(i => i.id_registro !== registroId);
    return state.ingestas.length < initialLen;
  },

  async getAlimentoById(id: number): Promise<Alimento | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('alimentos')
        .select('*')
        .eq('id_alimento', id)
        .single();
      if (error || !data) return null;
      return data as Alimento;
    }
    return state.alimentos.find(a => a.id_alimento === id) || null;
  },

  async getAlimentoByBarcode(codigo: string): Promise<Alimento | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('alimentos')
        .select('*')
        .eq('codigo_barras', codigo)
        .maybeSingle();
      if (error || !data) return null;
      return data as Alimento;
    }
    return state.alimentos.find(a => a.codigo_barras === codigo) || null;
  },

  async getAlimentos(): Promise<Alimento[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('alimentos')
        .select('*')
        .order('nombre_alimento', { ascending: true });
      if (error || !data) return [];
      // Los alimentos 'Personalizado' (creados al vuelo desde una receta guardada) no se
      // muestran en el catalogo compartido, igual que antes con el prefijo 'custom_'.
      return (data as Alimento[]).filter(a => a && a.origen !== 'Personalizado');
    }
    return [...state.alimentos]
      .filter(a => a && a.origen !== 'Personalizado')
      .sort((a,b) => (a.nombre_alimento || '').localeCompare(b.nombre_alimento || ''));
  },

  async addAlimento(al: Omit<Alimento, 'id_alimento'>): Promise<Alimento> {
    const payload = {
      nombre_alimento: al.nombre_alimento,
      calorias: al.calorias,
      proteinas: al.proteinas,
      carbohidratos: al.carbohidratos,
      grasas: al.grasas,
      medida_cantidad: al.medida_cantidad,
      medida_unidad: al.medida_unidad,
      codigo_barras: al.codigo_barras || null,
      origen: al.origen || 'Local'
    };

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('alimentos').insert([payload]).select().single();
      return { ...payload, id_alimento: data?.id_alimento, codigo_barras: payload.codigo_barras || undefined } as Alimento;
    }

    // Memory fallback
    const newAlimento: Alimento = { ...payload, id_alimento: nextAlimentoId++, codigo_barras: payload.codigo_barras || undefined };
    state.alimentos.push(newAlimento);
    return newAlimento;
  }
};
