"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Plus, Search } from "lucide-react"

import {
  cambiarRolUsuarioAction,
  toggleActivoUsuarioAction,
} from "@/app/(app)/admin/usuarios/actions"
import { DialogCrearProveedor } from "@/components/admin/DialogCrearProveedor"
import type { UserRole } from "@/types/database"
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
import { Badge } from "@/components/ui/badge"

export interface UsuarioFila {
  id: string
  nombre_completo: string
  matricula_imss: string | null
  email: string
  role: UserRole
  activo: boolean
  created_at: string
}

interface Props {
  usuarios: UsuarioFila[]
  actualUsuarioId: string
}

const ROL_OPTS: { value: UserRole; label: string }[] = [
  { value: "medico", label: "Médico/a" },
  { value: "enfermera", label: "Enfermero/a" },
  { value: "admin", label: "Administrador/a" },
  { value: "proveedor", label: "Proveedor" },
]

function fmt(iso: string): string {
  return format(parseISO(iso), "dd/MM/yyyy", { locale: es })
}

function normalizar(s: string) {
  return s.toLocaleLowerCase("es").normalize("NFD").replace(/[̀-ͯ]/g, "")
}

export function PanelUsuarios({ usuarios, actualUsuarioId }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState("")
  const [filas, setFilas] = useState<UsuarioFila[]>(usuarios)
  const [crearProveedor, setCrearProveedor] = useState(false)
  const [, startTransition] = useTransition()

  const filtradas = useMemo(() => {
    const q = normalizar(filtro.trim())
    if (!q) return filas
    return filas.filter(
      (u) =>
        normalizar(u.nombre_completo).includes(q) ||
        normalizar(u.matricula_imss ?? "").includes(q) ||
        normalizar(u.email).includes(q)
    )
  }, [filas, filtro])

  function aplicarLocal(uid: string, mutator: (u: UsuarioFila) => UsuarioFila) {
    setFilas((arr) => arr.map((u) => (u.id === uid ? mutator(u) : u)))
  }

  function cambiarRol(uid: string, nuevoRol: UserRole) {
    const previo = filas.find((u) => u.id === uid)
    if (!previo) return
    aplicarLocal(uid, (u) => ({ ...u, role: nuevoRol }))
    startTransition(async () => {
      const r = await cambiarRolUsuarioAction(uid, nuevoRol)
      if (r.error) {
        aplicarLocal(uid, (u) => ({ ...u, role: previo.role }))
        toast.error(r.error)
        return
      }
      toast.success("Rol actualizado")
    })
  }

  function toggleActivo(uid: string, valor: boolean) {
    const previo = filas.find((u) => u.id === uid)
    if (!previo) return
    aplicarLocal(uid, (u) => ({ ...u, activo: valor }))
    startTransition(async () => {
      const r = await toggleActivoUsuarioAction(uid, valor)
      if (r.error) {
        aplicarLocal(uid, (u) => ({ ...u, activo: previo.activo }))
        toast.error(r.error)
        return
      }
      toast.success(valor ? "Usuario activado" : "Usuario desactivado")
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nombre, matrícula o email…"
            className="pl-8"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filtradas.length} de {filas.length}
        </p>
        <Button
          type="button"
          className="button-ios sm:ml-auto"
          onClick={() => setCrearProveedor(true)}
        >
          <Plus className="size-4" />
          Crear cuenta de proveedor
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[120px]">Matrícula</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[160px]">Rol</TableHead>
              <TableHead className="w-[110px]">Activo</TableHead>
              <TableHead className="w-[110px]">Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  Sin coincidencias.
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((u) => {
                const esYo = u.id === actualUsuarioId
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{u.nombre_completo}</span>
                        {esYo && (
                          <Badge variant="secondary" className="text-xs">
                            Tú
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.matricula_imss ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => cambiarRol(u.id, v as UserRole)}
                        disabled={esYo}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROL_OPTS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.activo}
                        onCheckedChange={(v) => toggleActivo(u.id, v)}
                        disabled={esYo}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {fmt(u.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DialogCrearProveedor
        open={crearProveedor}
        onOpenChange={setCrearProveedor}
        onCreated={() => router.refresh()}
      />
    </div>
  )
}
