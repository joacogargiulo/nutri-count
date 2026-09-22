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
  id_persona: string; // UUID or String id
  nombre: string;
  apellido: string;
  genero?: string;
  dni?: string;
  fecha_nacimiento?: string;
}

// Usuarios
export interface Usuario {
  id_usuario: string;
  nombre_usuario: string;
  email: string;
  hash_contrasena?: string; // stored for demo verification
  id_persona: string;
  // joined fields
  persona?: Persona;
  rol?: UserRole;
}

// Relacion_Nutricionista_Paciente
export interface RelacionNutricionistaPaciente {
  id_relacion: string;
  id_nutricionista: string;
  id_paciente: string;
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
  id_alimento: string;
  nombre_alimento: string;
  calorias: number; // kcal per medida_cantidad
  proteinas: number; // grams per medida_cantidad
  carbohidratos: number; // grams per medida_cantidad
  grasas: number; // grams per medida_cantidad
  medida_cantidad: number; // e.g. 100
  medida_unidad: string; // "g", "ml", "porcion"
}

// Estados_Plan
export enum EstadoPlan {
  ACTIVO = 1,
  PAUSADO = 2,
  CANCELADO = 3,
  COMPLETADO = 4,
  VENCIDO = 5,
  INACTIVO = 3
}

// Planes_Nutricionales
export interface PlanNutricional {
  id_plan: string;
  id_paciente: string;
  id_nutricionista: string;
  calorias_objetivo: number;
  proteinas_objetivo: number;
  carbohidratos_objetivo: number;
  grasas_objetivo: number;
  fecha_inicio: string;
  fecha_fin: string;
  id_estado: EstadoPlan;
}

// Registros_Ingesta
export type TipoComida = 'Desayuno' | 'Colación' | 'Almuerzo' | 'Merienda' | 'Cena';

export interface RegistroIngesta {
  id_registro: string;
  id_paciente: string;
  id_plan?: string | null;
  id_alimento: string;
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

