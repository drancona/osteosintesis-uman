# Proyecto: osteosintesis-uman

> Single source of truth del proyecto. Este documento describe QUÉ se está construyendo, CÓMO está estructurado y QUÉ reglas debe seguir el desarrollo. Léelo completo antes de implementar cualquier fase.

---

## 1. Qué es

Sistema web para gestión de programación de cirugías y solicitud de material de osteosíntesis del Hospital General de Subzona con Medicina Familiar No. 46 (HGSMF 46) del IMSS, ubicado en Umán, Yucatán, OOAD Yucatán.

Es **herramienta interna de gestión administrativa**, NO es expediente clínico electrónico. No aplica NOM-024-SSA3, no requiere firmas electrónicas, no maneja datos sensibles para cumplimiento normativo. Es para que el equipo médico programe cirugías, solicite material y genere los formatos oficiales en PDF.

## 2. Stack tecnológico (fijo, no negociable)

- **Next.js 15+** con App Router + TypeScript (estricto)
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** (PostgreSQL + Auth) — proyecto ya creado
- **`@supabase/ssr`** para auth híbrida SSR
- **react-hook-form** + **zod** + **@hookform/resolvers**
- **TanStack Query** para data fetching
- **FullCalendar** para el calendario
- **`@react-pdf/renderer`** para generación de PDFs
- **date-fns** para manejo de fechas
- **lucide-react** para íconos
- **sonner** (vía shadcn) para toasts
- **Vercel** para deployment

NO usar: Prisma, Drizzle, otros ORMs. Usar el cliente de Supabase directamente.

## 3. Estado actual del proyecto

- ✅ Repo en GitHub vinculado (`drancona/osteosintesis-uman`) con git inicializado localmente
- ✅ Next.js 16 + TypeScript estricto + Tailwind v4 + App Router + `src/` inicializado
- ✅ Puerto de desarrollo configurado en **3100** (no 3000 — ese puerto está ocupado por otro proyecto)
- ✅ Stack instalado: `@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@tanstack/react-query`, FullCalendar, `@react-pdf/renderer`, `date-fns`, `lucide-react`, `clsx`, `tailwind-merge`
- ✅ shadcn/ui inicializado (tema slate, CSS variables) con componentes: button, input, label, form, dialog, select, textarea, card, table, popover, command, badge, separator, alert, sonner (`toast` quedó deprecado en favor de `sonner`)
- ✅ Estructura de carpetas creada según sección 7 (carpetas vacías con `.gitkeep`)
- ✅ Supabase clients (`client.ts`, `server.ts`, `middleware.ts`) y middleware raíz con redirects de auth
- ✅ Tipos de DB en `src/types/database.ts` y constantes en `src/lib/constants.ts`
- ✅ Endpoint `/api/health` que cuenta el catálogo
- ✅ Archivos SQL en `supabase/migrations/` (0001 schema, 0002 RLS, 0003 seed 510 SKUs)
- ✅ `.env.example` versionado y `.env.local` ignorado en `.gitignore`
- ⏳ Migraciones aplicadas en Supabase: pendiente vinculación del CLI por parte del product owner (`npx supabase login` + `npx supabase link --project-ref <REF>`)

## 4. Modelo de dominio

### Roles de usuario
- `admin`: gestiona usuarios y catálogo
- `medico`: programa cirugías (rol por defecto al registrarse)
- `enfermera`: programa cirugías

### Registro
Registro libre con matrícula IMSS. Cualquier persona puede crear cuenta proporcionando: matrícula IMSS (única), nombre completo, email, contraseña. Por defecto se asigna rol `medico`. Solo `admin` puede cambiar roles.

### Entidades principales
- **profiles**: extiende `auth.users` con matrícula IMSS, nombre, rol, estado activo
- **catalogo_material**: 510 SKUs precargados de osteosíntesis (4 sistemas: Grandes Fragmentos, Pequeños Fragmentos, Fijación Externa, Clavos K y Alambre)
- **pacientes**: nombre, edad, NSS, agregado, teléfono, dirección, incapacidad
- **cirugias**: paciente + médico + fecha/hora + sala + prioridad + tipo + diagnóstico + procedimiento + estado + flag `programada_con_48h`
- **cirugia_materiales**: del catálogo o personalizado (texto libre), con cantidad

