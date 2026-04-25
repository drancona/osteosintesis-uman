import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"

import { styles, COLORES } from "../styles"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { MiniHeader } from "../components/MiniHeader"
import { Tabla } from "../components/Tabla"
import { formatearFecha, formatearHora, type DatosCirugia } from "../datos"

// Estilos compactos para la cabecera de esta hoja: dejamos máxima
// superficie útil para la tabla de materiales.
const c = StyleSheet.create({
  caja: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fila: {
    flexDirection: "row",
  },
  campo: {
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  label: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: COLORES.textoSuave,
    textTransform: "uppercase",
  },
  valor: {
    fontSize: 8.5,
  },
  linea: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORES.borde,
    minHeight: 10,
  },
  banda: {
    backgroundColor: COLORES.bgSuave,
    borderWidth: 1,
    borderColor: COLORES.borde,
    paddingVertical: 2,
    paddingHorizontal: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    marginTop: 3,
  },
})

interface CampoProps {
  label: string
  value?: string | null
  flex?: number
}

function Campo({ label, value, flex }: CampoProps) {
  return (
    <View style={[c.campo, typeof flex === "number" ? { flex } : {}]}>
      <Text style={c.label}>{label}</Text>
      {value ? (
        <Text style={c.valor}>{value}</Text>
      ) : (
        <View style={c.linea} />
      )}
    </View>
  )
}

export function SolicitudMaterialPDF({ datos }: { datos: DatosCirugia }) {
  const ahora = new Date()
  const filasMateriales = datos.materiales.map((m, idx) => ({
    n: idx + 1,
    descripcion: m.nombre,
    cantidad: m.cantidad,
  }))

  return (
    <Document title={`Solicitud de Material - ${datos.cirugia.id.slice(0, 8)}`}>
      <Page size="LETTER" style={styles.page}>
        <Header
          encabezadoInstitucional="INSTITUTO MEXICANO DEL SEGURO SOCIAL · JEFATURA DE PRESTACIONES MÉDICAS"
          hospital={datos.hospital}
          titulo="SOLICITUD DE MATERIAL DE OSTEOSÍNTESIS Y ENDOPRÓTESIS"
          logoPath={datos.logoPath}
        />

        <MiniHeader
          pacienteNombre={datos.paciente.nombre_completo}
          nss={datos.paciente.num_afiliacion_imss}
          procedimiento={datos.cirugia.procedimiento_propuesto}
        />

        <View style={c.caja}>
          <View style={c.fila}>
            <Campo label="Unidad médica hospitalaria" value={datos.hospital.nombre} flex={3} />
            <Campo label="Vale No." flex={1} />
          </View>
          <View style={c.fila}>
            <Campo label="Servicio" value={datos.hospital.servicio} flex={2} />
            <Campo label="Fecha" value={formatearFecha(ahora)} flex={1} />
            <Campo label="Hora" value={formatearHora(ahora)} flex={1} />
          </View>
        </View>

        <Text style={c.banda}>DATOS DEL PACIENTE</Text>
        <View style={c.caja}>
          <View style={c.fila}>
            <Campo
              label="Apellido paterno, materno y nombre(s)"
              value={datos.paciente.nombre_completo}
              flex={2}
            />
            <Campo label="NSS" value={datos.paciente.num_afiliacion_imss} flex={1} />
            <Campo label="Agregado" value={datos.paciente.agregado ?? ""} flex={1} />
          </View>
          <View style={c.fila}>
            <Campo label="Diagnóstico" value={datos.cirugia.diagnostico} flex={3} />
            <Campo label="Cama" flex={1} />
            <Campo
              label="Fecha de cirugía"
              value={formatearFecha(datos.cirugia.fecha_cirugia)}
              flex={1}
            />
          </View>
        </View>

        <Text style={c.banda}>MÉDICO QUE SOLICITA</Text>
        <View style={c.caja}>
          <View style={c.fila}>
            <Campo
              label="Apellido paterno, materno y nombre(s)"
              value={datos.medico.nombre_completo}
              flex={2}
            />
            <Campo label="Matrícula" value={datos.medico.matricula_imss} flex={1} />
            <Campo label="Firma" flex={1} />
          </View>
        </View>

        <Text style={c.banda}>PERSONAL DE ALMACÉN QUE RECIBE</Text>
        <View style={c.caja}>
          <View style={c.fila}>
            <Campo label="Apellido paterno, materno y nombre(s)" flex={2} />
            <Campo label="Matrícula" flex={1} />
            <Campo label="Firma" flex={1} />
          </View>
        </View>

        <Text style={c.banda}>PERSONAL DE CEYE O SUBCEYE QUE RECIBE</Text>
        <View style={c.caja}>
          <View style={c.fila}>
            <Campo label="Apellido paterno, materno y nombre(s)" flex={2} />
            <Campo label="Matrícula" flex={1} />
            <Campo label="Firma" flex={1} />
          </View>
        </View>

        <Text style={[c.banda, { marginTop: 6 }]}>MATERIAL SOLICITADO</Text>
        <Tabla
          columnas={[
            { key: "n", titulo: "#", width: 24, align: "center" },
            { key: "descripcion", titulo: "Descripción", flex: 1 },
            { key: "cantidad", titulo: "Cant.", width: 44, align: "center" },
          ]}
          filas={filasMateriales}
        />

        <Footer formato="Solicitud de material" cirugiaId={datos.cirugia.id} />
      </Page>
    </Document>
  )
}
