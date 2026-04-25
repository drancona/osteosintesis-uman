import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ReporteMateriales } from "@/components/reportes/ReporteMateriales"
import type { Profile } from "@/types/database"

export default async function ReporteMaterialesPage() {
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

  if (!profile?.activo || (profile.role !== "admin" && profile.role !== "proveedor")) {
    redirect("/")
  }

  // Lista de médicos para el filtro. Usa admin client para no depender de la
  // visibilidad del proveedor sobre los profiles (RLS abre profiles a todos
  // los authenticated, así que da igual).
  const supabaseAdmin = createAdminClient()
  const { data: medicos } = await supabaseAdmin
    .from("profiles")
    .select("id, nombre_completo")
    .in("role", ["medico", "enfermera", "admin"])
    .eq("activo", true)
    .order("nombre_completo", { ascending: true })

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reporte de materiales
        </h1>
        <p className="text-sm text-muted-foreground">
          Filtra por rango de fechas, médico, estado y sistema. Exporta a PDF
          o Excel.
        </p>
      </header>
      <ReporteMateriales
        esAdmin={profile.role === "admin"}
        medicos={(medicos ?? []) as { id: string; nombre_completo: string }[]}
      />
    </main>
  )
}
