import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

export const registerSchema = z
  .object({
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    nombre_completo: z.string().trim().min(3, "Mínimo 3 caracteres"),
    matricula_imss: z
      .string()
      .trim()
      .min(4, "Mínimo 4 caracteres")
      .max(20, "Máximo 20 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
