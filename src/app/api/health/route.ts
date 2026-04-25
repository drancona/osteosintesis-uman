import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // El health check usa el service role para bypassar RLS y poder contar
    // sin sesión de usuario.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

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
