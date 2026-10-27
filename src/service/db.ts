/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import {
  Usuario, Persona, UserRole, Alimento, PlanNutricional, EstadoPlan,
  RegistroIngesta, TipoComida, TIPOS_COMIDA
} from '../types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan SUPABASE_URL y/o SUPABASE_KEY: configurarlas en .env (local) o en las variables de entorno del hosting.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ids fijos de la tabla Roles (ver docs/DB_SCHEMA.sql)
const ROL_ID: Record<UserRole, number> = {
  [UserRole.NUTRICIONISTA]: 1,
  [UserRole.PACIENTE]: 2,
};

// Espejo de la tabla Tipos_Comida para traducir nombre <-> id sin un JOIN extra.
const tipoComidaToId = (nombre: TipoComida): number => TIPOS_COMIDA.indexOf(nombre) + 1;
const idToTipoComida = (id: number): TipoComida => TIPOS_COMIDA[id - 1] || 'Desayuno';

// PostgREST devuelve una relacion N:1 como objeto, pero tipada puede venir como arreglo.
const one = <T>(v: T | T[] | null | undefined): T | undefined => (Array.isArray(v) ? v[0] : v ?? undefined);

// Lanza si Supabase devolvio error: asi la ruta responde 500 en vez de fingir exito con datos vacios.
function must<T>(res: { data: T; error: { message: string; code?: string } | null }, ctx: string): T {
  if (res.error) {
    console.error(`[DB] ${ctx}:`, res.error.message, res.error.code || '');
    throw new Error(`Error de base de datos (${ctx})`);
  }
  return res.data;
}

const mapPersona = (id_persona: number, p: any): Persona | undefined =>
  p ? {
    id_persona,
    nombre: p.nombre,
    apellido: p.apellido,
    genero: p.genero,
    fecha_nacimiento: p.fecha_nacimiento,
  } : undefined;

