import { NextResponse } from "next/server"

import { getCatalogoCompleto } from "@/lib/queries/catalogo"

export async function GET() {
  try {
    const catalogo = await getCatalogoCompleto()
    return NextResponse.json(catalogo, {
      headers: {
        "Cache-Control": "public, max-age=300, must-revalidate",
      },
    })
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json({ error: mensaje }, { status: 500 })
  }
}
