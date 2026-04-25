-- ============================================================
-- OSTEOSINTESIS UMAN - Schema inicial
-- HGSMF 46 UMÁN, OOAD Yucatán
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- para búsqueda fuzzy en catálogo

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'medico', 'enfermera');
CREATE TYPE tipo_incapacidad AS ENUM ('riesgo_trabajo', 'enfermedad_general');
CREATE TYPE prioridad_cirugia AS ENUM ('baja', 'media', 'alta');
CREATE TYPE tipo_operacion AS ENUM ('electiva', 'urgencia');
CREATE TYPE estado_cirugia AS ENUM ('programada', 'realizada', 'cancelada');
CREATE TYPE sistema_osteo AS ENUM (
  'Grandes Fragmentos',
  'Pequeños Fragmentos',
  'Fijación Externa',
  'Clavos K y Alambre',
  'Personalizado'
);

-- ============================================================
-- PROFILES (extiende auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  matricula_imss TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'medico',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_profiles_matricula ON public.profiles(matricula_imss);

-- ============================================================
-- CATÁLOGO DE MATERIAL
-- ============================================================
CREATE TABLE public.catalogo_material (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  sistema sistema_osteo NOT NULL,
  tipo TEXT NOT NULL,
  diametro_mm NUMERIC(4,2),
  orificios INTEGER,
  longitud_mm INTEGER,
  variante TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_catalogo_nombre_trgm ON public.catalogo_material USING gin (nombre gin_trgm_ops);
CREATE INDEX idx_catalogo_sistema ON public.catalogo_material(sistema);
CREATE INDEX idx_catalogo_activo ON public.catalogo_material(activo);

-- ============================================================
-- PACIENTES
-- ============================================================
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_afiliacion_imss TEXT NOT NULL,
  agregado TEXT,
  nombre_completo TEXT NOT NULL,
  edad INTEGER NOT NULL CHECK (edad >= 0 AND edad <= 130),
  telefono TEXT,
  direccion TEXT,
  incapacitado BOOLEAN NOT NULL DEFAULT false,
  tipo_incapacidad tipo_incapacidad,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(num_afiliacion_imss, agregado)
);
CREATE INDEX idx_pacientes_nss ON public.pacientes(num_afiliacion_imss);
CREATE INDEX idx_pacientes_nombre_trgm ON public.pacientes USING gin (nombre_completo gin_trgm_ops);

-- ============================================================
-- CIRUGÍAS
-- ============================================================
CREATE TABLE public.cirugias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE RESTRICT,
  medico_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,

  -- Programación
  fecha_cirugia TIMESTAMPTZ NOT NULL,
  duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos > 0),
  sala TEXT,

  -- Clasificación
  prioridad prioridad_cirugia NOT NULL DEFAULT 'media',
  tipo_operacion tipo_operacion NOT NULL DEFAULT 'electiva',

  -- Clínico
  diagnostico TEXT NOT NULL,
  procedimiento_propuesto TEXT NOT NULL,

  -- Estado y control
  estado estado_cirugia NOT NULL DEFAULT 'programada',
  programada_con_48h BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cirugias_fecha ON public.cirugias(fecha_cirugia);
CREATE INDEX idx_cirugias_medico ON public.cirugias(medico_id);
CREATE INDEX idx_cirugias_paciente ON public.cirugias(paciente_id);
CREATE INDEX idx_cirugias_estado ON public.cirugias(estado);

-- ============================================================
-- MATERIALES POR CIRUGÍA
-- ============================================================
CREATE TABLE public.cirugia_materiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cirugia_id UUID NOT NULL REFERENCES public.cirugias(id) ON DELETE CASCADE,

  -- Solo uno de estos dos tendrá valor
  material_id INTEGER REFERENCES public.catalogo_material(id) ON DELETE RESTRICT,
  nombre_personalizado TEXT,

  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  orden INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_material_xor CHECK (
    (material_id IS NOT NULL AND nombre_personalizado IS NULL) OR
    (material_id IS NULL AND nombre_personalizado IS NOT NULL)
  )
);
CREATE INDEX idx_cirugia_materiales_cirugia ON public.cirugia_materiales(cirugia_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_pacientes_updated_at BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cirugias_updated_at BEFORE UPDATE ON public.cirugias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger: al crear usuario en auth.users, crear profile automáticamente
-- Lee de raw_user_meta_data los campos matricula_imss y nombre_completo
-- que el cliente envía al hacer signUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, matricula_imss, nombre_completo, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'matricula_imss',
    NEW.raw_user_meta_data->>'nombre_completo',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'medico')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
