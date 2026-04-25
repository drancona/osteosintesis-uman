"use client"

import { FileText, ClipboardSignature, Package, BedDouble } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  cirugiaId: string | null
  onClose: () => void
}

const TIPOS = [
  { tipo: "hoja-qx", label: "Hoja de cirugías", icono: FileText },
  { tipo: "consentimiento", label: "Consentimiento Informado", icono: ClipboardSignature },
  { tipo: "solicitud-material", label: "Solicitud de Material de Osteosíntesis", icono: Package },
  { tipo: "internamiento", label: "Solicitud de Internamiento", icono: BedDouble },
] as const

export function ModalImpresion({ open, cirugiaId, onClose }: Props) {
  function abrirPDF(tipo: string) {
    if (!cirugiaId) {
      toast.error("Falta el identificador de la cirugía")
      return
    }
    window.open(`/api/pdf/${tipo}/${cirugiaId}`, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cirugía programada exitosamente</DialogTitle>
          <DialogDescription>
            Selecciona un formato para abrirlo en una pestaña nueva o cierra esta ventana.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TIPOS.map(({ tipo, label, icono: Icono }) => (
            <Button
              key={tipo}
              type="button"
              variant="outline"
              className="h-20 justify-start gap-3"
              onClick={() => abrirPDF(tipo)}
              disabled={!cirugiaId}
            >
              <Icono className="size-5" />
              <span className="text-left text-sm font-medium">{label}</span>
            </Button>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
