"use client"

import { useQuery } from "@tanstack/react-query"

import type { CatalogoMaterial } from "@/types/database"

async function fetchCatalogo(): Promise<CatalogoMaterial[]> {
  const res = await fetch("/api/catalogo", { cache: "force-cache" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status} al cargar el catálogo`)
  }
  return (await res.json()) as CatalogoMaterial[]
}

export function useCatalogo() {
  const query = useQuery({
    queryKey: ["catalogo"],
    queryFn: fetchCatalogo,
    staleTime: Infinity,
    gcTime: Infinity,
  })
  return {
    catalogo: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
  }
}
