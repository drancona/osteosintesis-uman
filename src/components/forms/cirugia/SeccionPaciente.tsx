"use client"

import { useState, useTransition } from "react"
import { useFormContext } from "react-hook-form"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import type { CirugiaInput } from "@/lib/schemas/cirugia"
import { buscarPacienteAction } from "@/app/(app)/cirugias/nueva/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function SeccionPaciente() {
  const form = useFormContext<CirugiaInput>()
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const incapacitado = form.watch("paciente.incapacitado")

  function buscarPaciente() {
    const nss = form.getValues("paciente.num_afiliacion_imss")?.trim() ?? ""
    const agregado = form.getValues("paciente.agregado") ?? null
    if (!nss) {
      toast.error("Ingresa el NSS antes de buscar")
      return
    }
    setSubmitting(true)
    startTransition(async () => {
      const { paciente, error } = await buscarPacienteAction(nss, agregado)
      setSubmitting(false)
      if (error) {
        toast.error(error)
        return
      }
      if (!paciente) {
        toast.info(
          "No hay paciente registrado con ese NSS, llena los datos manualmente"
        )
        return
      }
      form.setValue("paciente.nombre_completo", paciente.nombre_completo, {
        shouldValidate: true,
      })
      form.setValue("paciente.edad", paciente.edad, { shouldValidate: true })
      form.setValue("paciente.telefono", paciente.telefono ?? null)
      form.setValue("paciente.direccion", paciente.direccion ?? null)
      form.setValue("paciente.incapacitado", paciente.incapacitado)
      form.setValue(
        "paciente.tipo_incapacidad",
        paciente.tipo_incapacidad ?? null
      )
      toast.success("Paciente encontrado, datos autocompletados")
    })
  }

  const buscando = isPending || submitting

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Datos del paciente</h2>
        <p className="text-sm text-muted-foreground">
          Busca por NSS para autocompletar si ya está registrado.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_auto_1fr]">
        <FormField
          control={form.control}
          name="paciente.num_afiliacion_imss"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NSS</FormLabel>
              <FormControl>
                <Input
                  placeholder="Número de afiliación"
                  inputMode="numeric"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            onClick={buscarPaciente}
            disabled={buscando}
            className="w-full sm:w-auto"
          >
            {buscando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar paciente
          </Button>
        </div>
        <FormField
          control={form.control}
          name="paciente.agregado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agregado</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? null : e.target.value)
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
        name="paciente.nombre_completo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre completo</FormLabel>
            <FormControl>
              <Input placeholder="Apellido paterno, materno y nombre(s)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="paciente.edad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Edad</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={130}
                  inputMode="numeric"
                  value={Number.isFinite(field.value) ? field.value : ""}
                  onChange={(e) => {
                    const v = e.target.value
                    field.onChange(v === "" ? Number.NaN : Number(v))
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paciente.telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  inputMode="tel"
                  placeholder="Opcional"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? null : e.target.value)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paciente.direccion"
          render={({ field }) => (
            <FormItem className="sm:col-span-1">
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Opcional"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? null : e.target.value)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-3">
        <FormField
          control={form.control}
          name="paciente.incapacitado"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">¿Incapacitado?</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Marca si el paciente recibirá incapacidad por la cirugía.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(v) => {
                    field.onChange(v)
                    if (!v) {
                      form.setValue("paciente.tipo_incapacidad", null)
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {incapacitado && (
          <FormField
            control={form.control}
            name="paciente.tipo_incapacidad"
            render={({ field }) => (
              <FormItem className="rounded-lg border p-3">
                <FormLabel>Tipo de incapacidad</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v)}
                    className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="riesgo_trabajo" id="rt" />
                      <Label htmlFor="rt">Riesgo de trabajo</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="enfermedad_general" id="eg" />
                      <Label htmlFor="eg">Enfermedad general</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </section>
  )
}
