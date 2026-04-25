"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

const ORDEN = ["light", "dark", "system"] as const
type ThemeKey = (typeof ORDEN)[number]

const SIGUIENTE: Record<ThemeKey, ThemeKey> = {
  light: "dark",
  dark: "system",
  system: "light",
}

const TITULO: Record<ThemeKey, string> = {
  light: "Tema claro · clic para alternar",
  dark: "Tema oscuro · clic para alternar",
  system: "Tema del sistema · clic para alternar",
}

export function ThemeToggle() {
  const { theme = "system", setTheme } = useTheme()
  const [montado, setMontado] = useState(false)

  // Evita el mismatch de hidratación: el primer render siempre es el ícono
  // del sistema; tras el mount usamos el tema real.
  useEffect(() => setMontado(true), [])

  const actual = (montado ? (theme as ThemeKey) : "system") ?? "system"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={TITULO[actual]}
      aria-label={TITULO[actual]}
      onClick={() => setTheme(SIGUIENTE[actual])}
      className="button-ios relative overflow-hidden"
    >
      <Sun
        className="absolute size-4 transition-all duration-300 dark:-rotate-90 dark:scale-0 dark:opacity-0"
        aria-hidden
      />
      <Moon
        className="absolute size-4 rotate-90 scale-0 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100"
        aria-hidden
      />
      {actual === "system" ? (
        <Monitor className="size-4 opacity-60" aria-hidden />
      ) : (
        // placeholder invisible para mantener el size del botón (los íconos
        // de sun/moon son absolute y se animan con la clase .dark del root)
        <span className="size-4" />
      )}
    </Button>
  )
}
