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

const PROXIMAMENTE = "Generación de PDF disponible en próxima versión"

export function ModalImpresion({ open, onClose }: Props) {
  function aviso() {
    toast.info(PROXIMAMENTE)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cirugía programada exitosamente</DialogTitle>
          <DialogDescription>
            Selecciona un formato para imprimir o cerrar esta ventana.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-20 justify-start gap-3"
            onClick={aviso}
          >
            <FileText className="size-5" />
            <span className="text-left text-sm font-medium">
              Hoja de cirugías
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-20 justify-start gap-3"
            onClick={aviso}
          >
            <ClipboardSignature className="size-5" />
            <span className="text-left text-sm font-medium">
              Consentimiento Informado
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-20 justify-start gap-3"
            onClick={aviso}
          >
            <Package className="size-5" />
            <span className="text-left text-sm font-medium">
              Solicitud de Material de Osteosíntesis
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-20 justify-start gap-3"
            onClick={aviso}
          >
            <BedDouble className="size-5" />
            <span className="text-left text-sm font-medium">
              Solicitud de Internamiento
            </span>
          </Button>
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
