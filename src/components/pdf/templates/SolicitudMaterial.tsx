import { Document, Page, View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Field } from "../components/Field"
import { Tabla } from "../components/Tabla"
import { formatearFecha, formatearHora, type DatosCirugia } from "../datos"

const FILAS_MIN = 22

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
        />

        {/* Cabecera con datos administrativos */}
        <View style={[styles.caja, { marginBottom: 4 }]}>
          <View style={styles.row}>
            <Field label="Unidad médica hospitalaria" value={datos.hospital.nombre} flex={3} />
            <Field label="Vale No." flex={1} />
          </View>
          <View style={styles.row}>
            <Field label="Servicio" value={datos.hospital.servicio} flex={2} />
            <Field label="Fecha" value={formatearFecha(ahora)} flex={1} />
            <Field label="Hora" value={formatearHora(ahora)} flex={1} />
          </View>
        </View>

        <Text style={styles.banda}>DATOS DEL PACIENTE</Text>
        <View style={styles.caja}>
          <View style={styles.row}>
            <Field label="Apellido paterno, materno y nombre(s)" value={datos.paciente.nombre_completo} flex={2} />
            <Field label="NSS" value={datos.paciente.num_afiliacion_imss} flex={1} />
            <Field label="Agregado" value={datos.paciente.agregado ?? ""} flex={1} />
          </View>
          <View style={styles.row}>
            <Field label="Diagnóstico" value={datos.cirugia.diagnostico} flex={3} />
            <Field label="Cama" flex={1} />
            <Field label="Fecha de cirugía" value={formatearFecha(datos.cirugia.fecha_cirugia)} flex={1} />
          </View>
        </View>

        <Text style={styles.banda}>MÉDICO QUE SOLICITA</Text>
        <View style={styles.caja}>
          <View style={styles.row}>
            <Field
              label="Apellido paterno, materno y nombre(s)"
              value={datos.medico.nombre_completo}
              flex={2}
            />
            <Field label="Matrícula" value={datos.medico.matricula_imss} flex={1} />
            <Field label="Firma" flex={1} />
          </View>
        </View>

        <Text style={styles.banda}>PERSONAL DE ALMACÉN QUE RECIBE</Text>
        <View style={styles.caja}>
          <View style={styles.row}>
            <Field label="Apellido paterno, materno y nombre(s)" flex={2} />
            <Field label="Matrícula" flex={1} />
            <Field label="Firma" flex={1} />
          </View>
        </View>

        <Text style={styles.banda}>PERSONAL DE CEYE O SUBCEYE QUE RECIBE</Text>
        <View style={styles.caja}>
          <View style={styles.row}>
            <Field label="Apellido paterno, materno y nombre(s)" flex={2} />
            <Field label="Matrícula" flex={1} />
            <Field label="Firma" flex={1} />
          </View>
        </View>

        <Text style={styles.banda}>MATERIAL SOLICITADO</Text>
        <Tabla
          columnas={[
            { key: "n", titulo: "#", width: 28, align: "center" },
            { key: "descripcion", titulo: "Descripción", flex: 1 },
            { key: "cantidad", titulo: "Cant.", width: 50, align: "center" },
          ]}
          filas={filasMateriales}
          filasMinimas={FILAS_MIN}
        />

        <Footer formato="Solicitud de material" cirugiaId={datos.cirugia.id} />
      </Page>
    </Document>
  )
}
