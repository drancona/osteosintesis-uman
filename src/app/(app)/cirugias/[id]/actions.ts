"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { EstadoCirugia, Profile } from "@/types/database"

export type CambioEstadoResult = { error?: string; ok?: boolean }

const ESTADOS_VALIDOS: EstadoCirugia[] = [
  "pendiente",
  "realizada",
  "suspendida",
  "reprogramada",
]

export async function cambiarEstadoCirugiaAction(
  cirugiaId: string,
  nuevoEstado: EstadoCirugia,
  nuevaFechaIso?: string | null
): Promise<CambioEstadoResult> {
  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    return { error: "Estado inválido" }
  }
  if (nuevoEstado === "reprogramada") {
    if (!nuevaFechaIso || Number.isNaN(Date.parse(nuevaFechaIso))) {
      return { error: "Para reprogramar es obligatorio elegir nueva fecha y hora" }
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Sesión expirada. Inicia sesión nuevamente." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, activo")
    .eq("id", user.id)
    .single<Pick<Profile, "id" | "role" | "activo">>()
  if (!profile?.activo) return { error: "Perfil inactivo" }

  const { data: cirugia, error: errGet } = await supabase
    .from("cirugias")
    .select("id, medico_id, estado")
    .eq("id", cirugiaId)
    .maybeSingle()
  if (errGet) return { error: errGet.message }
  if (!cirugia) return { error: "Cirugía no encontrada" }

  const esDuena = cirugia.medico_id === profile.id
  const esAdmin = profile.role === "admin"
  if (!esDuena && !esAdmin) {
    return { error: "No tienes permiso para modificar esta cirugía" }
  }

  // Construye payload del UPDATE.
  const update: Record<string, unknown> = { estado: nuevoEstado }
  let fechaCirugia: Date | null = null
  let programadaCon48h: boolean | null = null

  if (nuevoEstado === "reprogramada" && nuevaFechaIso) {
    fechaCirugia = new Date(nuevaFechaIso)
    const horas = (fechaCirugia.getTime() - Date.now()) / 3_600_000
    programadaCon48h = horas >= 48
    update.fecha_cirugia = fechaCirugia.toISOString()
    update.programada_con_48h = programadaCon48h
  }

  const { error: errUpd } = await supabase
    .from("cirugias")
    .update(update)
    .eq("id", cirugiaId)

  if (errUpd) return { error: errUpd.message }

  // Auditoría 48h si la nueva fecha cae <48h.
  if (programadaCon48h === false && fechaCirugia) {
    const horas = (fechaCirugia.getTime() - Date.now()) / 3_600_000
    const { error: errAud } = await supabase
      .from("auditoria_programacion_48h")
      .insert({
        cirugia_id: cirugiaId,
        usuario_id: profile.id,
        fecha_cirugia: fechaCirugia.toISOString(),
        horas_de_antelacion: Math.round(horas * 100) / 100,
      })
    // Si falla la auditoría no revertimos el update —
    // ya quedó la cirugía actualizada y un fallo aquí es muy raro.
    // Lo registramos como error pero la operación principal continuó.
    if (errAud) {
      return { ok: true, error: `Estado actualizado, pero falló registro de auditoría: ${errAud.message}` }
    }
  }

  revalidatePath("/cirugias")
  revalidatePath(`/cirugias/${cirugiaId}`)
  return { ok: true }
}
