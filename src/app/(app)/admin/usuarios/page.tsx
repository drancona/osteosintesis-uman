import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PanelUsuarios, type UsuarioFila } from "@/components/admin/PanelUsuarios"
import type { Profile } from "@/types/database"

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // El layout ya verificó admin; este componente confía en eso.

  const supabaseAdmin = createAdminClient()
  const [{ data: profiles }, authList] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const emailPorId = new Map<string, string | undefined>()
  authList.data.users.forEach((u) => emailPorId.set(u.id, u.email ?? undefined))

  const usuarios: UsuarioFila[] = (profiles ?? []).map((p: Profile) => ({
    id: p.id,
    nombre_completo: p.nombre_completo,
    matricula_imss: p.matricula_imss,
    email: emailPorId.get(p.id) ?? "—",
    role: p.role,
    activo: p.activo,
    created_at: p.created_at,
  }))

  return <PanelUsuarios usuarios={usuarios} actualUsuarioId={user!.id} />
}
