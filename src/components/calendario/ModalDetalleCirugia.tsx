"use client"

import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import type { CirugiaCalendarioRow } from "@/app/api/cirugias/route"
import { BadgeEstado } from "@/components/cirugias/PanelCirugias"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog"
import { DialogTitle } from "@radix-ui/react-dialog"

interface Props {
  open: boolean
  cirugia: CirugiaCalendarioRow | null
  onOpenChange: (v: boolean) => void
}

const PRIORIDAD: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
}
const TIPO: Record<string, string> = {
  electiva: "Electiva",
  urgencia: "Urgencia",
}

function fmt(iso: string): string {
  return format(parseISO(iso), "EEEE d 'de' MMMM, HH:mm", { locale: es })
}

export function ModalDetalleCirugia({ open, cirugia, onOpenChange }: Props) {
  const router = useRouter()
  if (!cirugia) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <BadgeEstado estado={cirugia.estado} />
          <DialogTitle className="text-2xl font-semibold leading-tight tracking-tight">
            {cirugia.procedimiento_propuesto}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <Seccion titulo="Paciente">
            <p className="font-medium">{cirugia.paciente.nombre_completo}</p>
            <p className="text-muted-foreground">
              NSS {cirugia.paciente.num_afiliacion_imss}
              {cirugia.paciente.agregado
                ? ` · Agregado ${cirugia.paciente.agregado}`
                : ""}{" "}
              · {cirugia.paciente.edad} años
            </p>
          </Seccion>

          <Seccion titulo="Médico">
            <p className="font-medium">{cirugia.medico.nombre_completo}</p>
            <p className="text-muted-foreground">
              Mat. {cirugia.medico.matricula_imss}
            </p>
          </Seccion>

          <Seccion titulo="Cirugía">
            <p className="font-medium first-letter:uppercase">
              {fmt(cirugia.fecha_cirugia)}
            </p>
            <p className="text-muted-foreground">
              {cirugia.duracion_minutos} min · {cirugia.sala ?? "Sin sala"} ·
              Prioridad {PRIORIDAD[cirugia.prioridad]} ·{" "}
              {TIPO[cirugia.tipo_operacion]}
            </p>
          </Seccion>

          <Seccion titulo="Diagnóstico">
            <p>{cirugia.diagnostico}</p>
          </Seccion>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="button-ios"
          >
            Cerrar
          </Button>
          <Button
            type="button"
            className="button-ios"
            onClick={() => {
              onOpenChange(false)
              router.push(`/cirugias/${cirugia.id}`)
            }}
          >
            Ver detalle completo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase text-muted-foreground">{titulo}</p>
      {children}
    </div>
  )
}
