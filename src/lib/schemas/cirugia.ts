import { z } from "zod"

// Helper: campos opcionales de texto que aceptan "" o null y se normalizan a null.
const textoOpcional = z
  .union([z.string(), z.null()])
  .transform((v) => {
    if (v === null) return null
    const t = v.trim()
    return t === "" ? null : t
  })

export const pacienteSchema = z
  .object({
    num_afiliacion_imss: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "El NSS debe tener exactamente 10 dígitos numéricos"),
    agregado: textoOpcional,
    nombre_completo: z.string().trim().min(3, "Mínimo 3 caracteres"),
    edad: z
      .number({ message: "Edad requerida" })
      .int("Debe ser un entero")
      .min(0, "Edad mínima 0")
      .max(130, "Edad máxima 130"),
    telefono: textoOpcional,
    direccion: textoOpcional,
    incapacitado: z.boolean(),
    tipo_incapacidad: z
      .enum(["riesgo_trabajo", "enfermedad_general"])
      .nullable(),
  })
  .refine(
    (data) =>
      !data.incapacitado ||
      data.tipo_incapacidad === "riesgo_trabajo" ||
      data.tipo_incapacidad === "enfermedad_general",
    {
      message: "Selecciona el tipo de incapacidad",
      path: ["tipo_incapacidad"],
    }
  )

export const materialItemSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("catalogo"),
    material_id: z.number().int().positive("Selecciona un material"),
    cantidad: z.number().int().positive("Cantidad mínima 1"),
  }),
  z.object({
    tipo: z.literal("personalizado"),
    nombre_personalizado: z
      .string()
      .trim()
      .min(3, "Mínimo 3 caracteres"),
    cantidad: z.number().int().positive("Cantidad mínima 1"),
  }),
])

export const cirugiaSchema = z.object({
  paciente: pacienteSchema,
  fecha_cirugia: z
    .string()
    .min(1, "Fecha y hora requeridas")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha inválida"),
  duracion_minutos: z
    .number({ message: "Duración requerida" })
    .int()
    .positive("Debe ser mayor a cero"),
  sala: textoOpcional,
  prioridad: z.enum(["baja", "media", "alta"]),
  tipo_operacion: z.enum(["electiva", "urgencia"]),
  diagnostico: z.string().trim().min(3, "Mínimo 3 caracteres"),
  procedimiento_propuesto: z.string().trim().min(3, "Mínimo 3 caracteres"),
  materiales: z
    .array(materialItemSchema)
    .min(1, "Agrega al menos un material"),
})

export type PacienteInput = z.infer<typeof pacienteSchema>
export type MaterialItemInput = z.infer<typeof materialItemSchema>
export type CirugiaInput = z.infer<typeof cirugiaSchema>

export const DURACIONES_SUGERIDAS = [30, 60, 90, 120, 180, 240, 300] as const
