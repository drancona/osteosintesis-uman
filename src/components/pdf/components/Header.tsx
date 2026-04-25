import { View, Text, Image } from "@react-pdf/renderer"

import { styles } from "../styles"

interface Props {
  titulo: string
  subtitulo?: string
  hospital: { nombre: string; ooad: string }
  /** Línea superior del bloque institucional. */
  encabezadoInstitucional?: string
  /** Logo IMSS preparado por el route handler como Buffer (PNG). */
  logoSrc?: { data: Buffer; format: "png" } | null
}

export function Header({
  titulo,
  subtitulo,
  hospital,
  encabezadoInstitucional = "INSTITUTO MEXICANO DEL SEGURO SOCIAL",
  logoSrc,
}: Props) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerLeft}>
        {logoSrc ? (
          <Image src={logoSrc} style={{ width: 44, height: 44 }} />
        ) : (
          <Text style={styles.imssBadge}>IMSS</Text>
        )}
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
