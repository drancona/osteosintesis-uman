import { createElement, type ReactElement } from "react"
import path from "node:path"
import { existsSync, readFileSync } from "node:fs"
import { NextResponse, type NextRequest } from "next/server"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { HOSPITAL } from "@/lib/constants"
import { ReporteMaterialesPDF } from "@/components/pdf/templates/ReporteMateriales"
import type {
  RowAgregada,
  RowDetallada,
  VistaReporte,
} from "@/app/api/reportes/materiales/route"
import type { Profile } from "@/types/database"

export async function GET(req: NextRequest) {
  // Reusamos el mismo handler de datos llamando al endpoint hermano para
  // mantener la lógica de filtros en un solo lugar. Pero como estamos en
  // el mismo proceso, vale más invocar la función a través de un fetch
  // interno. Sin embargo, fetch desde el server requiere URL absoluta;
  // para evitar acoplar a NEXT_PUBLIC_APP_URL, replicamos el filtrado
  // mínimo aquí pidiendo a /api/reportes/materiales del propio host.
  const sp = req.nextUrl.searchParams
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

  const desde = sp.get("desde")!
  const hasta = sp.get("hasta")!
  const vista = (sp.get("vista") ?? "agregada") as VistaReporte

  // Llama al endpoint sibling reusando los headers (cookies) del request
  // entrante, así Supabase ve la misma sesión.
  const url = new URL("/api/reportes/materiales", req.url)
  for (const [k, v] of sp.entries()) url.searchParams.set(k, v)
  const cookies = req.headers.get("cookie") ?? ""
  const dataRes = await fetch(url, { headers: { cookie: cookies } })
  if (!dataRes.ok) {
    const body = await dataRes.json().catch(() => ({}))
    return NextResponse.json(body, { status: dataRes.status })
  }
  const json = (await dataRes.json()) as {
    vista: VistaReporte
    filas: RowAgregada[] | RowDetallada[]
  }

  // Resolver nombre del médico para mostrarlo en el PDF (si vino filtro).
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

  const logoPath = path.join(process.cwd(), "public", "logo_imss.png")
  const logoSrc = existsSync(logoPath)
    ? { data: readFileSync(logoPath), format: "png" as const }
    : null

  const elemento = createElement(ReporteMaterialesPDF, {
    vista,
    filas: json.filas,
    meta: {
      hospital: HOSPITAL,
      logoSrc,
      desde: desde.slice(0, 10),
      hasta: hasta.slice(0, 10),
      estado: sp.get("estado") ?? "todas",
      sistema: sp.get("sistema") ?? "todos",
      medicoNombre,
      generado: new Date(),
    },
  }) as unknown as ReactElement<DocumentProps>

  const buffer = await renderToBuffer(elemento)
  const filename = `reporte-materiales-${vista}-${desde.slice(0, 10)}-${hasta.slice(0, 10)}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  })
}
