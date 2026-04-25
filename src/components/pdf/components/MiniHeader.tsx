import { View, Text } from "@react-pdf/renderer"

import { COLORES } from "../styles"

interface Props {
  pacienteNombre: string
  nss: string
  procedimiento: string
}

/**
 * Encabezado compacto fijo que aparece en TODAS las páginas excepto la primera.
 * Usamos `<Text fixed render>` para que la prop pageNumber decida si
 * imprime contenido o cadena vacía (página 1).
 */
export function MiniHeader({ pacienteNombre, nss, procedimiento }: Props) {
  const linea = `Continuación · ${pacienteNombre} · NSS ${nss} · ${procedimiento}`
  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 12,
        left: 32,
        right: 32,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORES.bordeSuave,
        paddingBottom: 4,
      }}
    >
      <Text
        style={{ fontSize: 8, color: COLORES.textoSuave }}
        render={({ pageNumber }) => (pageNumber > 1 ? linea : "")}
      />
    </View>
  )
}
