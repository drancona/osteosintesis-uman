import { createElement, type ReactElement } from "react"
import path from "node:path"
import { existsSync } from "node:fs"
import { NextResponse } from "next/server"
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer"

import { createClient } from "@/lib/supabase/server"
import { getCirugiaCompleta } from "@/lib/pdf/getCirugiaCompleta"
import type { DatosCirugia } from "@/components/pdf/datos"
import { SolicitudMaterialPDF } from "@/components/pdf/templates/SolicitudMaterial"
import { HojaQxPDF } from "@/components/pdf/templates/HojaQx"
import { ConsentimientoPDF } from "@/components/pdf/templates/Consentimiento"
import { InternamientoPDF } from "@/components/pdf/templates/Internamiento"

const TIPOS = {
  "solicitud-material": SolicitudMaterialPDF,
  "hoja-qx": HojaQxPDF,
  "consentimiento": ConsentimientoPDF,
  "internamiento": InternamientoPDF,
} as const

type TipoPDF = keyof typeof TIPOS

function esTipoValido(t: string): t is TipoPDF {
  return Object.prototype.hasOwnProperty.call(TIPOS, t)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tipo: string; id: string }> }
) {
  const { tipo, id } = await params

  if (!esTipoValido(tipo)) {
    return NextResponse.json(
      { error: `Tipo de PDF inválido. Esperado uno de: ${Object.keys(TIPOS).join(", ")}` },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let datos: DatosCirugia | null
  try {
    datos = await getCirugiaCompleta(id)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al consultar la cirugía"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
  if (!datos) {
    return NextResponse.json({ error: "Cirugía no encontrada" }, { status: 404 })
  }

  const logoPath = path.join(process.cwd(), "public", "logo_imss.png")
  const datosConLogo = {
    ...datos,
    logoPath: existsSync(logoPath) ? logoPath : null,
  }

  const Template = TIPOS[tipo]
  // El componente envuelve un <Document>, pero TS sólo ve el wrapper. Cast seguro.
  const elemento = createElement(Template, { datos: datosConLogo }) as unknown as ReactElement<DocumentProps>
  const buffer = await renderToBuffer(elemento)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${tipo}-${id}.pdf"`,
      "Cache-Control": "private, no-cache",
    },
  })
}
