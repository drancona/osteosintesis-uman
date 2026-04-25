import Link from "next/link"
import { redirect } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ListChecks,
  Plus,
  Users,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getTituloUsuario } from "@/lib/utils"
import type { Profile, UserRole } from "@/types/database"

const ROL_LEGIBLE: Record<Profile["role"], string> = {
  admin: "Administrador/a",
  medico: "Médico/a",
  enfermera: "Enfermero/a",
  proveedor: "Proveedor de material",
}

const PUEDE_PROGRAMAR: UserRole[] = ["admin", "medico", "enfermera"]

interface AccesoProps {
  href: string
  Icono: typeof Plus
  titulo: string
  descripcion: string
  destacado?: boolean
}

function Acceso({ href, Icono, titulo, descripcion, destacado }: AccesoProps) {
  return (
    <Link
      href={href}
      className={
        "button-ios group flex flex-col items-start gap-3 rounded-2xl border p-6 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] " +
        (destacado
          ? "border-primary/30 bg-primary text-primary-foreground hover:bg-primary/95"
          : "border-border bg-card hover:border-primary/40")
      }
    >
      <div
        className={
          "flex size-11 items-center justify-center rounded-xl " +
          (destacado
            ? "bg-primary-foreground/15 text-primary-foreground"
            : "bg-primary-soft text-primary-soft-foreground")
        }
      >
        <Icono className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold tracking-tight">{titulo}</p>
        <p
          className={
            "text-sm " +
            (destacado
              ? "text-primary-foreground/80"
              : "text-muted-foreground")
          }
        >
          {descripcion}
        </p>
      </div>
    </Link>
  )
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

  const puedeProgramar = PUEDE_PROGRAMAR.includes(profile.role)
  const esProveedor = profile.role === "proveedor"

  if (esProveedor) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Bienvenido, {saludo}
          </h1>
          <p className="text-sm text-muted-foreground">
            {ROL_LEGIBLE[profile.role]}
          </p>
        </header>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Acceso
            href="/cirugias"
            Icono={ListChecks}
            titulo="Cirugías programadas"
            descripcion="Próximas, realizadas y reprogramadas"
            destacado
          />
          <Acceso
            href="/calendario"
            Icono={CalendarDays}
            titulo="Calendario"
            descripcion="Vista por día, semana y mes"
          />
          <Acceso
            href="/reportes/materiales"
            Icono={BarChart3}
            titulo="Reporte de materiales"
            descripcion="Filtra y exporta consumo"
          />
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Bienvenido, {saludo}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ROL_LEGIBLE[profile.role]}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {puedeProgramar && (
          <Acceso
            href="/cirugias/nueva"
            Icono={Plus}
            titulo="Programar cirugía"
            descripcion="Captura paciente, datos y material"
            destacado
          />
        )}
        <Acceso
          href="/cirugias"
          Icono={ListChecks}
          titulo={profile.role === "admin" ? "Cirugías" : "Mis cirugías"}
          descripcion="Pendientes, realizadas y reprogramadas"
        />
        <Acceso
          href="/calendario"
          Icono={CalendarDays}
          titulo="Calendario"
          descripcion="Vista por día, semana y mes"
        />
      </section>

      {profile.role === "admin" && (
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Acceso
            href="/admin/usuarios"
            Icono={Users}
            titulo="Administrar usuarios"
            descripcion="Roles y altas/bajas del personal"
          />
          <Acceso
            href="/admin/catalogo"
            Icono={BookOpen}
            titulo="Administrar catálogo"
            descripcion="Material de osteosíntesis"
          />
          <Acceso
            href="/reportes/materiales"
            Icono={BarChart3}
            titulo="Reporte de materiales"
            descripcion="Filtra y exporta consumo"
          />
        </section>
      )}
    </main>
  )
}
