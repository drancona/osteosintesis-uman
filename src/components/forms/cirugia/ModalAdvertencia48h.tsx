"use client"

import { AlertTriangle } from "lucide-react"

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
  horasDeAntelacion: number
  onCancelar: () => void
  onContinuar: () => void
  loading?: boolean
}

export function ModalAdvertencia48h({
  open,
  horasDeAntelacion,
  onCancelar,
  onContinuar,
  loading = false,
}: Props) {
  const horasFmt = Math.max(0, Math.round(horasDeAntelacion * 10) / 10)
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancelar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Antelación menor a 48 horas
          </DialogTitle>
          <DialogDescription>
            La cirugía se está programando con {horasFmt} horas de antelación.
            El material de osteosíntesis requiere 48 horas para solicitarse y
            procesarse adecuadamente. ¿Deseas continuar de todas formas?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onContinuar} disabled={loading}>
            Continuar de todas formas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
