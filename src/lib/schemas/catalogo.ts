import { z } from "zod"

const SISTEMAS = [
  "Grandes Fragmentos",
  "Pequeños Fragmentos",
  "Fijación Externa",
  "Clavos K y Alambre",
  "Personalizado",
] as const

const numeroOpcional = z
  .union([
    z.number(),
    z.literal("").transform(() => null),
    z.null(),
  ])
  .nullable()

export const materialSchema = z.object({
  nombre: z.string().trim().min(2, "Mínimo 2 caracteres"),
  sistema: z.enum(SISTEMAS),
  tipo: z.string().trim().min(2, "Mínimo 2 caracteres"),
  diametro_mm: z
    .number()
    .nonnegative("Debe ser ≥ 0")
    .max(999, "Demasiado grande")
    .nullable(),
  orificios: z
    .number()
    .int("Debe ser entero")
    .nonnegative("Debe ser ≥ 0")
    .max(9999, "Demasiado grande")
    .nullable(),
  longitud_mm: z
    .number()
    .int("Debe ser entero")
    .nonnegative("Debe ser ≥ 0")
    .max(99999, "Demasiado grande")
    .nullable(),
  variante: z
    .union([z.string(), z.null()])
    .transform((v) => {
      if (v === null) return null
      const t = v.trim()
      return t === "" ? null : t
    }),
  activo: z.boolean(),
})

export type MaterialInput = z.infer<typeof materialSchema>
export const SISTEMAS_VALIDOS = SISTEMAS

// Suprime la advertencia de variable no usada cuando solo se exporta el tipo.
void numeroOpcional
