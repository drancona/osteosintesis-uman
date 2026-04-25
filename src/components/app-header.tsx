import { logoutAction } from "@/app/(auth)/actions"
import { HOSPITAL } from "@/lib/constants"
import { getTituloUsuario } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { Profile } from "@/types/database"

export function AppHeader({ profile }: { profile: Profile }) {
  const titulo = getTituloUsuario(profile.role, profile.nombre_completo)
  const saludo = titulo
    ? `${titulo} ${profile.nombre_completo}`
    : profile.nombre_completo

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">
            {HOSPITAL.nombre}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            {HOSPITAL.servicio}
          </span>
        </div>
        <Separator orientation="vertical" className="hidden h-8 sm:block" />
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm sm:inline">{saludo}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
