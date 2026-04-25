import { View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"

interface Props {
  formato: string
  cirugiaId: string
}

export function Footer({ formato, cirugiaId }: Props) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        {formato} · cirugía {cirugiaId.slice(0, 8)}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  )
}
