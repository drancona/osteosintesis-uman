import { StyleSheet } from "@react-pdf/renderer"

export const COLORES = {
  texto: "#0f172a",
  textoSuave: "#475569",
  borde: "#0f172a",
  bordeSuave: "#94a3b8",
  bg: "#ffffff",
  bgSuave: "#f1f5f9",
} as const

export const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLORES.texto,
    lineHeight: 1.25,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  italic: {
    fontFamily: "Helvetica-Oblique",
  },
  // Encabezado institucional
  headerWrap: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 8,
  },
  headerLeft: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: COLORES.borde,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  headerCenter: {
    flexGrow: 1,
    padding: 6,
  },
  headerInst: {
    textAlign: "center",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  headerOoad: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 2,
  },
  headerTitulo: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  imssBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  // Layout helpers
  row: { flexDirection: "row" },
  rowSep: { flexDirection: "row", marginTop: 4 },
  col: { flexDirection: "column" },
  // Sección con título de banda
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
  // Caja con borde
  caja: {
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 6,
  },
  cajaSuave: {
    borderWidth: 1,
    borderColor: COLORES.bordeSuave,
    padding: 6,
  },
  // Field (label arriba + value/línea abajo)
  fieldLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: COLORES.textoSuave,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 10,
    minHeight: 12,
    paddingTop: 2,
  },
  fieldLinea: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLORES.borde,
    minHeight: 14,
  },
  // Texto fijo legal
  textoFijo: {
    fontSize: 8.5,
    textAlign: "justify",
    lineHeight: 1.3,
  },
  // Tabla
  tablaHeader: {
    flexDirection: "row",
    backgroundColor: COLORES.bgSuave,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORES.borde,
  },
  tablaHeaderCell: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: COLORES.borde,
  },
  tablaRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORES.borde,
  },
  tablaCell: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: COLORES.borde,
    minHeight: 16,
  },
  // Footer
  footer: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORES.textoSuave,
  },
  // Firmas
  firmaCaja: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 4,
    justifyContent: "flex-end",
  },
  firmaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: COLORES.textoSuave,
    textTransform: "uppercase",
  },
  // Checkbox visual
  checkboxLinea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 12,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  checkboxMarcado: {
    backgroundColor: COLORES.borde,
  },
})
