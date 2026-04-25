import "server-only"

import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase con service role. **Solo para server actions o
 * server components que ya verificaron que el caller es admin.**
 * Bypassa RLS — usar con cuidado.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
