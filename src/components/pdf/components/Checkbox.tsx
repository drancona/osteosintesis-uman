import { View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"

interface Props {
  label: string
  marcado?: boolean
}

export function Checkbox({ label, marcado = false }: Props) {
  return (
    <View style={styles.checkboxLinea}>
      <View style={[styles.checkbox, marcado ? styles.checkboxMarcado : {}]} />
      <Text>{label}</Text>
    </View>
  )
}
