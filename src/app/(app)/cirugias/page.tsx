import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  ESTADOS_VALIDOS,
  listarCirugias,
} from "@/lib/queries/cirugias"
import { PanelCirugias } from "@/components/cirugias/PanelCirugias"
import type { EstadoCirugia, Profile, UserRole } from "@/types/database"

const ROLES_PERMITIDOS: UserRole[] = [
  "admin",
  "medico",
  "enfermera",
  "proveedor",
]

type EstadoFiltro = EstadoCirugia | "todas"

function parseEstado(raw: string | undefined): EstadoFiltro {
  if (!raw) return "pendiente"
  if (raw === "todas") return "todas"
  if ((ESTADOS_VALIDOS as string[]).includes(raw)) return raw as EstadoCirugia
  return "pendiente"
}

export default async function PanelCirugiasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const { estado: estadoRaw } = await searchParams
  const estado = parseEstado(estadoRaw)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, activo, nombre_completo")
    .eq("id", user.id)
    .single<Pick<Profile, "id" | "role" | "activo" | "nombre_completo">>()

  if (!profile?.activo || !ROLES_PERMITIDOS.includes(profile.role)) {
    redirect("/")
  }

  const esAdmin = profile.role === "admin"
  const esProveedor = profile.role === "proveedor"
  // Admin y proveedor ven el panel completo del servicio.
  // Médico/enfermera siguen viendo solo las suyas.
  // RLS de Fase 8 ya filtra cirugías suspendidas para proveedor automáticamente.
  const verTodos = esAdmin || esProveedor
  const cirugias = await listarCirugias({
    estado,
    medicoId: verTodos ? undefined : profile.id,
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PanelCirugias
        cirugias={cirugias}
        estadoActual={estado}
        esAdmin={esAdmin}
        esProveedor={esProveedor}
        usuarioId={profile.id}
      />
    </main>
  )
}
