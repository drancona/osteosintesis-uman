-- ============================================================
-- AUDITORÍA: programaciones con menos de 48h de antelación.
-- Registro silencioso e inmutable. Solo admin lo lee; cualquier
-- usuario activo puede insertar (lo hace la server action al
-- crear una cirugía con horasDeAntelacion < 48).
-- ============================================================

CREATE TABLE public.auditoria_programacion_48h (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cirugia_id UUID NOT NULL REFERENCES public.cirugias(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  fecha_programacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cirugia TIMESTAMPTZ NOT NULL,
  horas_de_antelacion NUMERIC(8,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_48h_cirugia ON public.auditoria_programacion_48h(cirugia_id);
CREATE INDEX idx_auditoria_48h_usuario ON public.auditoria_programacion_48h(usuario_id);

ALTER TABLE public.auditoria_programacion_48h ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admin lee auditoría 48h"
  ON public.auditoria_programacion_48h FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "Usuarios activos registran auditoría 48h"
  ON public.auditoria_programacion_48h FOR INSERT
  TO authenticated WITH CHECK (
    public.is_active_user() AND usuario_id = auth.uid()
  );

-- Sin policies de UPDATE / DELETE: el registro es inmutable.
