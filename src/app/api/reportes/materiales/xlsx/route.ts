import { NextResponse, type NextRequest } from "next/server"
import ExcelJS from "exceljs"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { HOSPITAL } from "@/lib/constants"
import type {
  RowAgregada,
  RowDetallada,
  VistaReporte,
} from "@/app/api/reportes/materiales/route"
import type { Profile } from "@/types/database"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, activo")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "activo">>()
  if (!profile?.activo || (profile.role !== "admin" && profile.role !== "proveedor")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const desde = sp.get("desde")!
  const hasta = sp.get("hasta")!
  const vista = (sp.get("vista") ?? "agregada") as VistaReporte

  const url = new URL("/api/reportes/materiales", req.url)
  for (const [k, v] of sp.entries()) url.searchParams.set(k, v)
  const dataRes = await fetch(url, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
  })
  if (!dataRes.ok) {
    const body = await dataRes.json().catch(() => ({}))
    return NextResponse.json(body, { status: dataRes.status })
  }
  const json = (await dataRes.json()) as {
    vista: VistaReporte
    filas: RowAgregada[] | RowDetallada[]
  }

  let medicoNombre = "Todos los médicos"
  const medicoId = sp.get("medico_id")
  if (medicoId) {
    const adm = createAdminClient()
    const { data: m } = await adm
      .from("profiles")
      .select("nombre_completo")
      .eq("id", medicoId)
      .single()
    medicoNombre = m?.nombre_completo ?? "Médico desconocido"
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = "Osteosíntesis · " + HOSPITAL.nombre
  wb.created = new Date()

  // Resumen
  const ws1 = wb.addWorksheet("Resumen")
  ws1.columns = [
    { header: "Campo", key: "campo", width: 22 },
    { header: "Valor", key: "valor", width: 60 },
  ]
  ws1.getRow(1).font = { bold: true }
  ws1.addRows([
    { campo: "Hospital", valor: `${HOSPITAL.nombre} · ${HOSPITAL.ooad}` },
    { campo: "Reporte", valor: "Materiales de osteosíntesis" },
    { campo: "Vista", valor: vista },
    { campo: "Desde", valor: desde.slice(0, 10) },
    { campo: "Hasta", valor: hasta.slice(0, 10) },
    { campo: "Estado", valor: sp.get("estado") ?? "todas" },
    { campo: "Sistema", valor: sp.get("sistema") ?? "todos" },
    { campo: "Médico", valor: medicoNombre },
    { campo: "Generado", valor: new Date().toLocaleString("es-MX") },
  ])

  if (vista === "agregada") {
    const ws2 = wb.addWorksheet("Materiales")
    ws2.columns = [
      { header: "Material", key: "material", width: 50 },
      { header: "Sistema", key: "sistema", width: 24 },
      { header: "Cantidad total", key: "cantidad", width: 16 },
      { header: "# Cirugías", key: "num_cirugias", width: 12 },
      { header: "Próxima fecha", key: "proxima", width: 16 },
    ]
    ws2.getRow(1).font = { bold: true }
    for (const r of json.filas as RowAgregada[]) {
      ws2.addRow({
        material: r.material,
        sistema: r.sistema,
        cantidad: r.cantidad_total,
        num_cirugias: r.num_cirugias,
        proxima: r.proxima_fecha ? r.proxima_fecha.slice(0, 10) : "",
      })
    }
    const total = (json.filas as RowAgregada[]).reduce(
      (acc, r) => acc + r.cantidad_total,
      0
    )
    ws2.addRow({})
    const totalRow = ws2.addRow({
      material: "TOTAL",
      sistema: "",
      cantidad: total,
    })
    totalRow.font = { bold: true }
  } else {
    const ws2 = wb.addWorksheet("Cirugías")
    ws2.columns = [
      { header: "Fecha", key: "fecha", width: 18 },
      { header: "Procedimiento", key: "procedimiento", width: 50 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Sala", key: "sala", width: 10 },
      { header: "Paciente", key: "paciente", width: 32 },
      { header: "NSS", key: "nss", width: 14 },
      { header: "Médico", key: "medico", width: 28 },
      { header: "Material", key: "material", width: 40 },
      { header: "Sistema", key: "sistema", width: 22 },
      { header: "Cantidad", key: "cantidad", width: 10 },
    ]
    ws2.getRow(1).font = { bold: true }
    for (const r of json.filas as RowDetallada[]) {
      for (const m of r.materiales) {
        ws2.addRow({
          fecha: r.cirugia.fecha_cirugia.replace("T", " ").slice(0, 16),
          procedimiento: r.cirugia.procedimiento_propuesto,
          estado: r.cirugia.estado,
          sala: r.cirugia.sala ?? "",
          paciente: r.paciente.nombre_completo,
          nss: r.paciente.num_afiliacion_imss,
          medico: r.medico.nombre_completo,
          material: m.nombre,
          sistema: m.sistema,
          cantidad: m.cantidad,
        })
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  const filename = `reporte-materiales-${vista}-${desde.slice(0, 10)}-${hasta.slice(0, 10)}.xlsx`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  })
}
