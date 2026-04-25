import { View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"

interface Props {
  titulo: string
  subtitulo?: string
  hospital: { nombre: string; ooad: string }
  /** Línea superior del bloque institucional. */
  encabezadoInstitucional?: string
}

export function Header({
  titulo,
  subtitulo,
  hospital,
  encabezadoInstitucional = "INSTITUTO MEXICANO DEL SEGURO SOCIAL",
}: Props) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerLeft}>
        <Text style={styles.imssBadge}>IMSS</Text>
      </View>
      <View style={styles.headerCenter}>
        <Text style={styles.headerInst}>{encabezadoInstitucional}</Text>
        {subtitulo ? (
          <Text style={styles.headerOoad}>{subtitulo}</Text>
        ) : null}
        <Text style={styles.headerOoad}>
          {hospital.ooad}     ·     {hospital.nombre}
        </Text>
        <Text style={styles.headerTitulo}>{titulo}</Text>
      </View>
    </View>
  )
}
