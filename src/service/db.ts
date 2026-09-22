/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
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
      const { data, error } = await supabase.from('Alimentos').select('id_alimento').limit(1);
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
  { id_persona: 'p-1', nombre: 'Bernardo', apellido: 'Gonella', genero: 'Masculino', dni: '44555666', fecha_nacimiento: '1985-05-15' },
  { id_persona: 'p-2', nombre: 'Agustin', apellido: 'Posse', genero: 'Masculino', dni: '45111222', fecha_nacimiento: '1998-10-20' },
  { id_persona: 'p-3', nombre: 'Joaquin', apellido: 'Gargiulo', genero: 'Masculino', dni: '45222333', fecha_nacimiento: '2000-02-12' },
  { id_persona: 'p-4', nombre: 'Marcos', apellido: 'Parra', genero: 'Masculino', dni: '45333444', fecha_nacimiento: '1999-07-28' },
  { id_persona: 'p-5', nombre: 'Matias', apellido: 'Garzon', genero: 'Masculino', dni: '45444555', fecha_nacimiento: '2001-11-04' },
];

const mockUsuarios: Usuario[] = [
  { id_usuario: 'u-1', nombre_usuario: 'bernardo.g', email: 'bernardo@nutricount.com', hash_contrasena: 'admin', id_persona: 'p-1', rol: UserRole.NUTRICIONISTA },
  { id_usuario: 'u-2', nombre_usuario: 'agustin.p', email: 'agustin@nutricount.com', hash_contrasena: 'user', id_persona: 'p-2', rol: UserRole.PACIENTE },
  { id_usuario: 'u-3', nombre_usuario: 'joaquin.g', email: 'joaquin@nutricount.com', hash_contrasena: 'user', id_persona: 'p-3', rol: UserRole.PACIENTE },
  { id_usuario: 'u-4', nombre_usuario: 'marcos.p', email: 'marcos@nutricount.com', hash_contrasena: 'user', id_persona: 'p-4', rol: UserRole.PACIENTE },
];

const mockRelaciones: RelacionNutricionistaPaciente[] = [
  { id_relacion: 'r-1', id_nutricionista: 'u-1', id_paciente: 'u-2', fecha_vinculacion: '2026-06-01' },
  { id_relacion: 'r-2', id_nutricionista: 'u-1', id_paciente: 'u-3', fecha_vinculacion: '2026-06-02' },
  { id_relacion: 'r-3', id_nutricionista: 'u-1', id_paciente: 'u-4', fecha_vinculacion: '2026-06-03' },
];

