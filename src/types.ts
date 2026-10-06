/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Roles
export enum UserRole {
  NUTRICIONISTA = 'Nutricionista',
  PACIENTE = 'Paciente'
}

export interface Rol {
  id_rol: number;
  nombre_rol: UserRole;
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
  nombre_usuario: string;
  email: string;
  hash_contrasena?: string; // hash bcrypt, nunca se expone al frontend
  id_persona: number;
  fecha_creacion?: string;
  // joined fields
  persona?: Persona;
  rol?: UserRole;
}

// Relacion_Nutricionista_Paciente
export interface RelacionNutricionistaPaciente {
  id_relacion: number;
  id_nutricionista: number;
  id_paciente: number;
  fecha_vinculacion: string;
  activo?: boolean;
  fecha_desvinculacion?: string;
  // joined fields
  paciente_email?: string;
  paciente_nombre?: string;
  paciente_apellido?: string;
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
  origen?: string; // 'Local' | 'OpenFoodFacts' | 'Personalizado'
}

// Estados_Plan
export enum EstadoPlan {
  ACTIVO = 1,
  PAUSADO = 2,
  CANCELADO = 3,
  COMPLETADO = 4,
  VENCIDO = 5
}

// Mediciones (historial de peso/altura del paciente) — schema-only por ahora, sin UI/servicio todavia
export interface Medicion {
  id_medicion: number;
  id_paciente: number;
  peso_kg: number;
  altura_cm: number;
  fecha_medicion: string;
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
export type TipoComida = 'Desayuno' | 'Colación' | 'Almuerzo' | 'Merienda' | 'Cena';

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

// Session State for simplified frontend auth
export interface AppSession {
  user: Usuario | null;
  error?: string;
}
