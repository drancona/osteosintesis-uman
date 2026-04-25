"use client"

import { useState, useTransition } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
  cirugiaSchema,
  type CirugiaInput,
} from "@/lib/schemas/cirugia"
import { useCatalogo } from "@/hooks/use-catalogo"
import { crearCirugiaAction } from "@/app/(app)/cirugias/nueva/actions"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SeccionPaciente } from "./SeccionPaciente"
import { SeccionCirugia } from "./SeccionCirugia"
import { SeccionMateriales } from "./SeccionMateriales"
import { ModalAdvertencia48h } from "./ModalAdvertencia48h"
import { ModalImpresion } from "./ModalImpresion"

const DEFAULTS: CirugiaInput = {
  paciente: {
    num_afiliacion_imss: "",
    agregado: null,
    nombre_completo: "",
    edad: Number.NaN,
    telefono: null,
    direccion: null,
    incapacitado: false,
    tipo_incapacidad: null,
  },
  fecha_cirugia: "",
  duracion_minutos: 60,
  sala: null,
  prioridad: "media",
  tipo_operacion: "electiva",
  diagnostico: "",
  procedimiento_propuesto: "",
  materiales: [],
}

function horasHasta(fechaIso: string): number {
  const t = Date.parse(fechaIso)
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY
  return (t - Date.now()) / 3_600_000
}

export function FormProgramarCirugia() {
  const router = useRouter()
  const { catalogo, isLoading: cargandoCatalogo, error: errorCatalogo } = useCatalogo()
  const [pendingValues, setPendingValues] = useState<CirugiaInput | null>(null)
  const [horasAdv, setHorasAdv] = useState<number>(0)
  const [showAdvertencia, setShowAdvertencia] = useState(false)
  const [showImpresion, setShowImpresion] = useState(false)
  const [cirugiaId, setCirugiaId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<CirugiaInput>({
    resolver: zodResolver(cirugiaSchema),
    defaultValues: DEFAULTS,
    mode: "onSubmit",
  })

  const enviar = (values: CirugiaInput) => {
    setSubmitting(true)
    startTransition(async () => {
      const result = await crearCirugiaAction(values)
      setSubmitting(false)
      if (result.error || !result.cirugia_id) {
        toast.error(result.error ?? "No se pudo crear la cirugía")
        return
      }
      setCirugiaId(result.cirugia_id)
      setShowImpresion(true)
      toast.success("Cirugía programada")
    })
  }

  function onSubmit(values: CirugiaInput) {
    const horas = horasHasta(values.fecha_cirugia)
    if (horas < 48) {
      setHorasAdv(horas)
      setPendingValues(values)
      setShowAdvertencia(true)
      return
    }
    enviar(values)
  }

  function continuarTrasAdvertencia() {
    setShowAdvertencia(false)
    if (pendingValues) {
      const v = pendingValues
      setPendingValues(null)
      enviar(v)
    }
  }

  function cerrarImpresion() {
    setShowImpresion(false)
    router.push("/")
  }

  if (errorCatalogo) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar el catálogo</AlertTitle>
        <AlertDescription>{errorCatalogo.message}</AlertDescription>
      </Alert>
    )
  }

  if (cargandoCatalogo) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  const enviando = isPending || submitting

  return (
    <>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          noValidate
        >
          <SeccionPaciente />
          <Separator />
          <SeccionCirugia />
          <Separator />
          <SeccionMateriales catalogo={catalogo} />
          <Separator />
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/")}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Programando…
                </>
              ) : (
                "Programar cirugía"
              )}
            </Button>
          </div>
        </form>
      </FormProvider>

      <ModalAdvertencia48h
        open={showAdvertencia}
        horasDeAntelacion={horasAdv}
        loading={enviando}
        onCancelar={() => {
          setShowAdvertencia(false)
          setPendingValues(null)
        }}
        onContinuar={continuarTrasAdvertencia}
      />

      <ModalImpresion
        open={showImpresion}
        cirugiaId={cirugiaId}
        onClose={cerrarImpresion}
      />
    </>
  )
}
