import { Document, Page, View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { MiniHeader } from "../components/MiniHeader"
import { Field } from "../components/Field"
import { Checkbox } from "../components/Checkbox"
import { formatearFecha, formatearHora, type DatosCirugia } from "../datos"

export function HojaQxPDF({ datos }: { datos: DatosCirugia }) {
  const ahora = new Date()
  const fechaCir = new Date(datos.cirugia.fecha_cirugia)
  const horasEstim = Math.round((datos.cirugia.duracion_minutos / 60) * 10) / 10

  return (
    <Document title={`Hoja Qx - ${datos.cirugia.id.slice(0, 8)}`}>
      <Page size="LETTER" style={styles.page}>
        <Header
          encabezadoInstitucional="INSTITUTO MEXICANO DEL SEGURO SOCIAL · DIRECCIÓN DE PRESTACIONES MÉDICAS"
          hospital={datos.hospital}
          titulo="SOLICITUD Y REGISTRO DE INTERVENCIÓN QUIRÚRGICA"
          logoPath={datos.logoPath}
        />

        <MiniHeader
          pacienteNombre={datos.paciente.nombre_completo}
          nss={datos.paciente.num_afiliacion_imss}
          procedimiento={datos.cirugia.procedimiento_propuesto}
        />

        {/* Encabezado de paciente y servicio */}
        <View style={styles.caja}>
          <View style={styles.row}>
            <Field label="Servicio" value={datos.hospital.servicio} flex={2} />
            <Field label="Cama" flex={1} />
            <Field label="Número de Seguridad Social" value={datos.paciente.num_afiliacion_imss} flex={2} />
          </View>
          <View style={styles.row}>
            <Field label="Nombre del paciente" value={datos.paciente.nombre_completo} flex={3} />
            <Field label="Edad" value={`${datos.paciente.edad} años`} flex={1} />
          </View>
          <View style={styles.row}>
            <Field label="Fecha solicitada" value={formatearFecha(ahora)} flex={1} />
            <Field label="Hora" value={formatearHora(ahora)} flex={1} />
            <Field label="Teléfono" value={datos.paciente.telefono ?? ""} flex={1} />
            <Field label="Dirección" value={datos.paciente.direccion ?? ""} flex={2} />
          </View>
        </View>

        {/* SOLICITUD */}
        <Text style={styles.banda}>SOLICITUD DE INTERVENCIÓN QUIRÚRGICA</Text>
        <View style={styles.caja}>
          <View style={[styles.row, { marginBottom: 6 }]}>
            <View style={{ flex: 2 }}>
              <Text style={styles.fieldLabel}>Prioridad</Text>
              <View style={[styles.row, { marginTop: 4 }]}>
                <Checkbox label="Baja" marcado={datos.cirugia.prioridad === "baja"} />
                <Checkbox label="Media" marcado={datos.cirugia.prioridad === "media"} />
                <Checkbox label="Alta" marcado={datos.cirugia.prioridad === "alta"} />
              </View>
            </View>
            <View style={{ flex: 3, paddingLeft: 8 }}>
              <Text style={styles.fieldLabel}>Médico cirujano (nombre, matrícula y firma)</Text>
              <Text style={styles.fieldValue}>
                {datos.medico.nombre_completo} · Mat. {datos.medico.matricula_imss}
              </Text>
              <View style={styles.fieldLinea} />
            </View>
          </View>

          <Field label="Diagnóstico preoperatorio" value={datos.cirugia.diagnostico} />
          <Field label="Operación planeada" value={datos.cirugia.procedimiento_propuesto} />

          <View style={[styles.row, { marginTop: 4 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Tipo</Text>
              <View style={[styles.row, { marginTop: 4 }]}>
                <Checkbox label="Electiva" marcado={datos.cirugia.tipo_operacion === "electiva"} />
                <Checkbox label="Urgencia" marcado={datos.cirugia.tipo_operacion === "urgencia"} />
              </View>
            </View>
            <Field label="Tiempo estimado de cirugía" value={`${horasEstim} h (${datos.cirugia.duracion_minutos} min)`} flex={1} />
          </View>

          <View style={[styles.row, { marginTop: 6 }]}>
            <Field label="Solicitud de sangre — Grupo" flex={1} />
            <Field label="Rh" flex={1} />
            <Field label="En quirófano (ml)" flex={1} />
            <Field label="En reserva (ml)" flex={1} />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Text style={styles.fieldLabel}>Anestesia proyectada</Text>
              <View style={[styles.row, { marginTop: 4 }]}>
                <Checkbox label="Local" />
                <Checkbox label="Regional" />
                <Checkbox label="General" />
              </View>
            </View>
            <Field label="Nombre y firma del Jefe de Servicio" flex={3} />
          </View>
        </View>

        {/* PROGRAMACION QX */}
        <Text style={styles.banda}>PROGRAMACIÓN DE QUIRÓFANO</Text>
        <View style={styles.caja}>
          <View style={styles.row}>
            <Field label="Día" value={formatearFecha(fechaCir)} flex={1} />
            <Field label="Hora" value={formatearHora(fechaCir)} flex={1} />
            <Field label="Sala" value={datos.cirugia.sala ?? ""} flex={1} />
            <Field
              label="Encargado de la unidad quirúrgica (nombre, matrícula y firma)"
              flex={3}
            />
          </View>
        </View>

        {/* REGISTRO DE INTERVENCION (POST-OP) — vacío visualmente presente */}
        <Text style={styles.banda}>REGISTRO DE INTERVENCIÓN QUIRÚRGICA (a llenar tras la cirugía)</Text>
        <View style={styles.caja}>
          <Field label="Hora de entrada del paciente a sala quirúrgica" />
          <Field label="Diagnóstico postoperatorio" />
          <Field label="Operación realizada" />
          <View style={styles.row}>
            <Field label="Ayudante 1" flex={1} />
            <Field label="Ayudante 2" flex={1} />
            <Field label="Ayudante 3" flex={1} />
          </View>
          <View style={styles.row}>
            <Field label="Examen histopatológico transoperatorio solicitado" flex={1} />
            <Field label="Otros estudios transoperatorios" flex={1} />
          </View>
          <View style={styles.row}>
            <Field label="Anestesia administrada" flex={1} />
            <Field label="Médico anestesiólogo (nombre, matrícula y firma)" flex={2} />
          </View>
          <View style={styles.row}>
            <Field label="Hora de inicio de anestesia" flex={1} />
            <Field label="Conteo del sangrado" flex={1} />
          </View>
          <View style={styles.row}>
            <Field label="Reporte de gasas, compresas, instrumental y canalizaciones" flex={2} />
            <View style={{ flex: 1, paddingHorizontal: 4, paddingTop: 4 }}>
              <Text style={styles.fieldLabel}>Conteo</Text>
              <View style={[styles.row, { marginTop: 4 }]}>
                <Checkbox label="Completa" />
                <Checkbox label="Incompleta" />
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <Field label="Enfermera especialista quirúrgica (nombre, matrícula y firma)" flex={1} />
            <Field label="Enfermera general circulante (nombre, matrícula y firma)" flex={1} />
          </View>
        </View>

        <Footer formato="Hoja Qx" cirugiaId={datos.cirugia.id} />
      </Page>
    </Document>
  )
}
