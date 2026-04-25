"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface Tab<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  tabs: Tab<T>[]
  value: T
  onChange: (v: T) => void
  /** id único para el layoutId; permite tener varios grupos en la misma página. */
  layoutId?: string
}

/**
 * Tabs con indicador deslizante tipo iOS. Usa framer-motion `layoutId`
 * para animar el "pill" entre opciones sin reposicionarlo bruscamente.
 */
export function EstadoTabs<T extends string>({
  tabs,
  value,
  onChange,
  layoutId = "estado-tabs-indicator",
}: Props<T>) {
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-1 rounded-xl bg-muted p-1"
    >
      {tabs.map((t) => {
        const activo = t.value === value
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={activo}
            onClick={() => onChange(t.value)}
            className={cn(
              "button-ios relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activo
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activo && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
