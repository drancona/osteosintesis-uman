-- ============================================================
-- Estados de cirugía: renombrar y agregar 'reprogramada'.
--
-- Antes: programada | realizada | cancelada
-- Después: pendiente | realizada | suspendida | reprogramada
--
-- Las renombraciones de valores de enum en Postgres NO requieren
-- reescribir filas; solo cambian el label visible. Las cirugías
-- existentes con estado 'programada' pasarán a leerse como
-- 'pendiente' automáticamente.
-- ============================================================

ALTER TYPE estado_cirugia RENAME VALUE 'programada' TO 'pendiente';
ALTER TYPE estado_cirugia RENAME VALUE 'cancelada' TO 'suspendida';
ALTER TYPE estado_cirugia ADD VALUE IF NOT EXISTS 'reprogramada';

-- Default acorde al nuevo naming
ALTER TABLE public.cirugias ALTER COLUMN estado SET DEFAULT 'pendiente';
