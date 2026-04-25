import { Document, Page, View, Text } from "@react-pdf/renderer"

import { styles } from "../styles"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { MiniHeader } from "../components/MiniHeader"
import { Field } from "../components/Field"
import { Checkbox } from "../components/Checkbox"
import { formatearFechaLarga, type DatosCirugia } from "../datos"

// Texto fijo copiado tal cual del Excel oficial (hoja Consentimiento).
const TEXTO_FUNDAMENTO =
  "Con fundamento en el Reglamento de la Ley General de Salud en materia de prestación de servicios de atención médica, artículos 80, 81, 82, 83, y a la Norma Oficial Mexicana NOM-168-SSA1-1998 del expediente clínico, fracciones 10.1.1.1 a la 10.1.1.4."

const TEXTO_CONSENTIMIENTO =
  "Expreso mi libre voluntad para autorizar el procedimiento o intervención quirúrgica señalada en este documento después de haberme proporcionado la información completa sobre mi enfermedad y estado actual, la cual fue realizada en forma amplia, precisa y suficiente en un lenguaje claro y sencillo, informándome sobre los posibles riesgos, complicaciones y secuelas de igual forma los beneficios. El médico me informó la existencia de procedimientos alternativos, el derecho a cambiar mi decisión en cualquier momento y manifestarla antes del procedimiento o intervención. Con el propósito de que mi atención sea adecuada, me comprometo a proporcionar información completa y veraz, así como seguir las indicaciones médicas. Otorgo mi autorización al personal de salud para la atención de contingencias y urgencias derivadas del acto médico señalado, atendiendo al principio de libertad prescriptiva."

const TEXTO_RIESGOS_TITULO =
  "Riesgos más frecuentes inherentes a la intervención quirúrgica y a las condiciones actuales del paciente."

const TEXTO_RIESGOS =
  "Infección, sangrado, trombosis, lesión neurovascular, lesión nerviosa por isquemia, fístula, dehiscencia de la herida, anafilaxia, lesión renal por sangrado, fractura, rechazo a material de sutura, dolor postquirúrgico, pérdida de la extremidad pélvica, lesión vascular, sangrado, shock, sepsis, infarto, coma, muerte."

const TEXTO_BENEFICIOS = "Mejoría del dolor y la función."

export function ConsentimientoPDF({ datos }: { datos: DatosCirugia }) {
  const ahora = new Date()
  const lugarFecha = `${datos.hospital.lugar}, a ${formatearFechaLarga(ahora)}`

  return (
    <Document title={`Consentimiento - ${datos.cirugia.id.slice(0, 8)}`}>
      <Page size="LETTER" style={styles.page}>
        <Header
          encabezadoInstitucional="INSTITUTO MEXICANO DEL SEGURO SOCIAL · DIRECCIÓN DE PRESTACIONES MÉDICAS"
          hospital={datos.hospital}
          titulo="CARTA DE CONSENTIMIENTO BAJO INFORMACIÓN"
          logoPath={datos.logoPath}
        />

        <MiniHeader
          pacienteNombre={datos.paciente.nombre_completo}
          nss={datos.paciente.num_afiliacion_imss}
          procedimiento={datos.cirugia.procedimiento_propuesto}
        />

        {/* Datos del paciente */}
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
            <Field label="Lugar y fecha" value={lugarFecha} />
          </View>
        </View>

        {/* Fundamento legal */}
        <View style={[styles.caja, { marginTop: 6 }]}>
          <Text style={styles.textoFijo}>{TEXTO_FUNDAMENTO}</Text>
        </View>

        {/* Yo: ___ */}
        <View style={[styles.caja, { marginTop: 6 }]}>
          <Text style={styles.textoFijo}>
            <Text style={styles.bold}>Yo: </Text>
            {datos.paciente.nombre_completo}
          </Text>
        </View>

        {/* Texto del consentimiento */}
        <View style={[styles.caja, { marginTop: 6 }]}>
          <Text style={styles.textoFijo}>{TEXTO_CONSENTIMIENTO}</Text>
        </View>

        {/* Diagnóstico */}
        <View style={[styles.caja, { marginTop: 6 }]}>
          <Field label="Diagnóstico previo al procedimiento o intervención quirúrgica" value={datos.cirugia.diagnostico} />
        </View>

        {/* Procedimiento + tipo */}
        <View style={[styles.caja, { marginTop: 6 }]}>
          <View style={styles.row}>
            <View style={{ flex: 3 }}>
              <Field
                label="Procedimiento o intervención quirúrgica proyectada"
                value={datos.cirugia.procedimiento_propuesto}
              />
            </View>
            <View style={{ flex: 1, padding: 4 }}>
              <Text style={styles.fieldLabel}>Tipo</Text>
              <View style={[styles.row, { marginTop: 4 }]}>
                <Checkbox label="Electiva" marcado={datos.cirugia.tipo_operacion === "electiva"} />
                <Checkbox label="Urgencia" marcado={datos.cirugia.tipo_operacion === "urgencia"} />
              </View>
            </View>
          </View>
        </View>

        {/* Riesgos */}
        <View style={[styles.caja, { marginTop: 6 }]}>
          <Text style={[styles.textoFijo, styles.bold, { marginBottom: 3 }]}>
            {TEXTO_RIESGOS_TITULO}
          </Text>
          <Text style={styles.textoFijo}>{TEXTO_RIESGOS}</Text>
        </View>

        {/* Beneficios */}
        <View style={[styles.caja, { marginTop: 6 }]}>
          <Text style={[styles.textoFijo, styles.bold, { marginBottom: 3 }]}>
            Beneficios
          </Text>
          <Text style={styles.textoFijo}>{TEXTO_BENEFICIOS}</Text>
        </View>

        {/* Firmas */}
        <View style={[styles.row, { marginTop: 12, gap: 8 }]}>
          <View style={styles.firmaCaja}>
            <Text style={styles.firmaLabel}>
              Nombre y firma del paciente, familiar, tutor{"\n"}
              o persona legalmente responsable
            </Text>
          </View>
          <View style={styles.firmaCaja}>
            <Text style={styles.firmaLabel}>Nombre y firma del testigo</Text>
          </View>
        </View>
        <View style={[styles.row, { marginTop: 8, gap: 8 }]}>
          <View style={styles.firmaCaja}>
            <Text style={[styles.firmaLabel, { marginBottom: 2 }]}>
              Médico tratante
            </Text>
            <Text style={{ fontSize: 9, textAlign: "center" }}>
              {datos.medico.nombre_completo}
            </Text>
            <Text style={{ fontSize: 8, textAlign: "center", color: "#475569" }}>
              Mat. {datos.medico.matricula_imss}
            </Text>
          </View>
          <View style={styles.firmaCaja}>
            <Text style={styles.firmaLabel}>Nombre y firma del testigo</Text>
          </View>
        </View>

        <Footer formato="Consentimiento" cirugiaId={datos.cirugia.id} />
      </Page>
    </Document>
  )
}
