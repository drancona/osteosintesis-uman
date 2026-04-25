import { Document, Page, View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { MiniHeader } from "../components/MiniHeader"
import { Field } from "../components/Field"
import { formatearFecha, formatearHora, type DatosCirugia } from "../datos"

export function InternamientoPDF({ datos }: { datos: DatosCirugia }) {
  const fechaIng = new Date(datos.cirugia.fecha_cirugia)

  return (
    <Document title={`Internamiento - ${datos.cirugia.id.slice(0, 8)}`}>
      <Page size="LETTER" style={styles.page}>
        <Header
          encabezadoInstitucional="INSTITUTO MEXICANO DEL SEGURO SOCIAL · DIRECCIÓN DE PRESTACIONES MÉDICAS"
          hospital={datos.hospital}
          titulo="SOLICITUD DE INTERNAMIENTO"
          logoPath={datos.logoPath}
        />

        <MiniHeader
          pacienteNombre={datos.paciente.nombre_completo}
          nss={datos.paciente.num_afiliacion_imss}
          procedimiento={datos.cirugia.procedimiento_propuesto}
        />

        {/* Datos generales */}
        <View style={styles.caja}>
          <View style={styles.row}>
            <Field label="Unidad médica" value={datos.hospital.nombre} flex={2} />
            <Field label="Nombre del paciente" value={datos.paciente.nombre_completo} flex={3} />
          </View>
          <View style={styles.row}>
            <Field label="Servicio" value={datos.hospital.servicio} flex={2} />
            <Field label="Afiliación" value={datos.paciente.num_afiliacion_imss} flex={1} />
            <Field label="Agregado" value={datos.paciente.agregado ?? ""} flex={1} />
          </View>
          <View style={styles.row}>
            <Field label="Fecha y hora del internamiento" value={`${formatearFecha(fechaIng)}  ${formatearHora(fechaIng)}`} flex={2} />
            <Field label="Edad" value={`${datos.paciente.edad} años`} flex={1} />
          </View>
        </View>

        {/* Datos del familiar responsable - en blanco */}
        <Text style={styles.banda}>DATOS DEL FAMILIAR O PERSONA RESPONSABLE</Text>
        <View style={styles.caja}>
          <View style={styles.row}>
            <Field label="Apellido paterno" flex={1} />
            <Field label="Apellido materno" flex={1} />
            <Field label="Nombre(s)" flex={1} />
          </View>
          <View style={styles.row}>
            <Field label="Parentesco" flex={1} />
            <Field label="Teléfono" flex={1} />
            <Field label="Identificación" flex={1} />
          </View>
        </View>

        {/* Diagnóstico */}
        <Text style={styles.banda}>DIAGNÓSTICO DE INTERNAMIENTO</Text>
        <View style={[styles.caja, { minHeight: 60 }]}>
          <Text style={styles.fieldValue}>{datos.cirugia.diagnostico}</Text>
        </View>

        {/* Médico tratante */}
        <View style={[styles.caja, { marginTop: 8 }]}>
          <Text style={[styles.fieldLabel, { marginBottom: 2 }]}>
            Nombre, matrícula y firma del médico tratante
          </Text>
          <Text style={styles.fieldValue}>
            {datos.medico.nombre_completo} · Mat. {datos.medico.matricula_imss}
          </Text>
          <View style={[styles.fieldLinea, { marginTop: 18 }]} />
        </View>

        {/* Verificación de vigencia */}
        <View style={{ marginTop: 12 }}>
          <Text style={styles.fieldLabel}>Verificación de vigencia</Text>
          <View style={[styles.fieldLinea, { marginTop: 4 }]} />
        </View>

        <Footer formato="Internamiento" cirugiaId={datos.cirugia.id} />
      </Page>
    </Document>
  )
}
