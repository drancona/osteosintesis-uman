import Link from "next/link"
import { redirect } from "next/navigation"
import { CalendarDays, ClipboardList, FilePlus2 } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getTituloUsuario } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Profile, UserRole } from "@/types/database"

const ROL_LEGIBLE: Record<Profile["role"], string> = {
  admin: "Administrador/a",
  medico: "Médico/a",
  enfermera: "Enfermero/a",
}

const PUEDE_PROGRAMAR: UserRole[] = ["admin", "medico", "enfermera"]

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

  const puedeProgramar = PUEDE_PROGRAMAR.includes(profile.role)

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Bienvenido, {saludo}
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        {ROL_LEGIBLE[profile.role]}
      </p>

      <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        {puedeProgramar && (
          <Button asChild size="lg">
            <Link href="/cirugias/nueva">
              <FilePlus2 className="size-5" />
              Programar cirugía
            </Link>
          </Button>
        )}
        <Button asChild size="lg" variant="outline">
          <Link href="/cirugias">
            <ClipboardList className="size-5" />
            {profile.role === "admin" ? "Cirugías" : "Mis cirugías"}
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/calendario">
            <CalendarDays className="size-5" />
            Ver calendario
          </Link>
        </Button>
      </div>
    </main>
  )
}
