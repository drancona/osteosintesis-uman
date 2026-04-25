import { View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"

export interface ColumnaTabla {
  key: string
  titulo: string
  /** Ancho relativo (flex) o absoluto en puntos. */
  flex?: number
  width?: number
  align?: "left" | "center" | "right"
}

interface Props {
  columnas: ColumnaTabla[]
  filas: Array<Record<string, string | number>>
  /** Render adicional al final si quedan menos de N filas (líneas en blanco). */
  filasMinimas?: number
}

function celdaStyle(col: ColumnaTabla, esUltima: boolean) {
  const base = { ...styles.tablaCell }
  if (esUltima) {
    base.borderRightWidth = 0
  }
  if (col.align) {
    Object.assign(base, { textAlign: col.align })
  }
  if (typeof col.flex === "number") Object.assign(base, { flex: col.flex })
  if (typeof col.width === "number") Object.assign(base, { width: col.width })
  return base
}

function headerCeldaStyle(col: ColumnaTabla, esUltima: boolean) {
  const base = { ...styles.tablaHeaderCell }
  if (esUltima) base.borderRightWidth = 0
  if (col.align) Object.assign(base, { textAlign: col.align })
  if (typeof col.flex === "number") Object.assign(base, { flex: col.flex })
  if (typeof col.width === "number") Object.assign(base, { width: col.width })
  return base
}

export function Tabla({ columnas, filas, filasMinimas = 0 }: Props) {
  const filasFinales = [...filas]
  while (filasFinales.length < filasMinimas) {
    filasFinales.push(
      Object.fromEntries(columnas.map((c) => [c.key, ""])) as Record<
        string,
        string
      >
    )
  }

  return (
    <View>
      <View style={styles.tablaHeader}>
        {columnas.map((c, i) => (
          <Text key={c.key} style={headerCeldaStyle(c, i === columnas.length - 1)}>
            {c.titulo}
          </Text>
        ))}
      </View>
      {filasFinales.map((fila, idx) => (
        <View key={idx} style={styles.tablaRow}>
          {columnas.map((c, i) => (
            <Text key={c.key} style={celdaStyle(c, i === columnas.length - 1)}>
              {String(fila[c.key] ?? "")}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}