const mockAlimentos: Alimento[] = [
  // LACTEOS
  { id_alimento: 'lac_leche_entera', nombre_alimento: 'Leche entera', calorias: 60, proteinas: 3.2, carbohidratos: 4.5, grasas: 3.3, medida_cantidad: 100, medida_unidad: 'ml' },
  { id_alimento: 'lac_leche_descremada', nombre_alimento: 'Leche descremada', calorias: 34, proteinas: 3.4, carbohidratos: 5.0, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'ml' },
  { id_alimento: 'lac_yogur_natural_entero', nombre_alimento: 'Yogur natural entero', calorias: 61, proteinas: 3.5, carbohidratos: 4.7, grasas: 3.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_yogur_natural_descremado', nombre_alimento: 'Yogur natural descremado', calorias: 56, proteinas: 5.7, carbohidratos: 7.7, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_yogur_griego_natural', nombre_alimento: 'Yogur griego natural', calorias: 97, proteinas: 9.0, carbohidratos: 3.6, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_queso_crema', nombre_alimento: 'Queso crema', calorias: 342, proteinas: 6.0, carbohidratos: 4.0, grasas: 34.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_queso_untable_light', nombre_alimento: 'Queso untable light', calorias: 180, proteinas: 10.0, carbohidratos: 6.0, grasas: 12.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_queso_mozzarella', nombre_alimento: 'Queso mozzarella', calorias: 280, proteinas: 22.0, carbohidratos: 2.2, grasas: 22.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_queso_tybo_barra', nombre_alimento: 'Queso tybo / barra', calorias: 330, proteinas: 24.0, carbohidratos: 2.0, grasas: 26.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_queso_port_salut', nombre_alimento: 'Queso port salut', calorias: 290, proteinas: 22.0, carbohidratos: 2.0, grasas: 23.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_ricota_entera', nombre_alimento: 'Ricota entera', calorias: 174, proteinas: 11.0, carbohidratos: 3.0, grasas: 13.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_manteca', nombre_alimento: 'Manteca', calorias: 717, proteinas: 0.9, carbohidratos: 0.1, grasas: 81.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'lac_crema_de_leche', nombre_alimento: 'Crema de leche', calorias: 340, proteinas: 2.0, carbohidratos: 3.0, grasas: 36.0, medida_cantidad: 100, medida_unidad: 'g' },

  // HUEVOS
  { id_alimento: 'hue_huevo_entero', nombre_alimento: 'Huevo entero', calorias: 143, proteinas: 12.6, carbohidratos: 0.7, grasas: 9.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'hue_clara_huevo', nombre_alimento: 'Clara de huevo', calorias: 52, proteinas: 10.9, carbohidratos: 0.7, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'hue_yema_huevo', nombre_alimento: 'Yema de huevo', calorias: 322, proteinas: 15.9, carbohidratos: 3.6, grasas: 26.5, medida_cantidad: 100, medida_unidad: 'g' },

  // CARNE VACUNA
  { id_alimento: 'vac_carne_picada_magra_cruda', nombre_alimento: 'Carne picada magra cruda 90/10', calorias: 176, proteinas: 20.0, carbohidratos: 0.0, grasas: 10.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_carne_picada_comun_cruda', nombre_alimento: 'Carne picada comun cruda 80/20', calorias: 254, proteinas: 17.0, carbohidratos: 0.0, grasas: 20.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_nalga_cruda', nombre_alimento: 'Nalga cruda', calorias: 150, proteinas: 21.0, carbohidratos: 0.0, grasas: 6.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_bola_lomo_cruda', nombre_alimento: 'Bola de lomo cruda', calorias: 160, proteinas: 21.0, carbohidratos: 0.0, grasas: 7.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_cuadrada_cruda', nombre_alimento: 'Cuadrada cruda', calorias: 165, proteinas: 21.0, carbohidratos: 0.0, grasas: 8.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_peceto_crudo', nombre_alimento: 'Peceto crudo', calorias: 145, proteinas: 22.0, carbohidratos: 0.0, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_lomo_crudo', nombre_alimento: 'Lomo crudo', calorias: 180, proteinas: 20.0, carbohidratos: 0.0, grasas: 10.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_bife_angosto_crudo', nombre_alimento: 'Bife angosto crudo', calorias: 210, proteinas: 19.0, carbohidratos: 0.0, grasas: 14.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_vacio_crudo', nombre_alimento: 'Vacio crudo', calorias: 240, proteinas: 18.0, carbohidratos: 0.0, grasas: 18.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_asado_crudo', nombre_alimento: 'Asado crudo', calorias: 290, proteinas: 17.0, carbohidratos: 0.0, grasas: 24.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_matambre_crudo', nombre_alimento: 'Matambre crudo', calorias: 250, proteinas: 18.0, carbohidratos: 0.0, grasas: 19.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'vac_higado_vacuno_crudo', nombre_alimento: 'Higado vacuno crudo', calorias: 135, proteinas: 20.0, carbohidratos: 4.0, grasas: 4.0, medida_cantidad: 100, medida_unidad: 'g' },

  // POLLO Y AVES
  { id_alimento: 'ave_pechuga_pollo_cruda', nombre_alimento: 'Pechuga de pollo sin piel cruda', calorias: 120, proteinas: 23.0, carbohidratos: 0.0, grasas: 2.6, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ave_pechuga_pollo_cocida', nombre_alimento: 'Pechuga de pollo sin piel cocida', calorias: 165, proteinas: 31.0, carbohidratos: 0.0, grasas: 3.6, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ave_muslo_pollo_sin_piel_crudo', nombre_alimento: 'Muslo de pollo sin piel crudo', calorias: 125, proteinas: 19.0, carbohidratos: 0.0, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ave_pata_muslo_con_piel_crudo', nombre_alimento: 'Pata-muslo con piel crudo', calorias: 215, proteinas: 17.0, carbohidratos: 0.0, grasas: 16.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ave_ala_pollo_con_piel_cruda', nombre_alimento: 'Ala de pollo con piel cruda', calorias: 220, proteinas: 18.0, carbohidratos: 0.0, grasas: 16.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ave_pollo_entero_con_piel_crudo', nombre_alimento: 'Pollo entero con piel crudo', calorias: 190, proteinas: 18.0, carbohidratos: 0.0, grasas: 13.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ave_pavo_pechuga_cruda', nombre_alimento: 'Pavo pechuga cruda', calorias: 110, proteinas: 24.0, carbohidratos: 0.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },

  // CERDO
  { id_alimento: 'cer_bondiola_cruda', nombre_alimento: 'Bondiola de cerdo cruda', calorias: 260, proteinas: 17.0, carbohidratos: 0.0, grasas: 21.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_carre_crudo', nombre_alimento: 'Carre de cerdo crudo', calorias: 165, proteinas: 21.0, carbohidratos: 0.0, grasas: 8.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_solomillo_crudo', nombre_alimento: 'Solomillo de cerdo crudo', calorias: 120, proteinas: 22.0, carbohidratos: 0.0, grasas: 3.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_costilla_cruda', nombre_alimento: 'Costilla de cerdo cruda', calorias: 290, proteinas: 17.0, carbohidratos: 0.0, grasas: 24.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_jamon_cocido', nombre_alimento: 'Jamon cocido', calorias: 145, proteinas: 20.0, carbohidratos: 2.0, grasas: 6.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_panceta', nombre_alimento: 'Panceta', calorias: 540, proteinas: 37.0, carbohidratos: 1.0, grasas: 42.0, medida_cantidad: 100, medida_unidad: 'g' },

  // PESCADOS Y MARISCOS
  { id_alimento: 'pes_merluza_cruda', nombre_alimento: 'Merluza cruda', calorias: 80, proteinas: 17.0, carbohidratos: 0.0, grasas: 1.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_atun_al_natural_escurrido', nombre_alimento: 'Atun al natural escurrido', calorias: 116, proteinas: 26.0, carbohidratos: 0.0, grasas: 1.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_atun_en_aceite_escurrido', nombre_alimento: 'Atun en aceite escurrido', calorias: 198, proteinas: 29.0, carbohidratos: 0.0, grasas: 8.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_salmon_crudo', nombre_alimento: 'Salmon crudo', calorias: 208, proteinas: 20.0, carbohidratos: 0.0, grasas: 13.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_sardina', nombre_alimento: 'Sardina', calorias: 208, proteinas: 25.0, carbohidratos: 0.0, grasas: 11.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_caballa', nombre_alimento: 'Caballa', calorias: 205, proteinas: 19.0, carbohidratos: 0.0, grasas: 14.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_lenguado_crudo', nombre_alimento: 'Lenguado crudo', calorias: 86, proteinas: 18.0, carbohidratos: 0.0, grasas: 1.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_corvina_cruda', nombre_alimento: 'Corvina cruda', calorias: 100, proteinas: 20.0, carbohidratos: 0.0, grasas: 2.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_camarones_cocidos', nombre_alimento: 'Camarones cocidos', calorias: 99, proteinas: 24.0, carbohidratos: 0.2, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pes_calamar_crudo', nombre_alimento: 'Calamar crudo', calorias: 92, proteinas: 15.6, carbohidratos: 3.1, grasas: 1.4, medida_cantidad: 100, medida_unidad: 'g' },

  // PANES Y HARINAS
  { id_alimento: 'pan_pan_blanco', nombre_alimento: 'Pan blanco', calorias: 265, proteinas: 8.5, carbohidratos: 49.0, grasas: 3.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_pan_integral', nombre_alimento: 'Pan integral', calorias: 247, proteinas: 13.0, carbohidratos: 41.0, grasas: 4.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_pan_frances', nombre_alimento: 'Pan frances', calorias: 270, proteinas: 8.8, carbohidratos: 56.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_pan_lactal_blanco', nombre_alimento: 'Pan lactal blanco', calorias: 260, proteinas: 8.0, carbohidratos: 49.0, grasas: 3.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_pan_lactal_integral', nombre_alimento: 'Pan lactal integral', calorias: 250, proteinas: 10.0, carbohidratos: 43.0, grasas: 4.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_tortilla_trigo', nombre_alimento: 'Tortilla de trigo', calorias: 310, proteinas: 8.0, carbohidratos: 52.0, grasas: 8.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_harina_trigo', nombre_alimento: 'Harina de trigo 000/0000', calorias: 364, proteinas: 10.0, carbohidratos: 76.0, grasas: 1.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_harina_integral', nombre_alimento: 'Harina integral', calorias: 340, proteinas: 13.0, carbohidratos: 72.0, grasas: 2.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_harina_avena', nombre_alimento: 'Harina de avena', calorias: 389, proteinas: 16.9, carbohidratos: 66.3, grasas: 6.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'pan_pan_rallado', nombre_alimento: 'Pan rallado', calorias: 395, proteinas: 13.0, carbohidratos: 72.0, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' },

  // CEREALES, ARROZ Y PASTAS
  { id_alimento: 'cer_arroz_blanco_crudo', nombre_alimento: 'Arroz blanco crudo', calorias: 365, proteinas: 7.1, carbohidratos: 80.0, grasas: 0.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_arroz_blanco_cocido', nombre_alimento: 'Arroz blanco cocido', calorias: 130, proteinas: 2.7, carbohidratos: 28.2, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_arroz_integral_crudo', nombre_alimento: 'Arroz integral crudo', calorias: 370, proteinas: 7.5, carbohidratos: 77.0, grasas: 2.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_arroz_integral_cocido', nombre_alimento: 'Arroz integral cocido', calorias: 112, proteinas: 2.3, carbohidratos: 23.5, grasas: 0.8, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_fideos_secos_crudos', nombre_alimento: 'Fideos secos crudos', calorias: 371, proteinas: 13.0, carbohidratos: 75.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_fideos_cocidos', nombre_alimento: 'Fideos cocidos', calorias: 158, proteinas: 5.8, carbohidratos: 30.9, grasas: 0.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_avena_tradicional_seca', nombre_alimento: 'Avena tradicional seca', calorias: 389, proteinas: 16.9, carbohidratos: 66.3, grasas: 6.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_quinoa_cruda', nombre_alimento: 'Quinoa cruda', calorias: 368, proteinas: 14.1, carbohidratos: 64.2, grasas: 6.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_quinoa_cocida', nombre_alimento: 'Quinoa cocida', calorias: 120, proteinas: 4.4, carbohidratos: 21.3, grasas: 1.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_polenta_seca', nombre_alimento: 'Polenta / harina de maiz seca', calorias: 365, proteinas: 7.0, carbohidratos: 79.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_polenta_cocida_agua', nombre_alimento: 'Polenta cocida en agua', calorias: 70, proteinas: 1.6, carbohidratos: 15.0, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_copos_maiz_sin_azucar', nombre_alimento: 'Copos de maiz sin azucar', calorias: 357, proteinas: 7.5, carbohidratos: 84.0, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'cer_granola_comun', nombre_alimento: 'Granola comun', calorias: 450, proteinas: 10.0, carbohidratos: 64.0, grasas: 17.0, medida_cantidad: 100, medida_unidad: 'g' },

  // LEGUMBRES
  { id_alimento: 'leg_lentejas_secas', nombre_alimento: 'Lentejas secas', calorias: 352, proteinas: 24.6, carbohidratos: 63.0, grasas: 1.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'leg_lentejas_cocidas', nombre_alimento: 'Lentejas cocidas', calorias: 116, proteinas: 9.0, carbohidratos: 20.0, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'leg_garbanzos_secos', nombre_alimento: 'Garbanzos secos', calorias: 364, proteinas: 19.0, carbohidratos: 61.0, grasas: 6.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'leg_garbanzos_cocidos', nombre_alimento: 'Garbanzos cocidos', calorias: 164, proteinas: 8.9, carbohidratos: 27.4, grasas: 2.6, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'leg_porotos_negros_cocidos', nombre_alimento: 'Porotos negros cocidos', calorias: 132, proteinas: 8.9, carbohidratos: 23.7, grasas: 0.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'leg_porotos_blancos_cocidos', nombre_alimento: 'Porotos blancos cocidos', calorias: 139, proteinas: 9.7, carbohidratos: 25.1, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'leg_arvejas_cocidas', nombre_alimento: 'Arvejas cocidas', calorias: 84, proteinas: 5.4, carbohidratos: 15.6, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'leg_soja_cocida', nombre_alimento: 'Soja cocida', calorias: 172, proteinas: 18.2, carbohidratos: 8.4, grasas: 9.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'leg_hummus', nombre_alimento: 'Hummus', calorias: 166, proteinas: 7.9, carbohidratos: 14.3, grasas: 9.6, medida_cantidad: 100, medida_unidad: 'g' },

  // FRUTAS
  { id_alimento: 'fru_banana', nombre_alimento: 'Banana', calorias: 89, proteinas: 1.1, carbohidratos: 22.8, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_manzana', nombre_alimento: 'Manzana', calorias: 52, proteinas: 0.3, carbohidratos: 13.8, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_naranja', nombre_alimento: 'Naranja', calorias: 47, proteinas: 0.9, carbohidratos: 11.8, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_mandarina', nombre_alimento: 'Mandarina', calorias: 53, proteinas: 0.8, carbohidratos: 13.3, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_pera', nombre_alimento: 'Pera', calorias: 57, proteinas: 0.4, carbohidratos: 15.2, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_durazno', nombre_alimento: 'Durazno', calorias: 39, proteinas: 0.9, carbohidratos: 9.5, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_ciruela', nombre_alimento: 'Ciruela', calorias: 46, proteinas: 0.7, carbohidratos: 11.4, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_uva', nombre_alimento: 'Uva', calorias: 69, proteinas: 0.7, carbohidratos: 18.1, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_frutilla', nombre_alimento: 'Frutilla', calorias: 32, proteinas: 0.7, carbohidratos: 7.7, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_arandanos', nombre_alimento: 'Arandanos', calorias: 57, proteinas: 0.7, carbohidratos: 14.5, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_mango', nombre_alimento: 'Mango', calorias: 60, proteinas: 0.8, carbohidratos: 15.0, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_anana', nombre_alimento: 'Anana', calorias: 50, proteinas: 0.5, carbohidratos: 13.1, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_kiwi', nombre_alimento: 'Kiwi', calorias: 61, proteinas: 1.1, carbohidratos: 14.7, grasas: 0.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_sandia', nombre_alimento: 'Sandia', calorias: 30, proteinas: 0.6, carbohidratos: 7.6, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_melon', nombre_alimento: 'Melon', calorias: 34, proteinas: 0.8, carbohidratos: 8.2, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_palta', nombre_alimento: 'Palta', calorias: 160, proteinas: 2.0, carbohidratos: 8.5, grasas: 14.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'fru_limon', nombre_alimento: 'Limon', calorias: 29, proteinas: 1.1, carbohidratos: 9.3, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },

  // VERDURAS Y HORTALIZAS
  { id_alimento: 'ver_lechuga_cruda', nombre_alimento: 'Lechuga cruda', calorias: 15, proteinas: 1.4, carbohidratos: 2.9, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_tomate_crudo', nombre_alimento: 'Tomate crudo', calorias: 18, proteinas: 0.9, carbohidratos: 3.9, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_cebolla_cruda', nombre_alimento: 'Cebolla cruda', calorias: 40, proteinas: 1.1, carbohidratos: 9.3, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_zanahoria_cruda', nombre_alimento: 'Zanahoria cruda', calorias: 41, proteinas: 0.9, carbohidratos: 9.6, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_morron_rojo_crudo', nombre_alimento: 'Morron rojo crudo', calorias: 31, proteinas: 1.0, carbohidratos: 6.0, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_morron_verde_crudo', nombre_alimento: 'Morron verde crudo', calorias: 20, proteinas: 0.9, carbohidratos: 4.6, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_espinaca_cruda', nombre_alimento: 'Espinaca cruda', calorias: 23, proteinas: 2.9, carbohidratos: 3.6, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_acelga_cruda', nombre_alimento: 'Acelga cruda', calorias: 19, proteinas: 1.8, carbohidratos: 3.7, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_brocoli_crudo', nombre_alimento: 'Brocoli crudo', calorias: 34, proteinas: 2.8, carbohidratos: 6.6, grasas: 0.4, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_coliflor_cruda', nombre_alimento: 'Coliflor cruda', calorias: 25, proteinas: 1.9, carbohidratos: 5.0, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_zapallito_crudo', nombre_alimento: 'Zapallito crudo', calorias: 17, proteinas: 1.2, carbohidratos: 3.1, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_zucchini_crudo', nombre_alimento: 'Zucchini crudo', calorias: 17, proteinas: 1.2, carbohidratos: 3.1, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_berenjena_cruda', nombre_alimento: 'Berenjena cruda', calorias: 25, proteinas: 1.0, carbohidratos: 5.9, grasas: 0.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_pepino_crudo', nombre_alimento: 'Pepino crudo', calorias: 15, proteinas: 0.7, carbohidratos: 3.6, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_repollo_crudo', nombre_alimento: 'Repollo crudo', calorias: 25, proteinas: 1.3, carbohidratos: 5.8, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_champinones_crudos', nombre_alimento: 'Champinones crudos', calorias: 22, proteinas: 3.1, carbohidratos: 3.3, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'ver_ajo_crudo', nombre_alimento: 'Ajo crudo', calorias: 149, proteinas: 6.4, carbohidratos: 33.1, grasas: 0.5, medida_cantidad: 100, medida_unidad: 'g' },

  // TUBERCULOS Y SIMILARES
  { id_alimento: 'tub_papa_cruda', nombre_alimento: 'Papa cruda', calorias: 77, proteinas: 2.0, carbohidratos: 17.5, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'tub_papa_hervida', nombre_alimento: 'Papa hervida', calorias: 87, proteinas: 1.9, carbohidratos: 20.1, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'tub_batata_cruda', nombre_alimento: 'Batata cruda', calorias: 86, proteinas: 1.6, carbohidratos: 20.1, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'tub_batata_hervida', nombre_alimento: 'Batata hervida', calorias: 76, proteinas: 1.4, carbohidratos: 17.7, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'tub_mandioca_cruda', nombre_alimento: 'Mandioca cruda', calorias: 160, proteinas: 1.4, carbohidratos: 38.1, grasas: 0.3, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'tub_choclo_cocido', nombre_alimento: 'Choclo cocido', calorias: 96, proteinas: 3.4, carbohidratos: 21.0, grasas: 1.5, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'tub_calabaza_cocida', nombre_alimento: 'Calabaza cocida', calorias: 20, proteinas: 0.7, carbohidratos: 4.9, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },

  // FRUTOS SECOS, SEMILLAS Y GRASAS
  { id_alimento: 'gra_aceite_oliva', nombre_alimento: 'Aceite de oliva', calorias: 884, proteinas: 0.0, carbohidratos: 0.0, grasas: 100.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_aceite_girasol', nombre_alimento: 'Aceite de girasol', calorias: 884, proteinas: 0.0, carbohidratos: 0.0, grasas: 100.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_mayonesa', nombre_alimento: 'Mayonesa', calorias: 680, proteinas: 1.0, carbohidratos: 1.0, grasas: 75.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_mani', nombre_alimento: 'Mani', calorias: 567, proteinas: 25.8, carbohidratos: 16.1, grasas: 49.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_mantequilla_mani', nombre_alimento: 'Mantequilla de mani', calorias: 588, proteinas: 25.0, carbohidratos: 20.0, grasas: 50.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_almendras', nombre_alimento: 'Almendras', calorias: 579, proteinas: 21.2, carbohidratos: 21.6, grasas: 49.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_nueces', nombre_alimento: 'Nueces', calorias: 654, proteinas: 15.2, carbohidratos: 13.7, grasas: 65.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_castanas_caju', nombre_alimento: 'Castanas de caju', calorias: 553, proteinas: 18.2, carbohidratos: 30.2, grasas: 43.9, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_semillas_chia', nombre_alimento: 'Semillas de chia', calorias: 486, proteinas: 16.5, carbohidratos: 42.1, grasas: 30.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_semillas_lino', nombre_alimento: 'Semillas de lino', calorias: 534, proteinas: 18.3, carbohidratos: 28.9, grasas: 42.2, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'gra_semillas_girasol', nombre_alimento: 'Semillas de girasol', calorias: 584, proteinas: 20.8, carbohidratos: 20.0, grasas: 51.5, medida_cantidad: 100, medida_unidad: 'g' },

  // AZUCARES, DULCES Y BASICOS
  { id_alimento: 'bas_azucar', nombre_alimento: 'Azucar', calorias: 387, proteinas: 0.0, carbohidratos: 100.0, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'bas_miel', nombre_alimento: 'Miel', calorias: 304, proteinas: 0.3, carbohidratos: 82.4, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'bas_dulce_de_leche', nombre_alimento: 'Dulce de leche', calorias: 315, proteinas: 7.0, carbohidratos: 55.0, grasas: 7.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'bas_mermelada', nombre_alimento: 'Mermelada', calorias: 250, proteinas: 0.3, carbohidratos: 65.0, grasas: 0.1, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'bas_cacao_amargo', nombre_alimento: 'Cacao amargo', calorias: 228, proteinas: 19.6, carbohidratos: 57.9, grasas: 13.7, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'bas_chocolate_comun', nombre_alimento: 'Chocolate comun', calorias: 535, proteinas: 7.7, carbohidratos: 59.0, grasas: 30.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'bas_sal', nombre_alimento: 'Sal', calorias: 0, proteinas: 0.0, carbohidratos: 0.0, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'bas_vinagre', nombre_alimento: 'Vinagre', calorias: 18, proteinas: 0.0, carbohidratos: 0.0, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'g' },
  { id_alimento: 'bas_cafe_preparado_sin_azucar', nombre_alimento: 'Cafe preparado sin azucar', calorias: 1, proteinas: 0.1, carbohidratos: 0.0, grasas: 0.0, medida_cantidad: 100, medida_unidad: 'ml' },
  { id_alimento: 'bas_yerba_mate_seca', nombre_alimento: 'Yerba mate seca', calorias: 280, proteinas: 12.0, carbohidratos: 50.0, grasas: 5.0, medida_cantidad: 100, medida_unidad: 'g' }
];

const mockPlanes: PlanNutricional[] = [
  {
    id_plan: 'plan-1',
    id_paciente: 'u-2',
    id_nutricionista: 'u-1',
    calorias_objetivo: 2200,
    proteinas_objetivo: 140,
    carbohidratos_objetivo: 250,
    grasas_objetivo: 70,
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-06-30',
    id_estado: EstadoPlan.ACTIVO,
  },
  {
    id_plan: 'plan-2',
    id_paciente: 'u-3',
    id_nutricionista: 'u-1',
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
  { id_registro: 'i-1', id_paciente: 'u-2', id_plan: 'plan-1', id_alimento: 'cer_avena_tradicional_seca', cantidad: 80, tipo_comida: 'Desayuno', fecha_hora_consumo: `${todayStr}T08:30:00Z` },
  { id_registro: 'i-2', id_paciente: 'u-2', id_plan: 'plan-1', id_alimento: 'lac_yogur_griego_natural', cantidad: 150, tipo_comida: 'Desayuno', fecha_hora_consumo: `${todayStr}T08:32:00Z` },
  { id_registro: 'i-3', id_paciente: 'u-2', id_plan: 'plan-1', id_alimento: 'fru_banana', cantidad: 120, tipo_comida: 'Desayuno', fecha_hora_consumo: `${todayStr}T08:35:00Z` },
  { id_registro: 'i-4', id_paciente: 'u-2', id_plan: 'plan-1', id_alimento: 'ave_pechuga_pollo_cocida', cantidad: 200, tipo_comida: 'Almuerzo', fecha_hora_consumo: `${todayStr}T13:15:00Z` },
  { id_registro: 'i-5', id_paciente: 'u-2', id_plan: 'plan-1', id_alimento: 'cer_arroz_integral_cocido', cantidad: 150, tipo_comida: 'Almuerzo', fecha_hora_consumo: `${todayStr}T13:20:00Z` },
  { id_registro: 'i-6', id_paciente: 'u-2', id_plan: 'plan-1', id_alimento: 'gra_aceite_oliva', cantidad: 10, tipo_comida: 'Almuerzo', fecha_hora_consumo: `${todayStr}T13:22:00Z` },
];

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
      // Direct supabase flow (simulate join with personas and roles)
      // For academic simple presentation, we can support simple query or fallback logic
      const { data, error } = await supabase
        .from('Usuarios')
        .select(`
          id_usuario, nombre_usuario, email, hash_contrasena, id_persona,
          Personas (nombre, apellido, genero, dni, fecha_nacimiento),
          Relacion_Rol_Usuario (id_rol, Roles (nombre_rol))
        `)
        .eq('email', email)
        .single();

      if (error || !data || (data as any).hash_contrasena !== pass) return null;
      
      const d = data as any;
      const p = d.Personas;
      const rolName = d.Relacion_Rol_Usuario?.[0]?.Roles?.nombre_rol || UserRole.PACIENTE;

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
          dni: Array.isArray(p) ? p[0]?.dni : p.dni,
          fecha_nacimiento: Array.isArray(p) ? p[0]?.fecha_nacimiento : p.fecha_nacimiento
        } : undefined,
        rol: rolName as UserRole
      };
    }

    // In-memory fallback authentication
    const user = state.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.hash_contrasena !== pass) return null;

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
    genero?: string,
    dni?: string,
    fecha_nacimiento?: string
  ): Promise<Usuario> {
    const id_p = 'p-' + Math.random().toString(36).substring(2, 9);
    const id_u = 'u-' + Math.random().toString(36).substring(2, 9);

    const newPersona: Persona = {
      id_persona: id_p,
      nombre,
      apellido,
      genero: genero || 'No especificado',
      dni: dni || '',
      fecha_nacimiento: fecha_nacimiento || ''
    };

    const newUsuario: Usuario = {
      id_usuario: id_u,
      nombre_usuario: email.split('@')[0],
      email,
      hash_contrasena: pass,
      id_persona: id_p,
      rol: role
    };

    if (isSupabaseConfigured && supabase) {
      // Perform sequential insertions in Supabase
      await supabase.from('Personas').insert([{
        id_persona: id_p,
        nombre,
        apellido,
        genero: genero || 'No especificado',
        dni: dni || null,
        fecha_nacimiento: fecha_nacimiento || null
      }]);

      await supabase.from('Usuarios').insert([{
        id_usuario: id_u,
        nombre_usuario: newUsuario.nombre_usuario,
        email,
        hash_contrasena: pass,
        id_persona: id_p
      }]);

      // Look up rol id or insert relation
      // Academic presentation: standard mapping: 1 for Nutricionista, 2 for Paciente
      const rolId = role === UserRole.NUTRICIONISTA ? 1 : 2;
      await supabase.from('Relacion_Rol_Usuario').insert([{
        id_usuario: id_u,
        id_rol: rolId
      }]);

      return { ...newUsuario, persona: newPersona };
    }

    // In memory fallback
    state.personas.push(newPersona);
    state.usuarios.push(newUsuario);
    return { ...newUsuario, persona: newPersona };
  },

  async getPatients(nutricionistaId: string): Promise<Usuario[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('Relacion_Nutricionista_Paciente')
        .select(`
          id_paciente,
          Usuarios:id_paciente (
            id_usuario, nombre_usuario, email, id_persona,
            Personas (nombre, apellido, genero, dni, fecha_nacimiento)
          )
        `)
        .eq('id_nutricionista', nutricionistaId)
        .eq('activo', true);

      if (error || !data) return [];
      
      return data.map((d: any) => {
        const u = d.Usuarios;
        const p = u.Personas;
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
            dni: p.dni,
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

  async linkPatient(nutricionistaId: string, email: string): Promise<{ success: boolean; error?: string; patient?: Usuario }> {
    if (isSupabaseConfigured && supabase) {
      // Find patient user in Supabase
      const { data: user, error: userErr } = await supabase
        .from('Usuarios')
        .select(`
          id_usuario, nombre_usuario, email, id_persona,
          Personas (nombre, apellido, genero, dni, fecha_nacimiento)
        `)
        .eq('email', email)
        .single();

      if (userErr || !user) {
        return { success: false, error: 'El usuario no está registrado en Nutri Count' };
      }

      // Check if an active link already exists
      const { data: activeLink } = await supabase
        .from('Relacion_Nutricionista_Paciente')
        .select('*')
        .eq('id_nutricionista', nutricionistaId)
        .eq('id_paciente', user.id_usuario)
        .eq('activo', true)
        .maybeSingle();

      if (activeLink) {
        return { success: false, error: 'Este paciente ya está vinculado a tu cuenta de forma activa.' };
      }

      // Always insert a brand new link to preserve history
      const idRel = 'r-' + Math.random().toString(36).substring(2, 9);
      const { error: insertErr } = await supabase.from('Relacion_Nutricionista_Paciente').insert([{
        id_relacion: idRel,
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
      const p = u.Personas;
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
            dni: Array.isArray(p) ? p[0]?.dni : p.dni,
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
    const id_rel = 'r-' + Math.random().toString(36).substring(2, 9);
    const newRel: RelacionNutricionistaPaciente = {
      id_relacion: id_rel,
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

  async unlinkPatient(nutricionistaId: string, patientId: string): Promise<{ success: boolean; error?: string }> {
    console.log(`[DB] unlinkPatient (baja lógica) called: nutricionistaId=${nutricionistaId}, patientId=${patientId}`);
    if (isSupabaseConfigured && supabase) {
      const { error: relErr } = await supabase
        .from('Relacion_Nutricionista_Paciente')
        .update({ 
          activo: false, 
          fecha_desvinculacion: new Date().toISOString().split('T')[0] 
        })
        .eq('id_nutricionista', nutricionistaId)
        .eq('id_paciente', patientId)
        .eq('activo', true);
      
      if (relErr) {
        console.error('[DB] Error soft-deleting Relacion_Nutricionista_Paciente row:', relErr);
        return { 
          success: false, 
          error: `Error de Supabase: ${relErr.message} (Código ${relErr.code || 'sin código'}). Asegúrate de tener políticas de seguridad RLS habilitadas para la actualización (UPDATE) en la tabla 'Relacion_Nutricionista_Paciente'.` 
        };
      }

      // Automatically cancel any active plans between this nutritionist and patient
      const { error: planErr } = await supabase
        .from('Planes_Nutricionales')
        .update({ id_estado: EstadoPlan.CANCELADO })
        .eq('id_paciente', patientId)
        .eq('id_nutricionista', nutricionistaId)
        .eq('id_estado', EstadoPlan.ACTIVO);

      if (planErr) {
        console.warn('[DB] Warning: could not cancel active plans during unlinking:', planErr);
      }

      return { success: true };
    }

    // Memory fallback
    let updated = false;
    state.relaciones.forEach(r => {
      if (r.id_nutricionista === nutricionistaId && r.id_paciente === patientId && r.activo !== false) {
        r.activo = false;
        r.fecha_desvinculacion = new Date().toISOString().split('T')[0];
        updated = true;
      }
    });
    
    // Deactivate/cancel active plans in memory
    state.planes.forEach(p => {
      if (p.id_paciente === patientId && p.id_nutricionista === nutricionistaId && p.id_estado === EstadoPlan.ACTIVO) {
        p.id_estado = EstadoPlan.CANCELADO;
      }
    });

    return { success: updated };
  },

  async getPatientPlan(patientId: string): Promise<PlanNutricional | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('Planes_Nutricionales')
        .select('*')
        .eq('id_paciente', patientId)
        .eq('id_estado', EstadoPlan.ACTIVO)
        .order('fecha_inicio', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return null;
      
      const record = data[0];
      return {
        id_plan: record.id_plan,
        id_paciente: record.id_paciente,
        id_nutricionista: record.id_nutricionista,
        calorias_objetivo: record.calorias_objetivo,
        proteinas_objetivo: record.proteinas_objetivo,
        carbohidratos_objetivo: record.carbohidratos_objetivo,
        grasas_objetivo: record.grasas_objetivo,
        fecha_inicio: record.fecha_inicio,
        fecha_fin: record.fecha_fin,
        id_estado: Number(record.id_estado) as EstadoPlan
      };
    }

    // Memory fallback
    const activePlan = state.planes.find(
      p => p.id_paciente === patientId && p.id_estado === EstadoPlan.ACTIVO
    );
    return activePlan || null;
  },

  async savePatientPlan(
    patientId: string, 
    nutricionistaId: string, 
    plan: Omit<PlanNutricional, 'id_plan' | 'id_paciente' | 'id_nutricionista' | 'id_estado'>
  ): Promise<PlanNutricional> {
    const id_p = 'plan-' + Math.random().toString(36).substring(2, 9);
    
    const newPlan: PlanNutricional = {
      id_plan: id_p,
      id_paciente: patientId,
      id_nutricionista: nutricionistaId,
      calorias_objetivo: plan.calorias_objetivo,
      proteinas_objetivo: plan.proteinas_objetivo,
      carbohidratos_objetivo: plan.carbohidratos_objetivo,
      grasas_objetivo: plan.grasas_objetivo,
      fecha_inicio: plan.fecha_inicio,
      fecha_fin: plan.fecha_fin,
      id_estado: EstadoPlan.ACTIVO
    };

    if (isSupabaseConfigured && supabase) {
      // First de-activate existing active plans for this patient
      await supabase
        .from('Planes_Nutricionales')
        .update({ id_estado: EstadoPlan.CANCELADO })
        .eq('id_paciente', patientId)
        .eq('id_estado', EstadoPlan.ACTIVO);

      // Insert new plan
      await supabase.from('Planes_Nutricionales').insert([{
        id_plan: id_p,
        id_paciente: patientId,
        id_nutricionista: nutricionistaId,
        calorias_objetivo: plan.calorias_objetivo,
        proteinas_objetivo: plan.proteinas_objetivo,
        carbohidratos_objetivo: plan.carbohidratos_objetivo,
        grasas_objetivo: plan.grasas_objetivo,
        fecha_inicio: plan.fecha_inicio,
        fecha_fin: plan.fecha_fin,
        id_estado: EstadoPlan.ACTIVO
      }]);

      return newPlan;
    }

    // Memory fallback - deactivate existing active list
    state.planes.forEach(p => {
      if (p.id_paciente === patientId && p.id_estado === EstadoPlan.ACTIVO) {
        p.id_estado = EstadoPlan.INACTIVO;
      }
    });

    state.planes.push(newPlan);
    return newPlan;
  },

  async getPatientIngestas(patientId: string, dateStr: string): Promise<RegistroIngesta[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('Registros_Ingesta')
        .select(`
          id_registro, id_paciente, id_plan, id_alimento, cantidad, tipo_comida, fecha_hora_consumo,
          Alimentos (id_alimento, nombre_alimento, calorias, proteinas, carbohidratos, grasas, medida_cantidad, medida_unidad)
        `)
        .eq('id_paciente', patientId)
        .gte('fecha_hora_consumo', `${dateStr}T00:00:00Z`)
        .lte('fecha_hora_consumo', `${dateStr}T23:59:59Z`);

      if (error || !data) return [];
      
      return data.map((d: any) => {
        const al = d.Alimentos;
        return {
          id_registro: d.id_registro,
          id_paciente: d.id_paciente,
          id_plan: d.id_plan,
          id_alimento: d.id_alimento,
          cantidad: d.cantidad,
          tipo_comida: d.tipo_comida as TipoComida,
          fecha_hora_consumo: d.fecha_hora_consumo,
          alimento: al ? {
            id_alimento: al.id_alimento,
            nombre_alimento: al.nombre_alimento,
            calorias: al.calorias,
            proteinas: al.proteinas,
            carbohidratos: al.carbohidratos,
            grasas: al.grasas,
            medida_cantidad: al.medida_cantidad,
            medida_unidad: al.medida_unidad
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
    patientId: string, 
    registro: Omit<RegistroIngesta, 'id_registro' | 'id_paciente'>
  ): Promise<RegistroIngesta> {
    const id_r = 'i-' + Math.random().toString(36).substring(2, 9);
    
    const newRegistro: RegistroIngesta = {
      id_registro: id_r,
      id_paciente: patientId,
      id_plan: registro.id_plan,
      id_alimento: registro.id_alimento,
      cantidad: registro.cantidad,
      tipo_comida: registro.tipo_comida,
      fecha_hora_consumo: registro.fecha_hora_consumo
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('Registros_Ingesta').insert([{
        id_registro: id_r,
        id_paciente: patientId,
        id_plan: registro.id_plan,
        id_alimento: registro.id_alimento,
        cantidad: registro.cantidad,
        tipo_comida: registro.tipo_comida,
        fecha_hora_consumo: registro.fecha_hora_consumo
      }]);

      const alimento = await this.getAlimentoById(registro.id_alimento);
      return { ...newRegistro, alimento: alimento || undefined };
    }

    // Memory fallback
    state.ingestas.push(newRegistro);
    return {
      ...newRegistro,
      alimento: state.alimentos.find(a => a.id_alimento === registro.id_alimento)
    };
  },

  async deleteIngesta(registroId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('Registros_Ingesta')
        .delete()
        .eq('id_registro', registroId);
      return !error;
    }

    // Memory fallback
    const initialLen = state.ingestas.length;
    state.ingestas = state.ingestas.filter(i => i.id_registro !== registroId);
    return state.ingestas.length < initialLen;
  },

  async getAlimentoById(id: string): Promise<Alimento | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('Alimentos')
        .select('*')
        .eq('id_alimento', id)
        .single();
      if (error || !data) return null;
      return data as Alimento;
    }
    return state.alimentos.find(a => a.id_alimento === id) || null;
  },

  async getAlimentos(): Promise<Alimento[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('Alimentos')
        .select('*')
        .order('nombre_alimento', { ascending: true });
      if (error || !data) return [];
      return (data as Alimento[]).filter(a => a && a.id_alimento && !a.id_alimento.startsWith('custom_'));
    }
    return [...state.alimentos]
      .filter(a => a && a.id_alimento && !a.id_alimento.startsWith('custom_'))
      .sort((a,b) => (a.nombre_alimento || '').localeCompare(b.nombre_alimento || ''));
  },

  async addAlimento(al: Omit<Alimento, 'id_alimento'> & { id_alimento?: string }): Promise<Alimento> {
    const id_a = al.id_alimento || ('a-' + Math.random().toString(36).substring(2, 9));
    
    const newAlimento: Alimento = {
      id_alimento: id_a,
      nombre_alimento: al.nombre_alimento,
      calorias: al.calorias,
      proteinas: al.proteinas,
      carbohidratos: al.carbohidratos,
      grasas: al.grasas,
      medida_cantidad: al.medida_cantidad,
      medida_unidad: al.medida_unidad
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('Alimentos').insert([{
        id_alimento: id_a,
        nombre_alimento: al.nombre_alimento,
        calorias: al.calorias,
        proteinas: al.proteinas,
        carbohidratos: al.carbohidratos,
        grasas: al.grasas,
        medida_cantidad: al.medida_cantidad,
        medida_unidad: al.medida_unidad
      }]);
      return newAlimento;
    }

    // Memory fallback
    state.alimentos.push(newAlimento);
    return newAlimento;
  }
};
