import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { AppHeader } from "@/components/app-header"
import { Breadcrumbs } from "@/components/layout/Breadcrumbs"
import { logoutAction } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import type { Profile } from "@/types/database"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Defensa en profundidad: el middleware ya redirige sin sesión, pero un layout
  // protegido nunca debe asumir que viene autenticado.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  if (!profile) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>No se encontró tu perfil</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Tu cuenta existe en autenticación, pero no hay un perfil asociado en
              la tabla <code>profiles</code>. Esto suele significar que el trigger
              de creación de perfil falló durante el registro (por ejemplo, una
              matrícula IMSS duplicada). Cierra sesión y vuelve a registrarte con
              datos correctos, o contacta a un administrador.
            </p>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Cerrar sesión
              </Button>
            </form>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader profile={profile} />
      <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6">
          <Breadcrumbs />
        </div>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
