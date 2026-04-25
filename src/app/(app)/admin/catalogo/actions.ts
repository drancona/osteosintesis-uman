"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { materialSchema, type MaterialInput } from "@/lib/schemas/catalogo"
import type { Profile } from "@/types/database"

export type CatalogoActionResult = {
  ok?: boolean
  error?: string
  id?: number
}

async function verificarAdmin(): Promise<{ error?: string }> {
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
  return {}
}

export async function crearMaterialAction(
  input: MaterialInput
): Promise<CatalogoActionResult> {
  const auth = await verificarAdmin()
  if (auth.error) return { error: auth.error }

  const parsed = materialSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const supa = createAdminClient()
  const { data, error } = await supa
    .from("catalogo_material")
    .insert(parsed.data)
    .select("id")
    .single()
  if (error) return { error: error.message }

  revalidatePath("/admin/catalogo")
  return { ok: true, id: data.id }
}

export async function actualizarMaterialAction(
  id: number,
  input: MaterialInput
): Promise<CatalogoActionResult> {
  const auth = await verificarAdmin()
  if (auth.error) return { error: auth.error }

  const parsed = materialSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }
  const supa = createAdminClient()
  const { error } = await supa
    .from("catalogo_material")
    .update(parsed.data)
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/catalogo")
  return { ok: true, id }
}

export async function setActivoMaterialAction(
  id: number,
  activo: boolean
): Promise<CatalogoActionResult> {
  const auth = await verificarAdmin()
  if (auth.error) return { error: auth.error }

  const supa = createAdminClient()
  const { error } = await supa
    .from("catalogo_material")
    .update({ activo })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/catalogo")
  return { ok: true, id }
}
