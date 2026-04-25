-- ============================================================
-- OSTEOSINTESIS UMAN - Row Level Security
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cirugias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cirugia_materiales ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPERS
-- ============================================================

-- Helper: verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND activo = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper: verificar si el usuario está activo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND activo = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Usuarios autenticados ven todos los perfiles"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin actualiza cualquier perfil"
  ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- CATÁLOGO
-- ============================================================
CREATE POLICY "Todos los autenticados leen el catálogo"
  ON public.catalogo_material FOR SELECT
  TO authenticated USING (public.is_active_user());

CREATE POLICY "Solo admin gestiona el catálogo"
  ON public.catalogo_material FOR ALL
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- PACIENTES
-- ============================================================
CREATE POLICY "Usuarios activos leen pacientes"
  ON public.pacientes FOR SELECT
  TO authenticated USING (public.is_active_user());

CREATE POLICY "Médicos enfermeras y admin crean pacientes"
  ON public.pacientes FOR INSERT
  TO authenticated WITH CHECK (
    public.is_active_user() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('medico', 'enfermera', 'admin')
    )
  );

CREATE POLICY "Usuarios activos actualizan pacientes"
  ON public.pacientes FOR UPDATE
  TO authenticated USING (public.is_active_user());

-- ============================================================
-- CIRUGÍAS
-- ============================================================
CREATE POLICY "Usuarios activos leen cirugías"
  ON public.cirugias FOR SELECT
  TO authenticated USING (public.is_active_user());

CREATE POLICY "Médicos enfermeras y admin programan cirugías"
  ON public.cirugias FOR INSERT
  TO authenticated WITH CHECK (
    public.is_active_user() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('medico', 'enfermera', 'admin')
    )
  );

CREATE POLICY "Médico edita su propia cirugía o admin cualquiera"
  ON public.cirugias FOR UPDATE
  TO authenticated USING (
    medico_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "Admin elimina cirugías"
  ON public.cirugias FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================
-- MATERIALES POR CIRUGÍA
-- ============================================================
CREATE POLICY "Usuarios activos leen materiales"
  ON public.cirugia_materiales FOR SELECT
  TO authenticated USING (public.is_active_user());

CREATE POLICY "Usuarios activos crean materiales"
  ON public.cirugia_materiales FOR INSERT
  TO authenticated WITH CHECK (
    public.is_active_user() AND
    EXISTS (
      SELECT 1 FROM public.cirugias c
      WHERE c.id = cirugia_id
      AND (c.medico_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Usuarios actualizan materiales de cirugías propias o admin"
  ON public.cirugia_materiales FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.cirugias c
      WHERE c.id = cirugia_id
      AND (c.medico_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Usuarios eliminan materiales de cirugías propias o admin"
  ON public.cirugia_materiales FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.cirugias c
      WHERE c.id = cirugia_id
      AND (c.medico_id = auth.uid() OR public.is_admin())
    )
  );
