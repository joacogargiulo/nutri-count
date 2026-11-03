// Roles
export enum UserRole {
  NUTRICIONISTA = 'Nutricionista',
  PACIENTE = 'Paciente'
}

// Personas
export interface Persona {
  id_persona: number;
  nombre: string;
  apellido: string;
  genero?: string;
  fecha_nacimiento?: string;
}

// Usuarios
export interface Usuario {
  id_usuario: number;
  email: string;
  id_persona: number;
  // joined fields
  persona?: Persona;
  rol?: UserRole;
}

// Alimentos
export interface Alimento {
  id_alimento: number;
  nombre_alimento: string;
  calorias: number; // kcal per medida_cantidad
  proteinas: number; // grams per medida_cantidad
  carbohidratos: number; // grams per medida_cantidad
  grasas: number; // grams per medida_cantidad
  medida_cantidad: number; // e.g. 100
  medida_unidad: string; // "g", "ml", "porcion"
  codigo_barras?: string;
  origen?: string; // 'Local' | 'OpenFoodFacts'
}

// Estados_Plan
export enum EstadoPlan {
  ACTIVO = 1,
  CANCELADO = 2
}

// Planes_Nutricionales
export interface PlanNutricional {
  id_plan: number;
  id_relacion: number;
  calorias_objetivo: number;
  proteinas_objetivo: number;
  carbohidratos_objetivo: number;
  grasas_objetivo: number;
  fecha_inicio: string;
  fecha_fin: string;
  id_estado: EstadoPlan;
  fecha_creacion?: string;
  // joined fields (derivados de la relacion, no se guardan en Planes_Nutricionales)
  id_paciente?: number;
  id_nutricionista?: number;
}

// Registros_Ingesta
// El orden coincide con los ids de la tabla Tipos_Comida (1..5)
export const TIPOS_COMIDA = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena'] as const;
export type TipoComida = typeof TIPOS_COMIDA[number];

export interface RegistroIngesta {
  id_registro: number;
  id_paciente: number;
  id_plan?: number | null;
  id_alimento: number;
  cantidad: number; // cantidad in grams / ml / porcion consumed
  tipo_comida: TipoComida;
  fecha_hora_consumo: string;
  // joined fields
  alimento?: Alimento;
}
