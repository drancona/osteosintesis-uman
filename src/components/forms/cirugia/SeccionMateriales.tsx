"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"

import type { CirugiaInput, MaterialItemInput } from "@/lib/schemas/cirugia"
import type { CatalogoMaterial } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MaterialAutocomplete } from "./MaterialAutocomplete"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"

interface Props {
  catalogo: CatalogoMaterial[]
}

export function SeccionMateriales({ catalogo }: Props) {
  const form = useFormContext<CirugiaInput>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "materiales",
  })

  const errorRoot = form.formState.errors.materiales?.message

  function appendVacio() {
    append({ tipo: "catalogo", material_id: 0, cantidad: 1 } as MaterialItemInput)
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Material de osteosíntesis</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona del catálogo o agrega como personalizado.
        </p>
      </header>

      <div className="space-y-3">
        {fields.length === 0 && (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Aún no hay materiales. Da clic en &ldquo;Agregar material&rdquo;.
          </p>
        )}

        {fields.map((field, index) => {
          const item = form.watch(`materiales.${index}`)
          const esPersonalizado = item?.tipo === "personalizado"
          return (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_120px_auto]"
            >
              <FormField
                control={form.control}
                name={`materiales.${index}`}
                render={({ field: f }) => (
                  <FormItem className="space-y-1">
                    <FormControl>
                      <div className="space-y-1">
                        <MaterialAutocomplete
                          catalogo={catalogo}
                          value={f.value as MaterialItemInput}
                          onSelect={(sel) => {
                            const cant = (f.value as MaterialItemInput | undefined)?.cantidad ?? 1
                            if (sel.tipo === "catalogo") {
                              form.setValue(
                                `materiales.${index}`,
                                {
                                  tipo: "catalogo",
                                  material_id: sel.material_id,
                                  cantidad: cant,
                                },
                                { shouldValidate: true }
                              )
                            } else {
                              form.setValue(
                                `materiales.${index}`,
                                {
                                  tipo: "personalizado",
                                  nombre_personalizado: sel.nombre_personalizado,
                                  cantidad: cant,
                                },
                                { shouldValidate: true }
                              )
                            }
                          }}
                        />
                        {esPersonalizado && (
                          <Badge variant="secondary" className="text-xs">
                            Personalizado
                          </Badge>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`materiales.${index}.cantidad`}
                render={({ field: f }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={Number.isFinite(f.value) ? f.value : ""}
                        onChange={(e) => {
                          const v = e.target.value
                          f.onChange(v === "" ? Number.NaN : Number(v))
                        }}
                        placeholder="Cantidad"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Eliminar material"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          )
        })}

        {typeof errorRoot === "string" && (
          <p className="text-sm text-destructive">{errorRoot}</p>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={appendVacio}
          className="w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Agregar material
        </Button>
      </div>
    </section>
  )
}
