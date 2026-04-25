import { View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"

interface Props {
  label: string
  value?: string | null
  flex?: number
  width?: number
  /** Si es true, no dibuja la línea inferior cuando no hay valor. */
  sinLinea?: boolean
}

/**
 * Campo con etiqueta arriba y valor (o línea para llenar a mano) abajo.
 * - Si recibe `value`, lo imprime en negrita.
 * - Si no, dibuja una línea horizontal para que se llene a mano.
 */
export function Field({ label, value, flex, width, sinLinea = false }: Props) {
  const wrap: { flex?: number; width?: number; padding: number } = {
    padding: 4,
  }
  if (typeof flex === "number") wrap.flex = flex
  if (typeof width === "number") wrap.width = width

  return (
    <View style={wrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value !== undefined && value !== null && value !== "" ? (
        <Text style={styles.fieldValue}>{value}</Text>
      ) : sinLinea ? (
        <View style={{ minHeight: 14 }} />
      ) : (
        <View style={styles.fieldLinea} />
      )}
    </View>
  )
}
