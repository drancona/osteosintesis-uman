import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from("catalogo_material")
      .select("*", { count: "exact", head: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      status: "ok",
      catalogo_size: count ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido"
    return NextResponse.json(
      { status: "error", error: mensaje },
      { status: 500 }
    )
  }
}
