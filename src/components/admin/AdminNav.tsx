"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/catalogo", label: "Catálogo" },
] as const

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="mb-6 flex gap-2 border-b">
      {ITEMS.map((it) => {
        const activo = pathname === it.href || pathname.startsWith(it.href + "/")
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "button-ios -mb-px rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activo
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
