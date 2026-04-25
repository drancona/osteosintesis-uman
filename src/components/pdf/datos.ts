import type {
  Cirugia,
  Paciente,
  Profile,
  CatalogoMaterial,
  CirugiaMaterial,
} from "@/types/database"

export interface MaterialResuelto {
  cantidad: number
  orden: number
  /** Nombre legible: del catálogo o el nombre_personalizado. */
  nombre: string
  esPersonalizado: boolean
}

export interface DatosCirugia {
  cirugia: Cirugia
  paciente: Paciente
  medico: Profile
  materiales: MaterialResuelto[]
  hospital: {
    nombre: string
    ooad: string
    lugar: string
    servicio: string
  }
  /** Path absoluto al logo del IMSS (lo resuelve el route handler). */
  logoPath?: string | null
}

export function resolverMateriales(
  filas: CirugiaMaterial[],
  catalogo: CatalogoMaterial[]
): MaterialResuelto[] {
  const indice = new Map(catalogo.map((c) => [c.id, c]))
  return [...filas]
    .sort((a, b) => a.orden - b.orden)
    .map((m) => {
      if (m.material_id) {
        const it = indice.get(m.material_id)
        return {
          cantidad: m.cantidad,
          orden: m.orden,
          nombre: it?.nombre ?? `(material #${m.material_id} no encontrado)`,
          esPersonalizado: false,
        }
      }
      return {
        cantidad: m.cantidad,
        orden: m.orden,
        nombre: m.nombre_personalizado ?? "(sin nombre)",
        esPersonalizado: true,
      }
    })
}

const TZ_OPTS = { timeZone: "America/Merida" } as const

export function formatearFecha(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...TZ_OPTS,
  })
}

export function formatearHora(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso
  return d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...TZ_OPTS,
  })
}

export function formatearFechaLarga(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...TZ_OPTS,
  })
}
