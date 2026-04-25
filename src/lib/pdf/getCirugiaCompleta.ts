import "server-only"

import { createClient } from "@/lib/supabase/server"
import { HOSPITAL } from "@/lib/constants"
import { resolverMateriales, type DatosCirugia } from "@/components/pdf/datos"
import type {
  CatalogoMaterial,
  Cirugia,
  CirugiaMaterial,
  Paciente,
  Profile,
} from "@/types/database"

interface CirugiaConRelaciones extends Cirugia {
  paciente: Paciente
  medico: Profile
  cirugia_materiales: CirugiaMaterial[]
}

export async function getCirugiaCompleta(
  cirugiaId: string
): Promise<DatosCirugia | null> {
  const supabase = await createClient()

  const { data: cirugia, error } = await supabase
    .from("cirugias")
    .select(`
      *,
      paciente:pacientes!cirugias_paciente_id_fkey(*),
      medico:profiles!cirugias_medico_id_fkey(*),
      cirugia_materiales(*)
    `)
    .eq("id", cirugiaId)
    .maybeSingle<CirugiaConRelaciones>()

  if (error) throw error
  if (!cirugia) return null

  // Sólo necesitamos los items del catálogo referenciados por esta cirugía.
  const ids = cirugia.cirugia_materiales
    .map((m) => m.material_id)
    .filter((id): id is number => typeof id === "number")

  let catalogo: CatalogoMaterial[] = []
  if (ids.length) {
    const { data: cat, error: catErr } = await supabase
      .from("catalogo_material")
      .select("*")
      .in("id", ids)
    if (catErr) throw catErr
    catalogo = (cat ?? []) as CatalogoMaterial[]
  }

  const materiales = resolverMateriales(cirugia.cirugia_materiales, catalogo)

  return {
    cirugia: cirugia as Cirugia,
    paciente: cirugia.paciente,
    medico: cirugia.medico,
    materiales,
    hospital: HOSPITAL,
  }
}
