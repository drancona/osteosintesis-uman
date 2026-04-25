"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import type { CatalogoMaterial } from "@/types/database"
import type { MaterialItemInput } from "@/lib/schemas/cirugia"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Seleccion =
  | { tipo: "catalogo"; material_id: number }
  | { tipo: "personalizado"; nombre_personalizado: string }

interface Props {
  catalogo: CatalogoMaterial[]
  value: MaterialItemInput | null
  onSelect: (sel: Seleccion) => void
}

function normalizar(s: string) {
  return s.toLocaleLowerCase("es").normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function etiqueta(item: CatalogoMaterial): string {
  return item.nombre
}

export function MaterialAutocomplete({ catalogo, value, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const indiceCatalogo = useMemo(() => {
    const m = new Map<number, CatalogoMaterial>()
    catalogo.forEach((c) => m.set(c.id, c))
    return m
  }, [catalogo])

  const filtrado = useMemo(() => {
    const q = normalizar(query.trim())
    if (!q) return catalogo
    return catalogo.filter((c) => normalizar(c.nombre).includes(q))
  }, [catalogo, query])

  const grupos = useMemo(() => {
    const map = new Map<string, CatalogoMaterial[]>()
    filtrado.forEach((item) => {
      const key = item.sistema
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    })
    return Array.from(map.entries())
  }, [filtrado])

  const matchExacto = useMemo(() => {
    const q = normalizar(query.trim())
    if (!q) return true
    return filtrado.some((c) => normalizar(c.nombre) === q)
  }, [filtrado, query])

  const seleccionLegible = (() => {
    if (!value) return ""
    if (value.tipo === "catalogo") {
      return indiceCatalogo.get(value.material_id)?.nombre ?? "(material no encontrado)"
    }
    return value.nombre_personalizado
  })()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !seleccionLegible && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {seleccionLegible || "Buscar material…"}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Escribe nombre del material…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-72">
            <CommandEmpty>Sin coincidencias en el catálogo.</CommandEmpty>
            {grupos.map(([sistema, items]) => (
              <CommandGroup key={sistema} heading={sistema}>
                {items.slice(0, 80).map((item) => {
                  const seleccionado =
                    value?.tipo === "catalogo" &&
                    value.material_id === item.id
                  return (
                    <CommandItem
                      key={item.id}
                      value={`cat-${item.id}`}
                      onSelect={() => {
                        onSelect({ tipo: "catalogo", material_id: item.id })
                        setOpen(false)
                        setQuery("")
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 size-4",
                          seleccionado ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{etiqueta(item)}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
            {query.trim() && !matchExacto && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Personalizado">
                  <CommandItem
                    value={`personalizado-${query}`}
                    onSelect={() => {
                      onSelect({
                        tipo: "personalizado",
                        nombre_personalizado: query.trim(),
                      })
                      setOpen(false)
                      setQuery("")
                    }}
                  >
                    <Plus className="mr-2 size-4" />
                    <span className="truncate">
                      Agregar como personalizado: &ldquo;{query.trim()}&rdquo;
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
