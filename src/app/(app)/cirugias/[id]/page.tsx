import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getCirugiaCompleta } from "@/lib/pdf/getCirugiaCompleta"
import { Button } from "@/components/ui/button"
import { DetalleCirugia } from "@/components/cirugias/DetalleCirugia"
import type { Profile } from "@/types/database"

export default async function DetalleCirugiaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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
  if (!profile?.activo) redirect("/")

  const datos = await getCirugiaCompleta(id)
  if (!datos) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm text-muted-foreground">
          La cirugía no existe o no tienes acceso.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/cirugias">Volver al panel</Link>
        </Button>
      </main>
    )
  }

  const esAdmin = profile.role === "admin"
  const esDuena = datos.cirugia.medico_id === profile.id
  const puedeEditar = esAdmin || esDuena

  if (!esAdmin && !esDuena) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm text-destructive">
          No tienes permiso para ver el detalle de esta cirugía.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/cirugias">Volver al panel</Link>
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/cirugias">
            <ArrowLeft className="size-4" />
            Volver al panel
          </Link>
        </Button>
      </div>
      <DetalleCirugia datos={datos} puedeEditar={puedeEditar} />
    </main>
  )
}
