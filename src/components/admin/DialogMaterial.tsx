"use client"

import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  materialSchema,
  type MaterialInput,
  SISTEMAS_VALIDOS,
} from "@/lib/schemas/catalogo"
import {
  actualizarMaterialAction,
  crearMaterialAction,
} from "@/app/(app)/admin/catalogo/actions"
import type { CatalogoMaterial } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  material: CatalogoMaterial | null
  onSaved: () => void
}

const DEFAULTS: MaterialInput = {
  nombre: "",
  sistema: "Grandes Fragmentos",
  tipo: "",
  diametro_mm: null,
  orificios: null,
  longitud_mm: null,
  variante: null,
  activo: true,
}

function aInputNumero(v: number | null): string {
  return v == null ? "" : String(v)
}
function deInputNumero(v: string): number | null {
  if (v.trim() === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function DialogMaterial({ open, onOpenChange, material, onSaved }: Props) {
  const modoEditar = material !== null
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  const form = useForm<MaterialInput>({
    resolver: zodResolver(materialSchema),
    defaultValues: DEFAULTS,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        material
          ? {
              nombre: material.nombre,
              sistema: material.sistema,
              tipo: material.tipo,
              diametro_mm: material.diametro_mm,
              orificios: material.orificios,
              longitud_mm: material.longitud_mm,
              variante: material.variante,
              activo: material.activo,
            }
          : DEFAULTS
      )
    }
  }, [open, material, form])

  function onSubmit(values: MaterialInput) {
    setSubmitting(true)
    startTransition(async () => {
      const r =
        modoEditar && material
          ? await actualizarMaterialAction(material.id, values)
          : await crearMaterialAction(values)
      setSubmitting(false)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success(modoEditar ? "Material actualizado" : "Material creado")
      onSaved()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {modoEditar ? "Editar material" : "Agregar material"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sistema"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SISTEMAS_VALIDOS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej. Placa, Tornillo, Clavo…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="diametro_mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diámetro (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        value={aInputNumero(field.value)}
                        onChange={(e) =>
                          field.onChange(deInputNumero(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orificios"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orificios</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={aInputNumero(field.value)}
                        onChange={(e) =>
                          field.onChange(deInputNumero(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitud_mm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={aInputNumero(field.value)}
                        onChange={(e) =>
                          field.onChange(deInputNumero(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="variante"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variante</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? null : e.target.value
                        )
                      }
                      placeholder="Opcional"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Activo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Si está desactivado no aparece en el catálogo del
                      formulario de cirugía.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="button-ios"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="button-ios"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Guardando…
                  </>
                ) : modoEditar ? (
                  "Guardar cambios"
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
