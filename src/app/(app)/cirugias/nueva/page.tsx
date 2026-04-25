import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { Profile, UserRole } from "@/types/database"
import { FormProgramarCirugia } from "@/components/forms/cirugia/FormProgramarCirugia"

const ROLES_PERMITIDOS: UserRole[] = ["admin", "medico", "enfermera"]

export default async function NuevaCirugiaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, activo")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "activo">>()

  if (!profile?.activo || !ROLES_PERMITIDOS.includes(profile.role)) {
    redirect("/")
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Programar cirugía
        </h1>
        <p className="text-sm text-muted-foreground">
          Captura los datos del paciente, la cirugía y el material requerido.
        </p>
      </header>
      <FormProgramarCirugia />
    </main>
  )
}
