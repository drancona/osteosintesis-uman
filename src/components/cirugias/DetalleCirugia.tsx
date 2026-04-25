"use client"

import { useState, useTransition } from "react"
import { Printer } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import type { DatosCirugia } from "@/components/pdf/datos"
import type { EstadoCirugia } from "@/types/database"
import { cambiarEstadoCirugiaAction } from "@/app/(app)/cirugias/[id]/actions"
import { ModalImpresion } from "@/components/forms/cirugia/ModalImpresion"
import { BadgeEstado } from "@/components/cirugias/PanelCirugias"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  datos: DatosCirugia
  puedeEditar: boolean
}

const ESTADOS: { value: EstadoCirugia; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "reprogramada", label: "Reprogramada" },
  { value: "realizada", label: "Realizada" },
  { value: "suspendida", label: "Suspendida" },
]

const PRIORIDAD_LABEL: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
}

const TIPO_LABEL: Record<string, string> = {
  electiva: "Electiva",
  urgencia: "Urgencia",
}

function fmt(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: es })
}

function isoLocalParaInput(iso: string): string {
  // Convierte ISO a string compatible con <input type="datetime-local">.
  const d = new Date(iso)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 16)
}

export function DetalleCirugia({ datos, puedeEditar }: Props) {
  const { cirugia, paciente, medico, materiales } = datos
  const [estado, setEstado] = useState<EstadoCirugia>(cirugia.estado)
  const [showImpresion, setShowImpresion] = useState(false)
  const [showReprogramar, setShowReprogramar] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState<string>(
    isoLocalParaInput(cirugia.fecha_cirugia)
  )
  const [submitting, setSubmitting] = useState(false)
  const [isPending, startTransition] = useTransition()
  const trabajando = submitting || isPending

  function aplicarCambioEstado(siguiente: EstadoCirugia) {
    if (siguiente === "reprogramada") {
      setShowReprogramar(true)
      return
    }
    setSubmitting(true)
    startTransition(async () => {
      const r = await cambiarEstadoCirugiaAction(cirugia.id, siguiente)
      setSubmitting(false)
      if (r.error) {
        toast.error(r.error)
        return
      }
      setEstado(siguiente)
      toast.success("Estado actualizado")
    })
  }

  function confirmarReprogramacion() {
    if (!nuevaFecha) {
      toast.error("Selecciona la nueva fecha y hora")
      return
    }
    const isoUtc = new Date(nuevaFecha).toISOString()
    setSubmitting(true)
    startTransition(async () => {
      const r = await cambiarEstadoCirugiaAction(cirugia.id, "reprogramada", isoUtc)
      setSubmitting(false)
      if (r.error && !r.ok) {
        toast.error(r.error)
        return
      }
      setEstado("reprogramada")
      setShowReprogramar(false)
      toast.success(
        r.error ? r.error : "Cirugía reprogramada"
      )
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">{paciente.nombre_completo}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              NSS {paciente.num_afiliacion_imss}
              {paciente.agregado ? ` · Agregado ${paciente.agregado}` : ""}
              {" · "}
              {paciente.edad} años
            </p>
          </div>
          <BadgeEstado estado={estado} />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cirugía</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dato label="Fecha y hora" value={fmt(cirugia.fecha_cirugia)} />
          <Dato label="Sala" value={cirugia.sala ?? "—"} />
          <Dato label="Prioridad" value={PRIORIDAD_LABEL[cirugia.prioridad]} />
          <Dato label="Tipo" value={TIPO_LABEL[cirugia.tipo_operacion]} />
          <Dato label="Duración estimada" value={`${cirugia.duracion_minutos} min`} />
          <Dato label="Programada con ≥48h" value={cirugia.programada_con_48h ? "Sí" : "No"} />
          <Dato label="Diagnóstico" value={cirugia.diagnostico} full />
          <Dato label="Procedimiento propuesto" value={cirugia.procedimiento_propuesto} full />
          <Dato label="Médico" value={`${medico.nombre_completo} · Mat. ${medico.matricula_imss}`} full />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Material solicitado ({materiales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {materiales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin materiales registrados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-10 py-2">#</th>
                  <th className="py-2">Material</th>
                  <th className="w-20 py-2 text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {materiales.map((m, i) => (
                  <tr key={`${m.orden}-${i}`} className="border-b last:border-b-0">
                    <td className="py-2 font-mono">{i + 1}</td>
                    <td className="py-2">{m.nombre}</td>
                    <td className="py-2 text-right">{m.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowImpresion(true)} className="w-full sm:w-auto">
            <Printer className="size-4" />
            Imprimir formatos
          </Button>

          {puedeEditar && (
            <>
              <Separator />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label className="mb-1 block text-xs">Cambiar estado</Label>
                  <Select
                    value={estado}
                    onValueChange={(v) => aplicarCambioEstado(v as EstadoCirugia)}
                    disabled={trabajando}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ModalImpresion
        open={showImpresion}
        cirugiaId={cirugia.id}
        onClose={() => setShowImpresion(false)}
      />

      <Dialog
        open={showReprogramar}
        onOpenChange={(v) => !v && !trabajando && setShowReprogramar(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar cirugía</DialogTitle>
            <DialogDescription>
              Selecciona la nueva fecha y hora. Si la nueva fecha queda con menos
              de 48 horas de antelación, se registrará en auditoría.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nueva-fecha">Nueva fecha y hora</Label>
            <Input
              id="nueva-fecha"
              type="datetime-local"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowReprogramar(false)}
              disabled={trabajando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarReprogramacion}
              disabled={trabajando}
            >
              Reprogramar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Dato({
  label,
  value,
  full = false,
}: {
  label: string
  value: string
  full?: boolean
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}
