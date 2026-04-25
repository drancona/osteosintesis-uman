-- ============================================================
-- Cuarto rol: 'proveedor'
-- Acceso de solo lectura a cirugías no suspendidas y al reporte
-- de materiales. NO programa cirugías ni administra usuarios.
--
-- Como el proveedor no es personal IMSS, su matrícula es opcional
-- (puede usarse como RFC o número interno, o quedar NULL).
-- El UNIQUE sobre matricula_imss se conserva: en Postgres múltiples
-- filas con NULL no violan UNIQUE, así que sigue funcionando para
-- médicos/enfermeras/admin que sí tienen matrícula real.
-- ============================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'proveedor';

ALTER TABLE public.profiles ALTER COLUMN matricula_imss DROP NOT NULL;
