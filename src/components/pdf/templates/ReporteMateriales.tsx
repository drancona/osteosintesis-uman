import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"

import { styles, COLORES } from "../styles"
import { Header } from "../components/Header"
import { Footer } from "../components/Footer"
import { Tabla } from "../components/Tabla"
import { formatearFecha, formatearHora } from "../datos"
import type {
  RowAgregada,
  RowDetallada,
  VistaReporte,
} from "@/app/api/reportes/materiales/route"

const c = StyleSheet.create({
  filtros: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
    fontSize: 8,
  },
  filtroLinea: { flexDirection: "row", gap: 6, marginBottom: 2 },
  filtroLabel: {
    fontFamily: "Helvetica-Bold",
    color: COLORES.textoSuave,
  },
  banda: {
    backgroundColor: COLORES.bgSuave,
    borderWidth: 1,
    borderColor: COLORES.borde,
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginTop: 6,
  },
  detalleCard: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 4,
    padding: 6,
    marginTop: 6,
  },
  detalleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detalleHeaderTit: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  detalleSub: {
    color: COLORES.textoSuave,
    fontSize: 8,
  },
})

export interface ReporteMetaProps {
  hospital: { nombre: string; ooad: string; lugar: string; servicio: string }
  logoSrc?: { data: Buffer; format: "png" } | null
  desde: string
  hasta: string
  estado: string
  sistema: string
  medicoNombre: string
  generado: Date
}

export function ReporteMaterialesPDF({
  vista,
  filas,
  meta,
}: {
  vista: VistaReporte
  filas: RowAgregada[] | RowDetallada[]
  meta: ReporteMetaProps
}) {
  const totalUnidades =
    vista === "agregada"
      ? (filas as RowAgregada[]).reduce((acc, r) => acc + r.cantidad_total, 0)
      : (filas as RowDetallada[]).reduce(
          (acc, r) => acc + r.materiales.reduce((s, m) => s + m.cantidad, 0),
          0
        )

  return (
    <Document title={`Reporte de materiales (${vista})`}>
      <Page size="LETTER" style={styles.page}>
        <Header
          encabezadoInstitucional="INSTITUTO MEXICANO DEL SEGURO SOCIAL · DIRECCIÓN DE PRESTACIONES MÉDICAS"
          hospital={meta.hospital}
          titulo="REPORTE DE MATERIALES DE OSTEOSÍNTESIS"
          logoSrc={meta.logoSrc}
        />

        <View style={c.filtros}>
          <View style={c.filtroLinea}>
            <Text style={c.filtroLabel}>Rango:</Text>
            <Text>
              {meta.desde} — {meta.hasta}
            </Text>
            <Text style={c.filtroLabel}>   Vista:</Text>
            <Text>{vista}</Text>
          </View>
          <View style={c.filtroLinea}>
            <Text style={c.filtroLabel}>Médico:</Text>
            <Text>{meta.medicoNombre}</Text>
            <Text style={c.filtroLabel}>   Estado:</Text>
            <Text>{meta.estado}</Text>
            <Text style={c.filtroLabel}>   Sistema:</Text>
            <Text>{meta.sistema}</Text>
          </View>
          <View style={c.filtroLinea}>
            <Text style={c.filtroLabel}>Generado:</Text>
            <Text>
              {formatearFecha(meta.generado)} {formatearHora(meta.generado)}
            </Text>
            <Text style={c.filtroLabel}>   Total unidades:</Text>
            <Text>{totalUnidades}</Text>
          </View>
        </View>

        {vista === "agregada" ? (
          <>
            <Text style={c.banda}>RESUMEN POR MATERIAL</Text>
            <Tabla
              columnas={[
                { key: "n", titulo: "#", width: 24, align: "center" },
                { key: "material", titulo: "Material", flex: 3 },
                { key: "sistema", titulo: "Sistema", flex: 2 },
                { key: "cantidad", titulo: "Cant.", width: 50, align: "right" },
                { key: "cirugias", titulo: "# Cir.", width: 50, align: "right" },
                { key: "proxima", titulo: "Próxima", width: 80 },
              ]}
              filas={(filas as RowAgregada[]).map((r, i) => ({
                n: i + 1,
                material: r.material,
                sistema: r.sistema,
                cantidad: r.cantidad_total,
                cirugias: r.num_cirugias,
                proxima: r.proxima_fecha
                  ? formatearFecha(r.proxima_fecha)
                  : "—",
              }))}
            />
          </>
        ) : (
          <>
            <Text style={c.banda}>DETALLE POR CIRUGÍA</Text>
            {(filas as RowDetallada[]).map((r) => (
              <View key={r.cirugia.id} style={c.detalleCard} wrap={false}>
                <View style={c.detalleHeader}>
                  <View>
                    <Text style={c.detalleHeaderTit}>
                      {r.cirugia.procedimiento_propuesto}
                    </Text>
                    <Text style={c.detalleSub}>
                      {formatearFecha(r.cirugia.fecha_cirugia)}{" "}
                      {formatearHora(r.cirugia.fecha_cirugia)} ·
                      Sala {r.cirugia.sala ?? "—"} · {r.cirugia.estado}
                    </Text>
                    <Text style={c.detalleSub}>
                      Paciente: {r.paciente.nombre_completo} · NSS{" "}
                      {r.paciente.num_afiliacion_imss} · {r.paciente.edad} años
                    </Text>
                    <Text style={c.detalleSub}>
                      Médico: {r.medico.nombre_completo}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: 4 }}>
                  <Tabla
                    columnas={[
                      { key: "n", titulo: "#", width: 24, align: "center" },
                      { key: "material", titulo: "Material", flex: 3 },
                      { key: "sistema", titulo: "Sistema", flex: 2 },
                      { key: "cantidad", titulo: "Cant.", width: 50, align: "right" },
                    ]}
                    filas={r.materiales.map((m, i) => ({
                      n: i + 1,
                      material: m.nombre,
                      sistema: m.sistema,
                      cantidad: m.cantidad,
                    }))}
                  />
                </View>
              </View>
            ))}
          </>
        )}

        <Footer formato="Reporte de materiales" cirugiaId={"reporte"} />
      </Page>
    </Document>
  )
}
