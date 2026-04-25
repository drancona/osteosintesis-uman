import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import type { CatalogoMaterial, EstadoCirugia, Paciente, Profile, SistemaOsteo } from "@/types/database"

export type VistaReporte = "agregada" | "detallada"

export interface RowAgregada {
  clave: string
  material: string
  sistema: SistemaOsteo
  cantidad_total: number
  num_cirugias: number
  proxima_fecha: string | null
}

export interface RowDetallada {
  cirugia: {
    id: string
    fecha_cirugia: string
    procedimiento_propuesto: string
    sala: string | null
    estado: EstadoCirugia
    diagnostico: string
  }
  paciente: Pick<Paciente, "id" | "nombre_completo" | "num_afiliacion_imss" | "edad">
  medico: Pick<Profile, "id" | "nombre_completo" | "matricula_imss">
  materiales: { nombre: string; cantidad: number; sistema: SistemaOsteo }[]
}

interface FilaUnida {
  cantidad: number
  cirugia_id: string
  fecha_cirugia: string
  estado: EstadoCirugia
  procedimiento_propuesto: string
  sala: string | null
  diagnostico: string
  medico_id: string
  paciente: {
    id: string
    nombre_completo: string
    num_afiliacion_imss: string
    edad: number
  }
  medico: { id: string; nombre_completo: string; matricula_imss: string | null }
  material_id: number | null
  nombre_personalizado: string | null
  catalogo: { id: number; nombre: string; sistema: SistemaOsteo } | null
}

