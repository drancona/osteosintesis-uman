import Link from "next/link"
import { redirect } from "next/navigation"
import { ShieldOff } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AdminNav } from "@/components/admin/AdminNav"
import type { Profile } from "@/types/database"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  if (!profile?.activo || profile.role !== "admin") {
    return (
      <main className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-16">
        <Alert variant="destructive">
          <ShieldOff className="size-4" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Esta sección es solo para administradores.</p>
            <Button asChild variant="outline" size="sm" className="button-ios">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de usuarios y catálogo de material.
        </p>
      </header>
      <AdminNav />
      {children}
    </main>
  )
}
