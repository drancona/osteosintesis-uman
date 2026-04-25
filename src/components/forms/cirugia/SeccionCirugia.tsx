"use client"

import { useFormContext } from "react-hook-form"

import {
  type CirugiaInput,
  DURACIONES_SUGERIDAS,
} from "@/lib/schemas/cirugia"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function SeccionCirugia() {
  const form = useFormContext<CirugiaInput>()

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Datos de la cirugía</h2>
        <p className="text-sm text-muted-foreground">
          Programación y diagnóstico.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="fecha_cirugia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha y hora</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duracion_minutos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duración estimada</FormLabel>
              <Select
                value={String(field.value ?? "")}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona duración" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DURACIONES_SUGERIDAS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} minutos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="sala"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sala</FormLabel>
              <FormControl>
                <Input
                  placeholder="Quirófano (opcional)"
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
          name="prioridad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prioridad</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tipo_operacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de operación</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="mt-2 flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="electiva" id="op-electiva" />
                    <Label htmlFor="op-electiva">Electiva</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="urgencia" id="op-urgencia" />
                    <Label htmlFor="op-urgencia">Urgencia</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="diagnostico"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Diagnóstico preoperatorio</FormLabel>
            <FormControl>
              <Textarea rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="procedimiento_propuesto"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Procedimiento propuesto</FormLabel>
            <FormControl>
              <Textarea rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  )
}
