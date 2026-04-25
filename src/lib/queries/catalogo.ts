import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { CatalogoMaterial } from "@/types/database"

export async function getCatalogoCompleto(): Promise<CatalogoMaterial[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("catalogo_material")
    .select("*")
    .eq("activo", true)
    .order("sistema", { ascending: true })
    .order("tipo", { ascending: true })
    .order("nombre", { ascending: true })

  if (error) throw error
  return (data ?? []) as CatalogoMaterial[]
}
