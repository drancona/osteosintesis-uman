import { createAdminClient } from "@/lib/supabase/admin"
import { PanelCatalogo } from "@/components/admin/PanelCatalogo"
import type { CatalogoMaterial } from "@/types/database"

export default async function AdminCatalogoPage() {
  const supa = createAdminClient()
  const { data, error } = await supa
    .from("catalogo_material")
    .select("*")
    .order("sistema", { ascending: true })
    .order("nombre", { ascending: true })

  if (error) throw error

  return <PanelCatalogo materiales={(data ?? []) as CatalogoMaterial[]} />
}
