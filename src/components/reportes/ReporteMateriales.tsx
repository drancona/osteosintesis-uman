"use client"

import { useEffect, useMemo, useState } from "react"
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import type {
  RowAgregada,
  RowDetallada,
  VistaReporte,
} from "@/app/api/reportes/materiales/route"
import type { EstadoCirugia, SistemaOsteo } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { EstadoTabs } from "@/components/cirugias/EstadoTabs"
import { BadgeEstado } from "@/components/cirugias/PanelCirugias"

interface Medico {
  id: string
  nombre_completo: string
}

interface Props {
  esAdmin: boolean
  medicos: Medico[]
}

const SISTEMAS: SistemaOsteo[] = [
  "Grandes Fragmentos",
  "Pequeños Fragmentos",
  "Fijación Externa",
  "Clavos K y Alambre",
  "Personalizado",
]

const ESTADOS: { value: EstadoCirugia | "todas"; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "reprogramada", label: "Reprogramadas" },
  { value: "realizada", label: "Realizadas" },
]

const PRESETS = [
  { value: "hoy", label: "Hoy" },
  { value: "esta-semana", label: "Esta semana" },
  { value: "prox-7", label: "Próximos 7 días" },
  { value: "este-mes", label: "Este mes" },
  { value: "prox-30", label: "Próximos 30 días" },
  { value: "personalizado", label: "Personalizado" },
] as const
type Preset = (typeof PRESETS)[number]["value"]

function isoLocalDay(d: Date): string {
  // YYYY-MM-DD para input type=date
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

function rangoDePreset(p: Preset): { desde: Date; hasta: Date } {
  const ahora = new Date()
  const opt = { weekStartsOn: 1 as const }
  switch (p) {
    case "hoy":
      return { desde: startOfDay(ahora), hasta: endOfDay(ahora) }
    case "esta-semana":
      return { desde: startOfWeek(ahora, opt), hasta: endOfWeek(ahora, opt) }
    case "prox-7":
      return { desde: startOfDay(ahora), hasta: endOfDay(new Date(ahora.getTime() + 7 * 86400000)) }
    case "este-mes":
      return { desde: startOfMonth(ahora), hasta: endOfMonth(ahora) }
    case "prox-30":
      return { desde: startOfDay(ahora), hasta: endOfDay(new Date(ahora.getTime() + 30 * 86400000)) }
    default:
      return { desde: startOfDay(ahora), hasta: endOfDay(ahora) }
  }
}

interface Filtros {
  desde: string // YYYY-MM-DD
  hasta: string
  medicoId: string // "todos" o uuid
  estado: EstadoCirugia | "todas"
  sistema: string // "todos" o sistema
}

const FILTRO_TODOS = "todos"

function fmtFecha(iso: string | null): string {
  if (!iso) return "—"
  return format(parseISO(iso), "dd/MM/yyyy", { locale: es })
}
function fmtFechaHora(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: es })
}

interface Respuesta {
  vista: VistaReporte
  filas: RowAgregada[] | RowDetallada[]
}

async function fetchReporte(
  filtros: Filtros,
  vista: VistaReporte
): Promise<Respuesta> {
  const desdeIso = startOfDay(parseISO(filtros.desde + "T00:00:00")).toISOString()
  const hastaIso = endOfDay(parseISO(filtros.hasta + "T00:00:00")).toISOString()
  const params = new URLSearchParams({
    desde: desdeIso,
    hasta: hastaIso,
    estado: filtros.estado,
    sistema: filtros.sistema,
    vista,
  })
  if (filtros.medicoId !== FILTRO_TODOS) params.set("medico_id", filtros.medicoId)
  const res = await fetch(`/api/reportes/materiales?${params.toString()}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status}`)
  }
  return (await res.json()) as Respuesta
}

