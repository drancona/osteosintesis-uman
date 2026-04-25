import Image from "next/image"

import { logoutAction } from "@/app/(auth)/actions"
import { HOSPITAL } from "@/lib/constants"
import { getTituloUsuario } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import type { Profile } from "@/types/database"

export function AppHeader({ profile }: { profile: Profile }) {
  const titulo = getTituloUsuario(profile.role, profile.nombre_completo)
  const saludo = titulo
    ? `${titulo} ${profile.nombre_completo}`
    : profile.nombre_completo

  return (
    <header className="glass sticky top-0 z-40 shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Image
          src="/logo_imss.png"
          alt="IMSS"
          width={40}
          height={40}
          priority
          sizes="40px"
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">
            {HOSPITAL.nombre}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            {HOSPITAL.servicio}
          </span>
        </div>
        <Separator orientation="vertical" className="hidden h-8 sm:block" />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <span className="hidden text-sm sm:inline">{saludo}</span>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="button-ios"
            >
              Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