## 5. Flujo principal del usuario médico/enfermera

1. **Login** con email + password
2. **Dashboard** simple: "Bienvenido, Dr. {nombre}" + botón principal "Programar cirugía" + acceso al calendario
3. Click en "Programar cirugía" → formulario `/cirugias/nueva`:

   **Sección 1 — Datos del paciente**
   - NSS (al perder foco busca en DB y autocompleta si existe)
   - Agregado
   - Nombre completo
   - Edad
   - ¿Incapacitado? Sí/No → si Sí → tipo (riesgo trabajo / enfermedad general)

   **Sección 2 — Datos de la cirugía**
   - Fecha y hora programada
   - Duración estimada (minutos)
   - Prioridad (baja / media / alta)
   - Tipo (electiva / urgencia)
   - Sala de quirófano
   - Diagnóstico preoperatorio
   - Procedimiento propuesto

   **Sección 3 — Material de osteosíntesis**
   - Lista dinámica con `useFieldArray`
   - Cada fila: combobox con autocomplete del catálogo + cantidad + botón eliminar
   - Botón "+ Agregar material"
   - Si el material no existe en catálogo: opción "+ Agregar como personalizado: '{texto}'" → se guarda como `nombre_personalizado` en `cirugia_materiales`, NO se agrega al catálogo

4. **Al submit**:
   - Validar con zod
   - Calcular `programada_con_48h = (fecha_cirugia - now()) >= 48h`
   - Si `< 48h` → modal de **advertencia** ("La cirugía se está programando con menos de 48 horas de antelación. El material de osteosíntesis requiere 48h para solicitarse. ¿Deseas continuar de todas formas?") con botones [Cancelar] [Continuar]. NO bloquea el guardado, solo informa.
   - Guardar paciente (si nuevo) + cirugía + materiales en una sola transacción

5. **Modal post-guardado** con 4 botones de impresión:
   - Hoja de cirugías (Solicitud y Registro de Intervención Quirúrgica) → `/api/pdf/hoja-qx/[id]`
   - Consentimiento Informado → `/api/pdf/consentimiento/[id]`
   - Solicitud de Material de Osteosíntesis → `/api/pdf/solicitud-material/[id]`
   - Solicitud de Internamiento → `/api/pdf/internamiento/[id]`

## 6. Reglas de los PDFs

Los PDFs se generan **on-demand** desde la data normalizada en Postgres. NO se almacenan archivos PDF — al hacer clic en "imprimir", se reconstruye el PDF a partir de los datos de la cirugía.

Cada PDF se genera vía route handler: `/api/pdf/[tipo]/[cirugia_id]` donde `tipo` ∈ {`solicitud-material`, `hoja-qx`, `consentimiento`, `internamiento`}. Usar `renderToBuffer` de `@react-pdf/renderer` y devolver `Content-Type: application/pdf`.

Encabezado común en los 4 PDFs: HGSMF 46 UMÁN, OOAD YUCATÁN. El consentimiento debe decir **"Umán, Yucatán"** como lugar (NO "Obregón, Sonora" como aparece en el formato Excel original).

### Qué se llena automáticamente vs queda en blanco

**Solicitud de Material:**
- Llenar: Unidad, servicio, fecha actual, hora actual, paciente (nombre, NSS, agregado), diagnóstico, fecha cirugía, médico (nombre + matrícula), lista numerada de materiales con cantidades
- Blanco: Vale No., Cama, todas las firmas, almacén, CEYE

**Hoja Qx:**
- Llenar (sección de solicitud): paciente, servicio, fecha, hora, edad, prioridad, diagnóstico preop, operación planeada (procedimiento), tipo (electiva/urgencia), tiempo estimado, programación de quirófano (día, hora, sala), médico (nombre + matrícula)
- Blanco: cama, teléfono, dirección, sangre, anestesia proyectada, TODA la sección post-operatoria (registro de intervención, ayudantes, anestesia administrada, hora entrada, conteo gasas, etc.)