export function ReporteMateriales({ medicos }: Props) {
  const ahoraInit = new Date()
  const [preset, setPreset] = useState<Preset>("este-mes")
  const [vista, setVista] = useState<VistaReporte>("agregada")
  const [filtros, setFiltros] = useState<Filtros>(() => {
    const r = rangoDePreset("este-mes")
    return {
      desde: isoLocalDay(r.desde),
      hasta: isoLocalDay(r.hasta),
      medicoId: FILTRO_TODOS,
      estado: "todas",
      sistema: FILTRO_TODOS,
    }
  })
  // ahoraInit suprime warning si no se usa.
  void ahoraInit

  function aplicarPreset(p: Preset) {
    setPreset(p)
    if (p === "personalizado") return
    const { desde, hasta } = rangoDePreset(p)
    setFiltros((f) => ({
      ...f,
      desde: isoLocalDay(desde),
      hasta: isoLocalDay(hasta),
    }))
  }

  const queryParams = useMemo(() => ({ ...filtros, vista }), [filtros, vista])

  const { data, isLoading, error } = useQuery({
    queryKey: ["reporte-materiales", queryParams],
    queryFn: () => fetchReporte(filtros, vista),
    staleTime: 30_000,
  })

  function exportar(formato: "pdf" | "xlsx") {
    const desdeIso = startOfDay(parseISO(filtros.desde + "T00:00:00")).toISOString()
    const hastaIso = endOfDay(parseISO(filtros.hasta + "T00:00:00")).toISOString()
    const params = new URLSearchParams({
      desde: desdeIso,
      hasta: hastaIso,
      estado: filtros.estado,
      sistema: filtros.sistema,
      vista,
    })
    if (filtros.medicoId !== FILTRO_TODOS) params.set("medico_id", filtros.medicoId)
    window.open(
      `/api/reportes/materiales/${formato}?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  useEffect(() => {
    if (error) toast.error((error as Error).message)
  }, [error])

  const filas = data?.filas ?? []
  const filasAgregadas = vista === "agregada" ? (filas as RowAgregada[]) : []
  const filasDetalladas = vista === "detallada" ? (filas as RowDetallada[]) : []
  const totalUnidades = filasAgregadas.reduce((acc, r) => acc + r.cantidad_total, 0)

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.value}
                type="button"
                variant={preset === p.value ? "default" : "outline"}
                size="sm"
                className="button-ios"
                onClick={() => aplicarPreset(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label className="mb-1 block text-xs">Desde</Label>
              <Input
                type="date"
                value={filtros.desde}
                onChange={(e) => {
                  setPreset("personalizado")
                  setFiltros((f) => ({ ...f, desde: e.target.value }))
                }}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Hasta</Label>
              <Input
                type="date"
                value={filtros.hasta}
                onChange={(e) => {
                  setPreset("personalizado")
                  setFiltros((f) => ({ ...f, hasta: e.target.value }))
                }}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Médico</Label>
              <Select
                value={filtros.medicoId}
                onValueChange={(v) => setFiltros((f) => ({ ...f, medicoId: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTRO_TODOS}>Todos los médicos</SelectItem>
                  {medicos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Estado</Label>
              <Select
                value={filtros.estado}
                onValueChange={(v) =>
                  setFiltros((f) => ({ ...f, estado: v as EstadoCirugia | "todas" }))
                }
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
            <div>
              <Label className="mb-1 block text-xs">Sistema</Label>
              <Select
                value={filtros.sistema}
                onValueChange={(v) => setFiltros((f) => ({ ...f, sistema: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FILTRO_TODOS}>Todos los sistemas</SelectItem>
                  {SISTEMAS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle de vista + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EstadoTabs<VistaReporte>
          tabs={[
            { value: "agregada", label: "Agregada" },
            { value: "detallada", label: "Detallada" },
          ]}
          value={vista}
          onChange={setVista}
          layoutId="vista-reporte-tabs"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="button-ios">
              <Download className="size-4" />
              Exportar
              <ChevronDown className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            <button
              type="button"
              onClick={() => exportar("pdf")}
              className="button-ios flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <FileText className="size-4" />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={() => exportar("xlsx")}
              className="button-ios flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              <FileSpreadsheet className="size-4" />
              Exportar Excel
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Resultados */}
      {isLoading ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
          Calculando reporte…
        </div>
      ) : vista === "agregada" ? (
        <>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Material</TableHead>
                  <TableHead className="w-[160px]">Sistema</TableHead>
                  <TableHead className="w-[120px] text-right">Cantidad total</TableHead>
                  <TableHead className="w-[120px] text-right"># Cirugías</TableHead>
                  <TableHead className="w-[140px]">Próxima fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filasAgregadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                      Sin datos en el rango seleccionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filasAgregadas.map((r) => (
                    <TableRow key={r.clave}>
                      <TableCell className="text-sm font-medium">{r.material}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.sistema}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.cantidad_total}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.num_cirugias}
                      </TableCell>
                      <TableCell className="text-sm">{fmtFecha(r.proxima_fecha)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-right text-sm text-muted-foreground">
            {filasAgregadas.length} materiales distintos · {totalUnidades} unidades totales
          </p>
        </>
      ) : (
        <div className="space-y-3">
          {filasDetalladas.length === 0 ? (
            <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
              Sin datos en el rango seleccionado.
            </div>
          ) : (
            filasDetalladas.map((r) => (
              <CardCirugia key={r.cirugia.id} fila={r} />
            ))
          )}
        </div>
      )}

      {/* `data` se consume implícitamente arriba; este placeholder evita
          el warning de variable no usada cuando isLoading es true. */}
      <span hidden>{data ? "" : ""}</span>
    </div>
  )
}

function CardCirugia({ fila }: { fila: RowDetallada }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <Card className="rounded-2xl">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="button-ios w-full text-left"
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="space-y-1">
            <p className="font-mono text-xs text-muted-foreground">
              {fmtFechaHora(fila.cirugia.fecha_cirugia)}
            </p>
            <CardTitle className="text-base font-semibold">
              {fila.cirugia.procedimiento_propuesto}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {fila.paciente.nombre_completo} · NSS {fila.paciente.num_afiliacion_imss}
              {" · "}Médico: {fila.medico.nombre_completo}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BadgeEstado estado={fila.cirugia.estado} />
            <ChevronDown
              className={`size-4 transition-transform ${abierto ? "rotate-180" : ""}`}
            />
          </div>
        </CardHeader>
      </button>
      {abierto && (
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-10 py-2">#</th>
                <th className="py-2">Material</th>
                <th className="w-32 py-2">Sistema</th>
                <th className="w-20 py-2 text-right">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {fila.materiales.map((m, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-2 font-mono">{i + 1}</td>
                  <td className="py-2">{m.nombre}</td>
                  <td className="py-2 text-xs text-muted-foreground">{m.sistema}</td>
                  <td className="py-2 text-right font-mono">{m.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      )}
    </Card>
  )
}
