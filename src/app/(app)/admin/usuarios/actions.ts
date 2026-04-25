"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Profile, UserRole } from "@/types/database"

export type AdminActionResult = { ok?: boolean; error?: string }

const ROLES_VALIDOS: UserRole[] = ["admin", "medico", "enfermera", "proveedor"]

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

export interface CrearProveedorInput {
  nombre_completo: string
  email: string
  identificador?: string | null
  password: string
}

export type CrearProveedorResult = AdminActionResult & {
  email?: string
  password?: string
}

function mapearErrorCreacion(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes("already registered") || m.includes("user already")) {
    return "Ese email ya está registrado"
  }
  if (m.includes("password")) {
    return "La contraseña no cumple los requisitos del proveedor de auth"
  }
  return mensaje
}

export async function crearCuentaProveedorAction(
  input: CrearProveedorInput
): Promise<CrearProveedorResult> {
  const auth = await verificarAdmin()
  if (auth.error) return { error: auth.error }

  const nombre = input.nombre_completo?.trim() ?? ""
  const email = input.email?.trim().toLowerCase() ?? ""
  const password = input.password ?? ""
  const identificador = input.identificador?.trim() || null

  if (nombre.length < 3) {
    return { error: "El nombre debe tener al menos 3 caracteres" }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email inválido" }
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres" }
  }

  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nombre_completo: nombre,
      matricula_imss: identificador,
      role: "proveedor",
    },
  })
  if (error || !data.user) {
    return { error: mapearErrorCreacion(error?.message ?? "No se pudo crear el usuario") }
  }

  // El trigger handle_new_user crea el profile con role='proveedor'.
  // Defensa por si llegó con role distinto (p. ej. trigger desactualizado).
  const { error: errUpd } = await supabaseAdmin
    .from("profiles")
    .update({ role: "proveedor" })
    .eq("id", data.user.id)
  if (errUpd) return { error: errUpd.message }

  revalidatePath("/admin/usuarios")
  return { ok: true, email, password }
}
