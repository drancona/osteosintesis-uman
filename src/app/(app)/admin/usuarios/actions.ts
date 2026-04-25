"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Profile, UserRole } from "@/types/database"

export type AdminActionResult = { ok?: boolean; error?: string }

const ROLES_VALIDOS: UserRole[] = ["admin", "medico", "enfermera"]

async function verificarAdmin(): Promise<
  | { error: string; uid?: undefined }
  | { uid: string; error?: undefined }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, activo")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "activo">>()

  if (!profile?.activo || profile.role !== "admin") {
    return { error: "Solo un administrador puede realizar esta acción" }
  }
  return { uid: user.id }
}

export async function cambiarRolUsuarioAction(
  usuarioId: string,
  nuevoRol: UserRole
): Promise<AdminActionResult> {
  const auth = await verificarAdmin()
  if (auth.error) return { error: auth.error }
  if (!ROLES_VALIDOS.includes(nuevoRol)) return { error: "Rol inválido" }
  if (usuarioId === auth.uid) {
    return { error: "No puedes cambiar tu propio rol" }
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: nuevoRol })
    .eq("id", usuarioId)
  if (error) return { error: error.message }

  revalidatePath("/admin/usuarios")
  return { ok: true }
}

export async function toggleActivoUsuarioAction(
  usuarioId: string,
  activo: boolean
): Promise<AdminActionResult> {
  const auth = await verificarAdmin()
  if (auth.error) return { error: auth.error }
  if (usuarioId === auth.uid) {
    return { error: "No puedes desactivar tu propia cuenta" }
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ activo })
    .eq("id", usuarioId)
  if (error) return { error: error.message }

  revalidatePath("/admin/usuarios")
  return { ok: true }
}
