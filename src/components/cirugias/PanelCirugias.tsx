"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarOff, Eye } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import type { CirugiaListaItem } from "@/lib/queries/cirugias"
import type { EstadoCirugia } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
}

const TABS: Array<{ value: EstadoFiltro; label: string }> = [
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

export function PanelCirugias({ cirugias, estadoActual, esAdmin }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function cambiarTab(value: EstadoFiltro) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("estado", value)
    router.push(`/cirugias?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cirugías programadas
        </h1>
        <p className="text-sm text-muted-foreground">
          {esAdmin ? "Todas las cirugías" : "Tus cirugías"}
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
                {esAdmin && <TableHead>Médico</TableHead>}
                <TableHead className="w-[80px] text-right">Acciones</TableHead>
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
                  {esAdmin && (
                    <TableCell className="text-sm">
                      {c.medico.nombre_completo}
                      <span className="block text-xs text-muted-foreground">
                        Mat. {c.medico.matricula_imss}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/cirugias/${c.id}`}>
                        <Eye className="size-4" />
                        Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
