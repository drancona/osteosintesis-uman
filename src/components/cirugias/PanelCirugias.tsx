"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CalendarOff,
  Eye,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import type { CirugiaListaItem } from "@/lib/queries/cirugias"
import type { EstadoCirugia } from "@/types/database"
import { eliminarCirugiaAction } from "@/app/(app)/cirugias/[id]/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EstadoTabs } from "./EstadoTabs"

type EstadoFiltro = EstadoCirugia | "todas"

interface Props {
  cirugias: CirugiaListaItem[]
  estadoActual: EstadoFiltro
  esAdmin: boolean
  esProveedor: boolean
  usuarioId: string
}

const TABS_BASE: Array<{ value: EstadoFiltro; label: string }> = [
  { value: "pendiente", label: "Pendientes" },
  { value: "reprogramada", label: "Reprogramadas" },
  { value: "realizada", label: "Realizadas" },
  { value: "suspendida", label: "Suspendidas" },
  { value: "todas", label: "Todas" },
]

const LABEL_ESTADO: Record<EstadoCirugia, string> = {
  pendiente: "Pendiente",
  reprogramada: "Reprogramada",
  realizada: "Realizada",
  suspendida: "Suspendida",
}

export function BadgeEstado({ estado }: { estado: EstadoCirugia }) {
  switch (estado) {
    case "pendiente":
      return <Badge variant="secondary">{LABEL_ESTADO[estado]}</Badge>
    case "reprogramada":
      return (
        <Badge
          variant="outline"
          style={{
            borderColor: "var(--warning)",
            color: "var(--warning)",
          }}
        >
          {LABEL_ESTADO[estado]}
        </Badge>
      )
    case "realizada":
      return (
        <Badge
          style={{ backgroundColor: "var(--success)" }}
          className="text-white hover:opacity-90"
        >
          {LABEL_ESTADO[estado]}
        </Badge>
      )
    case "suspendida":
      return <Badge variant="destructive">{LABEL_ESTADO[estado]}</Badge>
  }
}

function formatearFechaHora(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: es })
}

export function PanelCirugias({
  cirugias,
  estadoActual,
  esAdmin,
  esProveedor,
  usuarioId,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [aEliminar, setAEliminar] = useState<CirugiaListaItem | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [, startTransition] = useTransition()

  const TABS = esProveedor
    ? TABS_BASE.filter((t) => t.value !== "suspendida")
    : TABS_BASE
  const verMedico = esAdmin || esProveedor
  // Solo no-proveedor ve la columna acciones (proveedor accede al detalle
  // por click en la fila o por el botón "Ver" del menú).
  const verAcciones = !esProveedor

  function cambiarTab(value: EstadoFiltro) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("estado", value)
    router.push(`/cirugias?${params.toString()}`)
  }

  function puedeEliminar(c: CirugiaListaItem): boolean {
    if (esProveedor) return false
    return esAdmin || c.medico.id === usuarioId
  }

  function confirmarEliminar() {
    if (!aEliminar) return
    setEliminando(true)
    startTransition(async () => {
      const r = await eliminarCirugiaAction(aEliminar.id)
      setEliminando(false)
      if (r.error) {
        toast.error(r.error)
        return
      }
      toast.success("Cirugía eliminada")
      setAEliminar(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cirugías programadas
        </h1>
        <p className="text-sm text-muted-foreground">
          {esProveedor
            ? "Cirugías programadas del servicio"
            : esAdmin
              ? "Todas las cirugías"
              : "Tus cirugías"}
        </p>
      </header>

      <div className="overflow-x-auto">
        <EstadoTabs<EstadoFiltro>
          tabs={TABS}
          value={estadoActual}
          onChange={cambiarTab}
          layoutId="panel-cirugias-tabs"
        />
      </div>

      {cirugias.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-20 text-center">
          <CalendarOff className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No hay cirugías {estadoActual === "todas" ? "registradas" : LABEL_ESTADO[estadoActual as EstadoCirugia]?.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[160px]">Fecha y hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Procedimiento</TableHead>
                <TableHead className="w-[100px]">Sala</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                {verMedico && <TableHead>Médico</TableHead>}
                {verAcciones && (
                  <TableHead className="w-[110px] text-right">Acciones</TableHead>
                )}
                {esProveedor && (
                  <TableHead className="w-[60px] text-right"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cirugias.map((c) => (
                <TableRow
                  key={c.id}
                  className="button-ios cursor-pointer transition-colors duration-150 hover:bg-muted/50"
                  onClick={() => router.push(`/cirugias/${c.id}`)}
                >
                  <TableCell className="font-mono text-xs">
                    {formatearFechaHora(c.fecha_cirugia)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {c.paciente.nombre_completo}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        NSS {c.paciente.num_afiliacion_imss} · {c.paciente.edad} años
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <span className="line-clamp-2 text-sm">
                      {c.procedimiento_propuesto}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{c.sala ?? "—"}</TableCell>
                  <TableCell>
                    <BadgeEstado estado={c.estado} />
                  </TableCell>
                  {verMedico && (
                    <TableCell className="text-sm">
                      {c.medico.nombre_completo}
                      <span className="block text-xs text-muted-foreground">
                        {c.medico.matricula_imss
                          ? `Mat. ${c.medico.matricula_imss}`
                          : "—"}
                      </span>
                    </TableCell>
                  )}
                  {verAcciones && (
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/cirugias/${c.id}`}>
                            <Eye className="size-4" />
                            Ver
                          </Link>
                        </Button>
                        {puedeEliminar(c) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Más acciones"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setAEliminar(c)
                                }}
                              >
                                <Trash2 className="size-4" />
                                Eliminar cirugía
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {esProveedor && (
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/cirugias/${c.id}`}>
                          <Eye className="size-4" />
                          Ver
                        </Link>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={aEliminar !== null}
        onOpenChange={(v) => !v && !eliminando && setAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar cirugía permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la cirugía, todos
              sus materiales solicitados y los registros de auditoría
              asociados. El paciente no se eliminará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando} className="button-ios">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={eliminando}
              onClick={(e) => {
                e.preventDefault()
                confirmarEliminar()
              }}
              className="button-ios bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Eliminando…
                </>
              ) : (
                "Eliminar permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