**Consentimiento Informado:**
- Llenar: paciente (nombre, NSS, edad), servicio, diagnóstico, procedimiento, tipo (electiva/urgencia), lugar y fecha (Umán, Yucatán + fecha actual), nombre paciente en "Yo: ___", médico tratante (nombre completo), texto fijo de riesgos y beneficios
- Blanco: cama, firma paciente, firmas testigos, firma médico

**Solicitud de Internamiento:**
- Llenar: unidad, servicio, paciente (nombre, afiliación, agregado, edad), fecha y hora del internamiento (now()), diagnóstico, médico (nombre + matrícula)
- Blanco: datos del familiar responsable, firma médico, verificación de vigencia

Los formatos oficiales en Excel están en `docs/formatos/formato_multiple.xlsx` (subido por el product owner). Replicar layout fielmente.

## 7. Estructura de carpetas obligatoria

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    (dashboard)
│   │   ├── cirugias/
│   │   │   ├── nueva/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── calendario/page.tsx
│   │   └── admin/
│   │       ├── usuarios/page.tsx
│   │       └── catalogo/page.tsx
│   └── api/
│       ├── health/route.ts
│       └── pdf/
│           └── [tipo]/[id]/route.ts
├── components/
│   ├── ui/                             (shadcn)
│   ├── forms/
│   └── pdf/
│       ├── templates/
│       │   ├── SolicitudMaterial.tsx
│       │   ├── HojaQx.tsx
│       │   ├── Consentimiento.tsx
│       │   └── Internamiento.tsx
│       └── components/                 (Header, Footer, etc.)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── schemas/                        (zod)
│   ├── constants.ts
│   └── utils.ts
├── hooks/
├── types/
│   └── database.ts
└── middleware.ts

supabase/
└── migrations/
    ├── 0001_initial_schema.sql
    ├── 0002_rls_policies.sql
    └── 0003_seed_catalogo.sql
```

## 8. Variables de entorno requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
HOSPITAL_NOMBRE="HGSMF 46 UMÁN"
HOSPITAL_OOAD="OOAD YUCATÁN"
HOSPITAL_LUGAR="Umán, Yucatán"
```

Crear `.env.example` (sin valores) y agregarlo a git. `.env.local` debe estar en `.gitignore`.

## 9. Convenciones de código

- TypeScript estricto, sin `any` (usar `unknown` y narrowing si es necesario)
- Componentes server por defecto, `'use client'` solo cuando se necesite interactividad o hooks de cliente
- Validación con zod en cliente Y servidor (mismo schema importado de `lib/schemas/`)
- Errores de Supabase nunca se silencian, siempre se manejan
- Toasts de éxito/error con sonner
- Idioma de UI: español
- Idioma de código (variables, comentarios, commits): español, para coherencia con el dominio
- Comentarios solo donde el código no sea obvio
- Nombres descriptivos en variables (no `data`, `result`, `temp`)
- Commits pequeños y descriptivos en español

## 10. Política de preguntas

Si encuentras ambigüedad en el spec o detectas algo que requiere decisión de producto, pregunta ANTES de implementar. Es preferible un mensaje de aclaración que código que toque rehacer. No inventes funcionalidad fuera del scope.

## 11. Política de migraciones de DB

Las migraciones SQL viven en `supabase/migrations/` versionadas en git.

**Vinculación inicial (la hace el product owner una sola vez):**
```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
```

**Aplicar migraciones (lo hace el desarrollador con permiso del product owner):**
```bash
npx supabase db push
```

NUNCA editar migraciones ya aplicadas. Cualquier cambio de schema posterior se hace con una migración nueva (`0004_...`, `0005_...`, etc.).

NO ejecutar SQL directamente en el dashboard de Supabase si hay forma de hacerlo vía migración versionada.
