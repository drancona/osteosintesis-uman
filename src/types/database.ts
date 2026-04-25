// Tipos de la base de datos Postgres / Supabase.
// Espejan el schema de supabase/migrations/0001_initial_schema.sql.

export type UserRole = "admin" | "medico" | "enfermera"

export type TipoIncapacidad = "riesgo_trabajo" | "enfermedad_general"

export type PrioridadCirugia = "baja" | "media" | "alta"

export type TipoOperacion = "electiva" | "urgencia"

export type EstadoCirugia =
  | "pendiente"
  | "realizada"
  | "suspendida"
  | "reprogramada"

export type SistemaOsteo =
  | "Grandes Fragmentos"
  | "Pequeños Fragmentos"
  | "Fijación Externa"
  | "Clavos K y Alambre"
  | "Personalizado"

export interface Profile {
  id: string
  matricula_imss: string
  nombre_completo: string
  role: UserRole
  activo: boolean
  created_at: string
  updated_at: string
}

export interface CatalogoMaterial {
  id: number
  nombre: string
  sistema: SistemaOsteo
  tipo: string
  diametro_mm: number | null
  orificios: number | null
  longitud_mm: number | null
  variante: string | null
  activo: boolean
  created_at: string
}

export interface Paciente {
  id: string
  num_afiliacion_imss: string
  agregado: string | null
  nombre_completo: string
  edad: number
  telefono: string | null
  direccion: string | null
  incapacitado: boolean
  tipo_incapacidad: TipoIncapacidad | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Cirugia {
  id: string
  paciente_id: string
  medico_id: string
  fecha_cirugia: string
  duracion_minutos: number
  sala: string | null
  prioridad: PrioridadCirugia
  tipo_operacion: TipoOperacion
  diagnostico: string
  procedimiento_propuesto: string
  estado: EstadoCirugia
  programada_con_48h: boolean
  created_at: string
  updated_at: string
}

export interface CirugiaMaterial {
  id: string
  cirugia_id: string
  material_id: number | null
  nombre_personalizado: string | null
  cantidad: number
  orden: number
  created_at: string
}

export interface AuditoriaProgramacion48h {
  id: string
  cirugia_id: string
  usuario_id: string
  fecha_programacion: string
  fecha_cirugia: string
  horas_de_antelacion: number
  created_at: string
}