export const db = {
  async ping(): Promise<boolean> {
    const { error } = await supabase.from('alimentos').select('id_alimento').limit(1);
    if (error) console.error('[DB] ping fallo:', error.message);
    return !error;
  },

  async authenticate(email: string, pass: string): Promise<Usuario | null> {
    const data: any = must(await supabase
      .from('usuarios')
      .select(`
        id_usuario, nombre_usuario, email, hash_contrasena, id_persona,
        personas (nombre, apellido, genero, fecha_nacimiento),
        relacion_rol_usuario (id_rol, roles (nombre_rol))
      `)
      .eq('email', email)
      .maybeSingle(), 'authenticate');

    if (!data) return null;
    if (!(await bcrypt.compare(pass, data.hash_contrasena || ''))) return null;

    const rol = one<any>(data.relacion_rol_usuario)?.roles?.nombre_rol;
    if (!rol) return null; // cuenta sin rol asignado: no se puede operar

    return {
      id_usuario: data.id_usuario,
      nombre_usuario: data.nombre_usuario,
      email: data.email,
      id_persona: data.id_persona,
      persona: mapPersona(data.id_persona, one(data.personas)),
      rol: rol as UserRole,
    };
  },

  async register(
    nombre: string,
    apellido: string,
    email: string,
    pass: string,
    role: UserRole,
    nombre_usuario: string,
    genero: string,
    fecha_nacimiento: string
  ): Promise<{ success: boolean; error?: string; user?: Usuario }> {
    const byEmail = must(await supabase.from('usuarios').select('id_usuario').eq('email', email).maybeSingle(), 'register/email');
    if (byEmail) return { success: false, error: 'Ese email ya está registrado' };

    const byName = must(await supabase.from('usuarios').select('id_usuario').ilike('nombre_usuario', nombre_usuario).maybeSingle(), 'register/username');
    if (byName) return { success: false, error: 'Ese nombre de usuario ya está en uso' };

    const hash_contrasena = await bcrypt.hash(pass, 10);

    const persona: any = must(await supabase.from('personas')
      .insert([{ nombre, apellido, genero, fecha_nacimiento }]).select().single(), 'register/persona');

    // Sin transaccion en PostgREST: si falla un paso posterior se deshacen los anteriores.
    const usuarioRes = await supabase.from('usuarios')
      .insert([{ nombre_usuario, email, hash_contrasena, id_persona: persona.id_persona }]).select().single();
    if (usuarioRes.error || !usuarioRes.data) {
      await supabase.from('personas').delete().eq('id_persona', persona.id_persona);
      console.error('[DB] register/usuario:', usuarioRes.error?.message);
      return { success: false, error: 'No se pudo crear el usuario' };
    }
    const usuario: any = usuarioRes.data;

    const rolRes = await supabase.from('relacion_rol_usuario')
      .insert([{ id_usuario: usuario.id_usuario, id_rol: ROL_ID[role] }]);
    if (rolRes.error) {
      await supabase.from('usuarios').delete().eq('id_usuario', usuario.id_usuario);
      await supabase.from('personas').delete().eq('id_persona', persona.id_persona);
      console.error('[DB] register/rol:', rolRes.error.message);
      return { success: false, error: 'No se pudo asignar el rol al usuario' };
    }

    return {
      success: true,
      user: {
        id_usuario: usuario.id_usuario,
        nombre_usuario,
        email,
        id_persona: persona.id_persona,
        persona: mapPersona(persona.id_persona, persona),
        rol: role,
      },
    };
  },

  async getUserRole(id_usuario: number): Promise<UserRole | null> {
    const data: any = must(await supabase
      .from('relacion_rol_usuario')
      .select('roles (nombre_rol)')
      .eq('id_usuario', id_usuario)
      .maybeSingle(), 'getUserRole');
    return (one<any>(data?.roles)?.nombre_rol as UserRole) || null;
  },

  async hasActiveLink(nutricionistaId: number, patientId: number): Promise<boolean> {
    const data = must(await supabase
      .from('relacion_nutricionista_paciente')
      .select('id_relacion')
      .eq('id_nutricionista', nutricionistaId)
      .eq('id_paciente', patientId)
      .eq('activo', true)
      .maybeSingle(), 'hasActiveLink');
    return !!data;
  },

  async getPatients(nutricionistaId: number): Promise<Usuario[]> {
    const data: any[] = must(await supabase
      .from('relacion_nutricionista_paciente')
      .select(`
        id_paciente,
        usuarios!id_paciente (
          id_usuario, nombre_usuario, email, id_persona,
          personas (nombre, apellido, genero, fecha_nacimiento)
        )
      `)
      .eq('id_nutricionista', nutricionistaId)
      .eq('activo', true), 'getPatients') || [];

    return data.map((d: any) => {
      const u = one<any>(d.usuarios);
      return {
        id_usuario: u.id_usuario,
        nombre_usuario: u.nombre_usuario,
        email: u.email,
        id_persona: u.id_persona,
        rol: UserRole.PACIENTE,
        persona: mapPersona(u.id_persona, one(u.personas)),
      };
    });
  },

  async linkPatient(nutricionistaId: number, email: string): Promise<{ success: boolean; error?: string; patient?: Usuario }> {
    const user: any = must(await supabase
      .from('usuarios')
      .select(`
        id_usuario, nombre_usuario, email, id_persona,
        personas (nombre, apellido, genero, fecha_nacimiento)
      `)
      .eq('email', email)
      .maybeSingle(), 'linkPatient/usuario');

    if (!user) return { success: false, error: 'El usuario no está registrado en Nutri Count' };
    if (user.id_usuario === nutricionistaId) return { success: false, error: 'No podés vincularte a vos mismo como paciente' };
    if ((await this.getUserRole(user.id_usuario)) !== UserRole.PACIENTE) {
      return { success: false, error: 'El usuario indicado no tiene rol Paciente' };
    }
    if (await this.hasActiveLink(nutricionistaId, user.id_usuario)) {
      return { success: false, error: 'Este paciente ya está vinculado a tu cuenta de forma activa.' };
    }

    // Siempre se inserta un vinculo nuevo para conservar el historial de vinculos anteriores
    must(await supabase.from('relacion_nutricionista_paciente').insert([{
      id_nutricionista: nutricionistaId,
      id_paciente: user.id_usuario,
    }]), 'linkPatient/insert');

    return {
      success: true,
      patient: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        id_persona: user.id_persona,
        rol: UserRole.PACIENTE,
        persona: mapPersona(user.id_persona, one(user.personas)),
      },
    };
  },

  async unlinkPatient(nutricionistaId: number, patientId: number): Promise<{ success: boolean; error?: string }> {
    const rel: any = must(await supabase
      .from('relacion_nutricionista_paciente')
      .update({ activo: false, fecha_desvinculacion: new Date().toISOString().split('T')[0] })
      .eq('id_nutricionista', nutricionistaId)
      .eq('id_paciente', patientId)
      .eq('activo', true)
      .select()
      .maybeSingle(), 'unlinkPatient/relacion');

    if (!rel) return { success: false, error: 'No existe un vínculo activo entre este nutricionista y este paciente' };

    // Al desvincular se cancela el plan activo de esa relacion
    must(await supabase
      .from('planes_nutricionales')
      .update({ id_estado: EstadoPlan.CANCELADO })
      .eq('id_relacion', rel.id_relacion)
      .eq('id_estado', EstadoPlan.ACTIVO), 'unlinkPatient/planes');

    return { success: true };
  },

  async getPatientPlan(patientId: number): Promise<PlanNutricional | null> {
    const data: any[] = must(await supabase
      .from('planes_nutricionales')
      .select(`
        id_plan, id_relacion, calorias_objetivo, proteinas_objetivo, carbohidratos_objetivo,
        grasas_objetivo, fecha_inicio, fecha_fin, id_estado, fecha_creacion,
        relacion_nutricionista_paciente!inner(id_paciente, id_nutricionista)
      `)
      .eq('relacion_nutricionista_paciente.id_paciente', patientId)
      .eq('id_estado', EstadoPlan.ACTIVO)
      .order('fecha_inicio', { ascending: false })
      .limit(1), 'getPatientPlan') || [];

    if (data.length === 0) return null;
    const { relacion_nutricionista_paciente, ...plan } = data[0];
    const rel = one<any>(relacion_nutricionista_paciente);
    return {
      ...plan,
      id_estado: Number(plan.id_estado) as EstadoPlan,
      id_paciente: rel?.id_paciente,
      id_nutricionista: rel?.id_nutricionista,
    };
  },

  async savePatientPlan(
    patientId: number,
    nutricionistaId: number,
    plan: Pick<PlanNutricional, 'calorias_objetivo' | 'proteinas_objetivo' | 'carbohidratos_objetivo' | 'grasas_objetivo' | 'fecha_inicio' | 'fecha_fin'>
  ): Promise<{ success: boolean; error?: string; plan?: PlanNutricional }> {
    const rel: any = must(await supabase
      .from('relacion_nutricionista_paciente')
      .select('id_relacion')
      .eq('id_nutricionista', nutricionistaId)
      .eq('id_paciente', patientId)
      .eq('activo', true)
      .maybeSingle(), 'savePatientPlan/relacion');

    if (!rel) return { success: false, error: 'No existe un vínculo activo entre este nutricionista y este paciente' };

    // Primero se inserta el plan nuevo y recien despues se cancelan los anteriores:
    // si el insert falla, el paciente conserva su plan vigente.
    const newPlan: any = must(await supabase.from('planes_nutricionales').insert([{
      id_relacion: rel.id_relacion,
      calorias_objetivo: plan.calorias_objetivo,
      proteinas_objetivo: plan.proteinas_objetivo,
      carbohidratos_objetivo: plan.carbohidratos_objetivo,
      grasas_objetivo: plan.grasas_objetivo,
      fecha_inicio: plan.fecha_inicio,
      fecha_fin: plan.fecha_fin,
      id_estado: EstadoPlan.ACTIVO,
    }]).select().single(), 'savePatientPlan/insert');

    const relRows: any[] = must(await supabase
      .from('relacion_nutricionista_paciente')
      .select('id_relacion')
      .eq('id_paciente', patientId), 'savePatientPlan/relaciones') || [];

    must(await supabase
      .from('planes_nutricionales')
      .update({ id_estado: EstadoPlan.CANCELADO })
      .in('id_relacion', relRows.map(r => r.id_relacion))
      .eq('id_estado', EstadoPlan.ACTIVO)
      .neq('id_plan', newPlan.id_plan), 'savePatientPlan/cancelar');

    return { success: true, plan: { ...newPlan, id_paciente: patientId, id_nutricionista: nutricionistaId } };
  },

  // Ingestas cuyo consumo cae en [desde, hasta) (instantes ISO UTC calculados para el dia local del cliente)
  async getPatientIngestas(patientId: number, desde: string, hasta: string): Promise<RegistroIngesta[]> {
    const data: any[] = must(await supabase
      .from('registros_ingesta')
      .select(`
        id_registro, id_paciente, id_plan, id_alimento, cantidad, id_tipo_comida, fecha_hora_consumo,
        alimentos (id_alimento, nombre_alimento, calorias, proteinas, carbohidratos, grasas, medida_cantidad, medida_unidad, codigo_barras, origen)
      `)
      .eq('id_paciente', patientId)
      .gte('fecha_hora_consumo', desde)
      .lt('fecha_hora_consumo', hasta)
      .order('fecha_hora_consumo', { ascending: true }), 'getPatientIngestas') || [];

    return data.map((d: any) => ({
      id_registro: d.id_registro,
      id_paciente: d.id_paciente,
      id_plan: d.id_plan,
      id_alimento: d.id_alimento,
      cantidad: d.cantidad,
      tipo_comida: idToTipoComida(d.id_tipo_comida),
      fecha_hora_consumo: d.fecha_hora_consumo,
      alimento: one<Alimento>(d.alimentos),
    }));
  },

  async addIngesta(
    patientId: number,
    registro: Omit<RegistroIngesta, 'id_registro' | 'id_paciente' | 'alimento'>
  ): Promise<RegistroIngesta> {
    const data: any = must(await supabase.from('registros_ingesta').insert([{
      id_paciente: patientId,
      id_plan: registro.id_plan ?? null,
      id_alimento: registro.id_alimento,
      cantidad: registro.cantidad,
      id_tipo_comida: tipoComidaToId(registro.tipo_comida),
      fecha_hora_consumo: registro.fecha_hora_consumo,
    }]).select().single(), 'addIngesta');

    return {
      id_registro: data.id_registro,
      id_paciente: patientId,
      id_plan: data.id_plan,
      id_alimento: registro.id_alimento,
      cantidad: registro.cantidad,
      tipo_comida: registro.tipo_comida,
      fecha_hora_consumo: data.fecha_hora_consumo,
      alimento: (await this.getAlimentoById(registro.id_alimento)) || undefined,
    };
  },

  // Solo borra si la ingesta pertenece al paciente indicado; devuelve false si no existe / no es suya
  async deleteIngesta(registroId: number, patientId: number): Promise<boolean> {
    const rows: any[] = must(await supabase
      .from('registros_ingesta')
      .delete()
      .eq('id_registro', registroId)
      .eq('id_paciente', patientId)
      .select('id_registro'), 'deleteIngesta') || [];
    return rows.length > 0;
  },

  async getAlimentoById(id: number): Promise<Alimento | null> {
    const data = must(await supabase.from('alimentos').select('*').eq('id_alimento', id).maybeSingle(), 'getAlimentoById');
    return (data as Alimento) || null;
  },

  async getAlimentoByBarcode(codigo: string): Promise<Alimento | null> {
    const data = must(await supabase.from('alimentos').select('*').eq('codigo_barras', codigo).maybeSingle(), 'getAlimentoByBarcode');
    return (data as Alimento) || null;
  },

  async getAlimentoByName(nombre: string): Promise<Alimento | null> {
    const data = must(await supabase
      .from('alimentos')
      .select('*')
      .ilike('nombre_alimento', nombre.replace(/[%_\\]/g, '\\$&'))
      .neq('origen', 'Personalizado')
      .limit(1), 'getAlimentoByName') as Alimento[];
    return data?.[0] || null;
  },

  async getAlimentos(): Promise<Alimento[]> {
    const data = must(await supabase
      .from('alimentos')
      .select('*')
      .order('nombre_alimento', { ascending: true })
      .range(0, 4999), 'getAlimentos') as Alimento[];
    // Los 'Personalizado' (creados al vuelo desde un plato guardado) no van al catalogo compartido
    return (data || []).filter(a => a.origen !== 'Personalizado');
  },

  async addAlimento(al: Omit<Alimento, 'id_alimento'>): Promise<Alimento> {
    const data = must(await supabase.from('alimentos').insert([{
      nombre_alimento: al.nombre_alimento,
      calorias: al.calorias,
      proteinas: al.proteinas,
      carbohidratos: al.carbohidratos,
      grasas: al.grasas,
      medida_cantidad: al.medida_cantidad,
      medida_unidad: al.medida_unidad,
      codigo_barras: al.codigo_barras || null,
      origen: al.origen || 'Local',
    }]).select().single(), 'addAlimento');
    return data as Alimento;
  },
};
