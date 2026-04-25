import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { UserRole } from "@/types/database"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PREFIJO_PRESENTE = /^(dr|dra|enf|lic|mtro|mtra)\.?\s/i

// Devuelve un prefijo corto para acompañar el nombre del usuario en saludos.
// Si el nombre ya viene con prefijo (ej. "Dra. Ana Pérez") devuelve "" para evitar
// duplicarlo. Para enfermera usa "Enf."; para médico/admin usa "Dr." por defecto.
export function getTituloUsuario(role: UserRole, nombreCompleto: string): string {
  if (PREFIJO_PRESENTE.test(nombreCompleto.trim())) return ""
  if (role === "enfermera") return "Enf."
  return "Dr."
}
