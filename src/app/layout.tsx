import type { Metadata } from "next"

import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { Providers } from "./providers"
import { HOSPITAL } from "@/lib/constants"
import "./globals.css"

export const metadata: Metadata = {
  title: `Osteosíntesis · ${HOSPITAL.nombre}`,
  description: `Sistema de programación de cirugías y solicitud de material de osteosíntesis — ${HOSPITAL.nombre}, ${HOSPITAL.ooad}.`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
