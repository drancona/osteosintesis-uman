import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import type {
  Cirugia,
  Paciente,
  Profile,
} from "@/types/database"

export interface CirugiaCalendarioRow extends Cirugia {
  paciente: Pick<
    Paciente,
    "id" | "nombre_completo" | "num_afiliacion_imss" | "edad" | "agregado"
  >
  medico: Pick<Profile, "id" | "nombre_completo" | "matricula_imss">
}

export async function GET(req: NextRequest) {
  const desde = req.nextUrl.searchParams.get("desde")
  const hasta = req.nextUrl.searchParams.get("hasta")
  if (!desde || !hasta) {
    return NextResponse.json(
      { error: "Faltan parámetros 'desde' y 'hasta' (ISO datetime)" },
      { status: 400 }
    )
  }
  if (Number.isNaN(Date.parse(desde)) || Number.isNaN(Date.parse(hasta))) {
    return NextResponse.json(
      { error: "Fechas inválidas. Usa ISO 8601." },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  // No filtramos por medico_id aquí: la RLS de cirugias en Fase 1/2 ya
  // expone todas las filas a usuarios activos. El permiso para mover viene
  // por separado del UPDATE policy. Si quisieras restringir la lectura,
  // pasa medicoId desde el cliente o agrega un parámetro.
  const { data, error } = await supabase
    .from("cirugias")
    .select(`
      *,
      paciente:pacientes!cirugias_paciente_id_fkey(id, nombre_completo, num_afiliacion_imss, edad, agregado),
      medico:profiles!cirugias_medico_id_fkey(id, nombre_completo, matricula_imss)
    `)
    .gte("fecha_cirugia", desde)
    .lte("fecha_cirugia", hasta)
    .order("fecha_cirugia", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data ?? []) as CirugiaCalendarioRow[], {
    headers: { "Cache-Control": "private, no-cache" },
  })
}
