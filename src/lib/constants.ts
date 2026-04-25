export const HOSPITAL = {
  nombre: process.env.HOSPITAL_NOMBRE ?? "HGSMF 46 UMÁN",
  ooad: process.env.HOSPITAL_OOAD ?? "OOAD YUCATÁN",
  lugar: process.env.HOSPITAL_LUGAR ?? "Umán, Yucatán",
  servicio: "Traumatología y Ortopedia",
} as const
