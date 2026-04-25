"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { breadcrumbLabels, etiquetaSegmento } from "@/lib/breadcrumb-map"

interface Crumb {
  href: string
  label: string
  esActual: boolean
}

function construirCrumbs(pathname: string): Crumb[] {
  // Limpia trailing slash y query.
  const sinQuery = pathname.split("?")[0].split("#")[0]
  const segmentos = sinQuery.split("/").filter(Boolean)

  const crumbs: Crumb[] = [
    { href: "/", label: breadcrumbLabels[""], esActual: segmentos.length === 0 },
  ]

  let acumulado = ""
  segmentos.forEach((seg, idx) => {
    acumulado += `/${seg}`
    crumbs.push({
      href: acumulado,
      label: etiquetaSegmento(seg),
      esActual: idx === segmentos.length - 1,
    })
  })

  return crumbs
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const crumbs = construirCrumbs(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, idx) => (
          <Fragment key={`${c.href}-${idx}`}>
            <BreadcrumbItem>
              {c.esActual ? (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={c.href}>{c.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {idx < crumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
