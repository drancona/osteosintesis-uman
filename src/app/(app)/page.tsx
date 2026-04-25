import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getTituloUsuario } from "@/lib/utils"
import type { Profile } from "@/types/database"

const ROL_LEGIBLE: Record<Profile["role"], string> = {
  admin: "Administrador/a",
  medico: "Médico/a",
  enfermera: "Enfermero/a",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  if (!profile) return null

  const titulo = getTituloUsuario(profile.role, profile.nombre_completo)
  const saludo = titulo
    ? `${titulo} ${profile.nombre_completo}`
    : profile.nombre_completo

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Bienvenido, {saludo}
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {ROL_LEGIBLE[profile.role]}
      </p>
      <p className="mt-12 max-w-md text-sm text-muted-foreground">
        Funcionalidades disponibles próximamente.
      </p>
    </main>
  )
}
