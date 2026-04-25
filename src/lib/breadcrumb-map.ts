// Etiquetas humanas para cada segmento de URL.
// La key vacía representa el segmento raíz "/".
export const breadcrumbLabels: Record<string, string> = {
  "": "Inicio",
  cirugias: "Cirugías",
  nueva: "Nueva",
  admin: "Administración",
  usuarios: "Usuarios",
  catalogo: "Catálogo",
  calendario: "Calendario",
  reportes: "Reportes",
  materiales: "Materiales",
}

// UUID v4-ish (acepta cualquier hex, no validamos versión).
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function esUuid(segmento: string): boolean {
  return UUID_REGEX.test(segmento)
}

export function etiquetaSegmento(segmento: string): string {
  if (esUuid(segmento)) return "Detalle"
  if (segmento in breadcrumbLabels) return breadcrumbLabels[segmento]
  // Fallback: capitaliza el segmento desconocido para que no aparezca crudo.
  return segmento.charAt(0).toUpperCase() + segmento.slice(1)
}
