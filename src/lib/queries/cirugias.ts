import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Cirugia, EstadoCirugia, Paciente, Profile } from "@/types/database"

export interface CirugiaListaItem extends Cirugia {
  paciente: Pick<Paciente, "id" | "nombre_completo" | "num_afiliacion_imss" | "edad">
  medico: Pick<Profile, "id" | "nombre_completo" | "matricula_imss">
}

export const ESTADOS_VALIDOS: EstadoCirugia[] = [
  "pendiente",
  "reprogramada",
  "realizada",
  "suspendida",
]

interface ListarOpts {
  estado?: EstadoCirugia | "todas"
  /** Si se pasa, filtra por médico (médicos/enfermeras solo ven las suyas). */
  medicoId?: string
}

export async function listarCirugias(
  opts: ListarOpts = {}
): Promise<CirugiaListaItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from("cirugias")
    .select(`
      *,
      paciente:pacientes!cirugias_paciente_id_fkey(id, nombre_completo, num_afiliacion_imss, edad),
      medico:profiles!cirugias_medico_id_fkey(id, nombre_completo, matricula_imss)
    `)

  if (opts.estado && opts.estado !== "todas") {
    query = query.eq("estado", opts.estado)
  }
  if (opts.medicoId) {
    query = query.eq("medico_id", opts.medicoId)
  }

  // Pendientes/reprogramadas se ordenan ascendente (próximas primero); historial descendente.
  const ascendente =
    !opts.estado || opts.estado === "todas" ||
    opts.estado === "pendiente" || opts.estado === "reprogramada"
  query = query.order("fecha_cirugia", { ascending: ascendente })

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as CirugiaListaItem[]
}
