import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { UserRole } from "@/types/database"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PREFIJO_PRESENTE = /^(dr|dra|enf|lic|mtro|mtra)\.?\s/i

// Devuelve un prefijo corto para acompañar el nombre del usuario en saludos.
// Reglas por rol:
//   - medico    → "Dr." (a menos que el nombre ya traiga prefijo Dr/Dra/etc.)
//   - enfermera → "Enf." (idem: si el nombre ya empieza con Enf., no lo duplica)
//   - admin     → "" (sin prefijo)
//   - proveedor → "" (no es personal médico)
export function getTituloUsuario(role: UserRole, nombreCompleto: string): string {
  if (role === "admin" || role === "proveedor") return ""
  if (PREFIJO_PRESENTE.test(nombreCompleto.trim())) return ""
  if (role === "enfermera") return "Enf."
  return "Dr."
}
