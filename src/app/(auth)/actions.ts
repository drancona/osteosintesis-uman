"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/schemas/auth"

export type AuthActionResult = {
  error?: string
  success?: boolean
  needsEmailConfirmation?: boolean
}

function mapearErrorRegistro(mensaje: string): string {
  const msg = mensaje.toLowerCase()
  if (msg.includes("matricula_imss") || msg.includes("profiles_matricula")) {
    return "Esa matrícula IMSS ya está registrada"
  }
  if (msg.includes("already registered") || msg.includes("user already")) {
    return "Ese email ya está registrado"
  }
  if (msg.includes("password")) {
    return "La contraseña no cumple los requisitos del proveedor"
  }
  return mensaje
}

function mapearErrorLogin(mensaje: string): string {
  const msg = mensaje.toLowerCase()
  if (msg.includes("invalid login credentials") || msg.includes("invalid")) {
    return "Email o contraseña incorrectos"
  }
  if (msg.includes("email not confirmed")) {
    return "Tu email aún no ha sido confirmado"
  }
  return mensaje
}

export async function registerAction(
  input: RegisterInput
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { email, password, nombre_completo, matricula_imss } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        matricula_imss,
        nombre_completo,
        role: "medico",
      },
    },
  })

  if (error) {
    return { error: mapearErrorRegistro(error.message) }
  }

  // Si Supabase tiene activado "Confirm email", signUp devuelve user pero session=null.
  if (data.user && !data.session) {
    return { success: true, needsEmailConfirmation: true }
  }

  return { success: true }
}

export async function loginAction(
  input: LoginInput
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: mapearErrorLogin(error.message) }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