const ESTADOS_VALIDOS: EstadoCirugia[] = [
  "pendiente",
  "reprogramada",
  "realizada",
  "suspendida",
]
const SISTEMAS: SistemaOsteo[] = [
  "Grandes Fragmentos",
  "Pequeños Fragmentos",
  "Fijación Externa",
  "Clavos K y Alambre",
  "Personalizado",
]

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const desde = sp.get("desde")
  const hasta = sp.get("hasta")
  const medicoId = sp.get("medico_id")
  const estado = (sp.get("estado") ?? "todas").toLowerCase()
  const sistema = sp.get("sistema") ?? "todos"
  const vista = (sp.get("vista") ?? "agregada").toLowerCase() as VistaReporte

  if (!desde || !hasta || Number.isNaN(Date.parse(desde)) || Number.isNaN(Date.parse(hasta))) {
    return NextResponse.json({ error: "Faltan o son inválidos 'desde' y 'hasta'" }, { status: 400 })
  }
  if (estado !== "todas" && !ESTADOS_VALIDOS.includes(estado as EstadoCirugia)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }
  if (sistema !== "todos" && !SISTEMAS.includes(sistema as SistemaOsteo)) {
    return NextResponse.json({ error: "Sistema inválido" }, { status: 400 })
  }
  if (vista !== "agregada" && vista !== "detallada") {
    return NextResponse.json({ error: "Vista inválida" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  // Defensa de aplicación: solo admin o proveedor consultan reportes.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, activo")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "activo">>()
  if (!profile?.activo) return NextResponse.json({ error: "Inactivo" }, { status: 403 })
  if (profile.role !== "admin" && profile.role !== "proveedor") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  // Traemos materiales con su cirugía padre joineada. La RLS:
  // - Para proveedor: ya filtra cirugías suspendidas (policy RESTRICTIVE).
  // - Para admin: ve todo.
  let query = supabase
    .from("cirugia_materiales")
    .select(`
      cantidad,
      material_id,
      nombre_personalizado,
      cirugia:cirugias!cirugia_materiales_cirugia_id_fkey(
        id, fecha_cirugia, estado, procedimiento_propuesto, sala, diagnostico, medico_id,
        paciente:pacientes!cirugias_paciente_id_fkey(id, nombre_completo, num_afiliacion_imss, edad),
        medico:profiles!cirugias_medico_id_fkey(id, nombre_completo, matricula_imss)
      )
    `)
    // El filtro por fecha requiere que el join no sea null; se hace en JS abajo.

  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Catálogo para resolver nombres y sistema de los materiales del catálogo.
  const ids = Array.from(
    new Set(
      (rows ?? [])
        .map((r) => r.material_id)
        .filter((v): v is number => typeof v === "number")
    )
  )
  const catalogoMap = new Map<number, Pick<CatalogoMaterial, "id" | "nombre" | "sistema">>()
  if (ids.length) {
    const { data: cat } = await supabase
      .from("catalogo_material")
      .select("id, nombre, sistema")
      .in("id", ids)
    cat?.forEach((c) => catalogoMap.set(c.id, c as Pick<CatalogoMaterial, "id" | "nombre" | "sistema">))
  }

  // Aplanamos y filtramos.
  const desdeMs = Date.parse(desde)
  const hastaMs = Date.parse(hasta)
  const unidas: FilaUnida[] = []
  for (const r of rows ?? []) {
    const c = (r as unknown as { cirugia: FilaUnida["cirugia_id"] extends string ? unknown : unknown }).cirugia as
      | (Omit<FilaUnida, "cantidad" | "material_id" | "nombre_personalizado" | "catalogo" | "cirugia_id"> & { id: string })
      | null
    if (!c) continue
    const fechaMs = Date.parse(c.fecha_cirugia)
    if (Number.isNaN(fechaMs) || fechaMs < desdeMs || fechaMs > hastaMs) continue
    if (estado !== "todas" && c.estado !== estado) continue
    if (medicoId && c.medico_id !== medicoId) continue

    const cat = r.material_id ? catalogoMap.get(r.material_id) ?? null : null
    const sistemaItem: SistemaOsteo = cat?.sistema ?? "Personalizado"
    if (sistema !== "todos" && sistemaItem !== sistema) continue

    unidas.push({
      cantidad: r.cantidad,
      material_id: r.material_id,
      nombre_personalizado: r.nombre_personalizado,
      cirugia_id: c.id,
      fecha_cirugia: c.fecha_cirugia,
      estado: c.estado,
      procedimiento_propuesto: c.procedimiento_propuesto,
      sala: c.sala,
      diagnostico: c.diagnostico,
      medico_id: c.medico_id,
      paciente: c.paciente,
      medico: c.medico,
      catalogo: cat,
    })
  }

  if (vista === "detallada") {
    const porCirugia = new Map<string, RowDetallada>()
    for (const u of unidas) {
      const nombre = u.catalogo?.nombre ?? u.nombre_personalizado ?? "(sin nombre)"
      const sis: SistemaOsteo = u.catalogo?.sistema ?? "Personalizado"
      let entry = porCirugia.get(u.cirugia_id)
      if (!entry) {
        entry = {
          cirugia: {
            id: u.cirugia_id,
            fecha_cirugia: u.fecha_cirugia,
            procedimiento_propuesto: u.procedimiento_propuesto,
            sala: u.sala,
            estado: u.estado,
            diagnostico: u.diagnostico,
          },
          paciente: u.paciente,
          medico: u.medico,
          materiales: [],
        }
        porCirugia.set(u.cirugia_id, entry)
      }
      entry.materiales.push({ nombre, cantidad: u.cantidad, sistema: sis })
    }
    const detalladas = Array.from(porCirugia.values()).sort(
      (a, b) =>
        Date.parse(a.cirugia.fecha_cirugia) - Date.parse(b.cirugia.fecha_cirugia)
    )
    return NextResponse.json({ vista: "detallada", filas: detalladas })
  }

  // vista === 'agregada'
  const ESTADOS_FUTURO: EstadoCirugia[] = ["pendiente", "reprogramada"]
  const agregado = new Map<string, RowAgregada & { cirugias: Set<string> }>()
  for (const u of unidas) {
    const nombre = u.catalogo?.nombre ?? u.nombre_personalizado ?? "(sin nombre)"
    const sis: SistemaOsteo = u.catalogo?.sistema ?? "Personalizado"
    const clave = u.material_id ? `cat:${u.material_id}` : `pers:${nombre.toLowerCase()}`
    let entry = agregado.get(clave)
    if (!entry) {
      entry = {
        clave,
        material: nombre,
        sistema: sis,
        cantidad_total: 0,
        num_cirugias: 0,
        proxima_fecha: null,
        cirugias: new Set<string>(),
      }
      agregado.set(clave, entry)
    }
    entry.cantidad_total += u.cantidad
    entry.cirugias.add(u.cirugia_id)
    if (ESTADOS_FUTURO.includes(u.estado)) {
      if (!entry.proxima_fecha || Date.parse(u.fecha_cirugia) < Date.parse(entry.proxima_fecha)) {
        entry.proxima_fecha = u.fecha_cirugia
      }
    }
  }
  const agregadas: RowAgregada[] = Array.from(agregado.values())
    .map(({ cirugias, ...row }) => ({ ...row, num_cirugias: cirugias.size }))
    .sort((a, b) => b.cantidad_total - a.cantidad_total)

  return NextResponse.json({ vista: "agregada", filas: agregadas })
}
