"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import esLocale from "@fullcalendar/core/locales/es"
import type {
  EventClickArg,
  EventDropArg,
  DatesSetArg,
} from "@fullcalendar/core"
import type { EventResizeDoneArg } from "@fullcalendar/interaction"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import type { CirugiaCalendarioRow } from "@/app/api/cirugias/route"
import { cambiarEstadoCirugiaAction } from "@/app/(app)/cirugias/[id]/actions"
import { ModalAdvertencia48h } from "@/components/forms/cirugia/ModalAdvertencia48h"
import { ModalDetalleCirugia } from "./ModalDetalleCirugia"
import "@/styles/calendario.css"

interface Props {
  isAdmin: boolean
  usuarioId: string
}

interface RangoFechas {
  desde: string
  hasta: string
}

async function fetchCirugias(rango: RangoFechas): Promise<CirugiaCalendarioRow[]> {
  const url = `/api/cirugias?desde=${encodeURIComponent(rango.desde)}&hasta=${encodeURIComponent(rango.hasta)}`
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status} al cargar cirugías`)
  }
  return (await res.json()) as CirugiaCalendarioRow[]
}

function addMinutes(iso: string, minutos: number): Date {
  return new Date(new Date(iso).getTime() + minutos * 60_000)
}

export function Calendario({ isAdmin, usuarioId }: Props) {
  const queryClient = useQueryClient()
  const calendarRef = useRef<FullCalendar | null>(null)
  const [rango, setRango] = useState<RangoFechas | null>(null)
  const [tituloRango, setTituloRango] = useState<string>("")

  const [detalle, setDetalle] = useState<CirugiaCalendarioRow | null>(null)
  const [advertencia, setAdvertencia] = useState<{
    open: boolean
    horas: number
    onConfirm: (() => void) | null
    onCancel: (() => void) | null
  }>({ open: false, horas: 0, onConfirm: null, onCancel: null })

  const { data: cirugias = [], refetch } = useQuery({
    queryKey: ["cirugias-calendario", rango?.desde, rango?.hasta],
    queryFn: () => fetchCirugias(rango!),
    enabled: !!rango,
    staleTime: 30 * 1000,
  })

  // Manejo de cambios de vista/rango: FullCalendar nos avisa via datesSet.
  function onDatesSet(info: DatesSetArg) {
    setRango({ desde: info.startStr, hasta: info.endStr })
    setTituloRango(info.view.title)
  }

  const eventos = useMemo(
    () =>
      cirugias.map((c) => {
        const puedeEditar =
          (c.medico.id === usuarioId || isAdmin) &&
          c.estado !== "realizada" &&
          c.estado !== "suspendida"
        return {
          id: c.id,
          title: c.procedimiento_propuesto,
          start: c.fecha_cirugia,
          end: addMinutes(c.fecha_cirugia, c.duracion_minutos).toISOString(),
          editable: puedeEditar,
          startEditable: puedeEditar,
          durationEditable: puedeEditar,
          classNames: [`event-${c.estado}`],
          extendedProps: c as unknown as Record<string, unknown>,
        }
      }),
    [cirugias, usuarioId, isAdmin]
  )

  async function aplicarReprogramacion(
    id: string,
    nuevaFechaIso: string,
    revert: () => void
  ) {
    const r = await cambiarEstadoCirugiaAction(id, "reprogramada", nuevaFechaIso)
    if (r.error && !r.ok) {
      toast.error(r.error)
      revert()
      return
    }
    if (r.error) toast.warning(r.error)
    toast.success("Cirugía reprogramada")
    queryClient.invalidateQueries({ queryKey: ["cirugias-calendario"] })
  }

  function onEventDrop(info: EventDropArg) {
    const start = info.event.start
    if (!start) {
      info.revert()
      return
    }
    const id = info.event.id
    const horas = (start.getTime() - Date.now()) / 3_600_000

    if (horas < 48) {
      setAdvertencia({
        open: true,
        horas,
        onConfirm: async () => {
          setAdvertencia((s) => ({ ...s, open: false }))
          await aplicarReprogramacion(id, start.toISOString(), () =>
            info.revert()
          )
        },
        onCancel: () => {
          setAdvertencia((s) => ({ ...s, open: false }))
          info.revert()
        },
      })
      return
    }

    void aplicarReprogramacion(id, start.toISOString(), () => info.revert())
  }

  function onEventResize(info: EventResizeDoneArg) {
    // El resize cambia duración, no fecha. Por simplicidad lo tratamos
    // igual que un drop para que el médico pueda extender una cirugía
    // sin salir del calendario; reusa la misma fecha de inicio.
    const start = info.event.start
    if (!start) {
      info.revert()
      return
    }
    const id = info.event.id
    const horas = (start.getTime() - Date.now()) / 3_600_000

    if (horas < 48) {
      setAdvertencia({
        open: true,
        horas,
        onConfirm: async () => {
          setAdvertencia((s) => ({ ...s, open: false }))
          await aplicarReprogramacion(id, start.toISOString(), () =>
            info.revert()
          )
        },
        onCancel: () => {
          setAdvertencia((s) => ({ ...s, open: false }))
          info.revert()
        },
      })
      return
    }

    void aplicarReprogramacion(id, start.toISOString(), () => info.revert())
  }

  function onEventClick(info: EventClickArg) {
    const ext = info.event.extendedProps as unknown as CirugiaCalendarioRow
    setDetalle(ext)
  }

  // Mantener la query fresca cuando se navega entre fechas.
  useEffect(() => {
    if (rango) refetch()
  }, [rango, refetch])

  return (
    <>
      {tituloRango && (
        <p className="mb-2 text-sm text-muted-foreground">{tituloRango}</p>
      )}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={esLocale}
        firstDay={1}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridDay,timeGridWeek,dayGridMonth",
        }}
        buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        nowIndicator
        editable
        eventDurationEditable
        height="calc(100vh - 240px)"
        events={eventos}
        datesSet={onDatesSet}
        eventDrop={onEventDrop}
        eventResize={onEventResize}
        eventClick={onEventClick}
        dayMaxEvents={3}
      />

      <ModalDetalleCirugia
        open={!!detalle}
        cirugia={detalle}
        onOpenChange={(v) => !v && setDetalle(null)}
      />

      <ModalAdvertencia48h
        open={advertencia.open}
        horasDeAntelacion={advertencia.horas}
        onCancelar={() => advertencia.onCancel?.()}
        onContinuar={() => advertencia.onConfirm?.()}
      />
    </>
  )
}
