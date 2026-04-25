"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { setActivoMaterialAction } from "@/app/(app)/admin/catalogo/actions"
import type { CatalogoMaterial } from "@/types/database"
import { SISTEMAS_VALIDOS } from "@/lib/schemas/catalogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
import { DialogMaterial } from "./DialogMaterial"

interface Props {
  materiales: CatalogoMaterial[]
}

const POR_PAGINA = 50
const FILTRO_TODOS = "__todos__"

function normalizar(s: string) {
  return s.toLocaleLowerCase("es").normalize("NFD").replace(/[̀-ͯ]/g, "")
}

export function PanelCatalogo({ materiales }: Props) {
  const router = useRouter()
  const [filas, setFilas] = useState<CatalogoMaterial[]>(materiales)
  const [filtro, setFiltro] = useState("")
  const [sistemaFiltro, setSistemaFiltro] = useState<string>(FILTRO_TODOS)
  const [pagina, setPagina] = useState(1)
  const [editando, setEditando] = useState<CatalogoMaterial | null>(null)
  const [crear, setCrear] = useState(false)
  const [, startTransition] = useTransition()

  const filtradas = useMemo(() => {
    const q = normalizar(filtro.trim())
    return filas.filter((m) => {
      if (sistemaFiltro !== FILTRO_TODOS && m.sistema !== sistemaFiltro)
        return false
      if (!q) return true
      return (
        normalizar(m.nombre).includes(q) ||
        normalizar(m.sistema).includes(q) ||
        normalizar(m.tipo).includes(q) ||
        normalizar(m.variante ?? "").includes(q)
      )
    })
  }, [filas, filtro, sistemaFiltro])

  const totalPag = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPag)
  const desde = (paginaActual - 1) * POR_PAGINA
  const visibles = filtradas.slice(desde, desde + POR_PAGINA)

  function aplicarLocal(id: number, mutator: (m: CatalogoMaterial) => CatalogoMaterial) {
    setFilas((arr) => arr.map((m) => (m.id === id ? mutator(m) : m)))
  }

  function toggleActivo(id: number, valor: boolean) {
    const previo = filas.find((m) => m.id === id)
    if (!previo) return
    aplicarLocal(id, (m) => ({ ...m, activo: valor }))
    startTransition(async () => {
      const r = await setActivoMaterialAction(id, valor)
      if (r.error) {
        aplicarLocal(id, (m) => ({ ...m, activo: previo.activo }))
        toast.error(r.error)
        return
      }
      toast.success(valor ? "Material reactivado" : "Material desactivado")
    })
  }

  function refrescar() {
    // Las server actions revalidan /admin/catalogo, basta con
    // empujar router.refresh() para traer la lista nueva del server.
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar por nombre, tipo o variante…"
            className="pl-8"
          />
        </div>
        <Select
          value={sistemaFiltro}
          onValueChange={(v) => {
            setSistemaFiltro(v)
            setPagina(1)
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILTRO_TODOS}>Todos los sistemas</SelectItem>
            {SISTEMAS_VALIDOS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {filtradas.length} de {filas.length}
        </p>
        <Button
          type="button"
          className="button-ios sm:ml-auto"
          onClick={() => setCrear(true)}
        >
          <Plus className="size-4" />
          Agregar material
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[160px]">Sistema</TableHead>
              <TableHead className="w-[110px]">Tipo</TableHead>
              <TableHead className="w-[80px] text-right">Ø mm</TableHead>
              <TableHead className="w-[70px] text-right">Orif.</TableHead>
              <TableHead className="w-[80px] text-right">Long. mm</TableHead>
              <TableHead>Variante</TableHead>
              <TableHead className="w-[80px]">Activo</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  Sin coincidencias.
                </TableCell>
              </TableRow>
            ) : (
              visibles.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm font-medium">
                    {m.nombre}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.sistema}
                  </TableCell>
                  <TableCell className="text-xs">{m.tipo}</TableCell>
                  <TableCell className="text-right text-xs">
                    {m.diametro_mm ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {m.orificios ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {m.longitud_mm ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.variante ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={m.activo}
                      onCheckedChange={(v) => toggleActivo(m.id, v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditando(m)}
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPag > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="button-ios"
          >
            Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {paginaActual} de {totalPag}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.min(totalPag, p + 1))}
            disabled={paginaActual === totalPag}
            className="button-ios"
          >
            Siguiente
          </Button>
        </div>
      )}

      <DialogMaterial
        open={crear}
        onOpenChange={setCrear}
        material={null}
        onSaved={refrescar}
      />
      <DialogMaterial
        open={editando !== null}
        onOpenChange={(v) => !v && setEditando(null)}
        material={editando}
        onSaved={refrescar}
      />
    </div>
  )
}
