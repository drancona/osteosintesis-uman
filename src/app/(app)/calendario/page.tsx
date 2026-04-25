import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Calendario } from "@/components/calendario/Calendario"
import type { Profile, UserRole } from "@/types/database"

const ROLES_PERMITIDOS: UserRole[] = ["admin", "medico", "enfermera"]

export default async function CalendarioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, activo")
    .eq("id", user.id)
    .single<Pick<Profile, "id" | "role" | "activo">>()

  if (!profile?.activo || !ROLES_PERMITIDOS.includes(profile.role)) {
    redirect("/")
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-4 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
        <p className="text-sm text-muted-foreground">
          {profile.role === "admin"
            ? "Cirugías de todo el servicio"
            : "Tus cirugías"}
          . Arrastra para reprogramar.
        </p>
      </header>
      <Calendario isAdmin={profile.role === "admin"} usuarioId={profile.id} />
    </main>
  )
}
