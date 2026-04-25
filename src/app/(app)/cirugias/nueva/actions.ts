"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  cirugiaSchema,
  type CirugiaInput,
} from "@/lib/schemas/cirugia"
import { buscarPacientePorNSS as buscarPacientePorNSSQuery } from "@/lib/queries/pacientes"
import type { Paciente } from "@/types/database"

export type CrearCirugiaResult = {
  error?: string
  cirugia_id?: string
  programada_con_48h: boolean
}

function mapearError(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes("pacientes_num_afiliacion_imss_agregado_key")) {
    return "Conflicto al guardar el paciente (NSS+agregado duplicados)."
  }
  if (m.includes("foreign key") && m.includes("material_id")) {
    return "Uno de los materiales seleccionados ya no existe en el catálogo."
  }
  if (m.includes("violates check constraint")) {
    return "Algún campo no cumple las restricciones de la base de datos."
  }
  return mensaje
}

export async function buscarPacienteAction(
  nss: string,
  agregado?: string | null
): Promise<{ paciente: Paciente | null; error?: string }> {
  if (!nss || !nss.trim()) {
    return { paciente: null, error: "Ingresa un NSS para buscar." }
  }
  try {
    const paciente = await buscarPacientePorNSSQuery(nss, agregado ?? null)
    return { paciente }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido"
    return { paciente: null, error: msg }
  }
}

export async function crearCirugiaAction(
  input: CirugiaInput
): Promise<CrearCirugiaResult> {
  const parsed = cirugiaSchema.safeParse(input)
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      programada_con_48h: false,
    }
  }
  const data = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Sesión expirada. Inicia sesión nuevamente.", programada_con_48h: false }
  }

  const fechaCirugia = new Date(data.fecha_cirugia)
  const horasDeAntelacion = (fechaCirugia.getTime() - Date.now()) / 3_600_000
  const programadaCon48h = horasDeAntelacion >= 48

  // Paso 1 — upsert del paciente. Usamos la unique key (num_afiliacion_imss, agregado).
  // ON CONFLICT DO UPDATE para refrescar nombre/edad/etc si vienen distintos.
  const pacientePayload = {
    num_afiliacion_imss: data.paciente.num_afiliacion_imss.trim(),
    agregado: data.paciente.agregado,
    nombre_completo: data.paciente.nombre_completo,
    edad: data.paciente.edad,
    telefono: data.paciente.telefono,
    direccion: data.paciente.direccion,
    incapacitado: data.paciente.incapacitado,
    tipo_incapacidad: data.paciente.incapacitado
      ? data.paciente.tipo_incapacidad ?? null
      : null,
    created_by: user.id,
  }

  const { data: pacienteRow, error: pacienteErr } = await supabase
    .from("pacientes")
    .upsert(pacientePayload, {
      onConflict: "num_afiliacion_imss,agregado",
      ignoreDuplicates: false,
    })
    .select("id")
    .single()

  if (pacienteErr || !pacienteRow) {
    return {
      error: mapearError(pacienteErr?.message ?? "No se pudo guardar el paciente"),
      programada_con_48h: programadaCon48h,
    }
  }

  // Paso 2 — insertar la cirugía.
  const { data: cirugiaRow, error: cirugiaErr } = await supabase
    .from("cirugias")
    .insert({
      paciente_id: pacienteRow.id,
      medico_id: user.id,
      fecha_cirugia: fechaCirugia.toISOString(),
      duracion_minutos: data.duracion_minutos,
      sala: data.sala,
      prioridad: data.prioridad,
      tipo_operacion: data.tipo_operacion,
      diagnostico: data.diagnostico,
      procedimiento_propuesto: data.procedimiento_propuesto,
      programada_con_48h: programadaCon48h,
    })
    .select("id")
    .single()

  if (cirugiaErr || !cirugiaRow) {
    return {
      error: mapearError(cirugiaErr?.message ?? "No se pudo crear la cirugía"),
      programada_con_48h: programadaCon48h,
    }
  }

  const cirugiaId = cirugiaRow.id as string

  // Paso 3 — insertar materiales en bulk.
  const materialesPayload = data.materiales.map((m, idx) => ({
    cirugia_id: cirugiaId,
    material_id: m.tipo === "catalogo" ? m.material_id : null,
    nombre_personalizado:
      m.tipo === "personalizado" ? m.nombre_personalizado : null,
    cantidad: m.cantidad,
    orden: idx,
  }))

  const { error: matErr } = await supabase
    .from("cirugia_materiales")
    .insert(materialesPayload)

  if (matErr) {
    // Rollback manual: borrar la cirugía recién creada (CASCADE limpiará materiales si alguno alcanzó a entrar).
    await supabase.from("cirugias").delete().eq("id", cirugiaId)
    return {
      error: mapearError(matErr.message),
      programada_con_48h: programadaCon48h,
    }
  }

  // Paso 4 — auditoría 48h si corresponde.
  if (!programadaCon48h) {
    const { error: audErr } = await supabase
      .from("auditoria_programacion_48h")
      .insert({
        cirugia_id: cirugiaId,
        usuario_id: user.id,
        fecha_cirugia: fechaCirugia.toISOString(),
        horas_de_antelacion: Math.round(horasDeAntelacion * 100) / 100,
      })
    if (audErr) {
      // Si falla la auditoría también revertimos la cirugía: la regla de negocio
      // exige que toda programación <48h quede registrada.
      await supabase.from("cirugias").delete().eq("id", cirugiaId)
      return {
        error: mapearError(audErr.message),
        programada_con_48h: programadaCon48h,
      }
    }
  }

  revalidatePath("/")
  return {
    cirugia_id: cirugiaId,
    programada_con_48h: programadaCon48h,
  }
}
