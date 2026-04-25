import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Paciente } from "@/types/database"

export async function buscarPacientePorNSS(
  nss: string,
  agregado?: string | null
): Promise<Paciente | null> {
  const supabase = await createClient()

  let query = supabase
    .from("pacientes")
    .select("*")
    .eq("num_afiliacion_imss", nss.trim())

  if (agregado && agregado.trim()) {
    query = query.eq("agregado", agregado.trim())
  } else {
    query = query.is("agregado", null)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return (data as Paciente | null) ?? null
}
