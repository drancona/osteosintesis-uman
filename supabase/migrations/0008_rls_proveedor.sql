-- ============================================================
-- RLS para el rol 'proveedor'.
--
-- Las policies SELECT existentes ya conceden lectura a cualquier
-- usuario activo (`is_active_user()`), lo que incluye al proveedor.
-- Para restringir lo que ve el proveedor (no debe leer cirugías
-- suspendidas ni sus materiales) usamos policies RESTRICTIVE:
-- se evalúan en AND con el resto, así no tenemos que tocar las
-- policies existentes.
-- ============================================================

-- Helper: ¿el caller es proveedor activo?
CREATE OR REPLACE FUNCTION public.is_proveedor()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'proveedor' AND activo = true
  );
$$;

-- Cirugías: el proveedor no ve las suspendidas.
CREATE POLICY "Proveedor no ve cirugías suspendidas"
  ON public.cirugias
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    NOT public.is_proveedor() OR estado <> 'suspendida'
  );

-- Materiales de cirugía: el proveedor no ve los de cirugías suspendidas.
CREATE POLICY "Proveedor no ve materiales de cirugías suspendidas"
  ON public.cirugia_materiales
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    NOT public.is_proveedor()
    OR EXISTS (
      SELECT 1 FROM public.cirugias c
      WHERE c.id = cirugia_id AND c.estado <> 'suspendida'
    )
  );

-- Defensa en profundidad: el proveedor jamás debe escribir.
-- Las policies INSERT/UPDATE/DELETE actuales en cirugias /
-- cirugia_materiales / pacientes ya exigen rol IN ('medico',
-- 'enfermera', 'admin'), por lo que el proveedor queda excluido
-- automáticamente. No agregamos policies de escritura para él.
