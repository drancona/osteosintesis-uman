# Prompt Inicial para Claude Code — osteosintesis-uman

> Copia este prompt íntegro como tu primer mensaje a Claude Code en el repo del proyecto.

---

Soy el product owner del proyecto **osteosintesis-uman**. Tú eres el desarrollador principal.

Antes de tocar una sola línea de código, lee con atención el documento `docs/CONTEXT.md` que está en este repo. Ahí está toda la información del proyecto: qué se está construyendo, el stack tecnológico, el modelo de dominio, el flujo de usuario, las reglas de los PDFs, la estructura de carpetas, las convenciones de código y la política de migraciones.

También revisa:
- `docs/formatos/formato_multiple.xlsx` — los 4 formatos oficiales del IMSS que tendrás que replicar como PDFs en fases posteriores. **No los conviertas todavía**, solo úbicalos.
- `supabase/migrations/0001_initial_schema.sql` — schema inicial de la base de datos (ya está escrito, NO lo modifiques).
- `supabase/migrations/0002_rls_policies.sql` — Row Level Security policies (ya están escritas, NO las modifiques).
- `supabase/migrations/0003_seed_catalogo.sql` — seed de las 510 entradas del catálogo (ya está escrito, NO lo modifiques).

Si no encuentras alguno de estos archivos, avísame antes de continuar.

---

## Fase 1: Cimientos

Tu objetivo en esta fase es dejar el proyecto **listo para empezar a construir UI**. NO toques aún auth, dashboard, formularios ni PDFs — eso es de fases siguientes.

### Tareas de Fase 1

1. **Auditar el estado actual del repo** y reportarme qué ves: contenido de `package.json`, archivos existentes en `src/`, si hay algún rastro de proyectos previos que haya que limpiar.

2. **Verificar/instalar dependencias** del stack definido en `CONTEXT.md` sección 2. Las que ya estén, no las reinstales. Las que falten, agrégalas. Específicamente:
   - `@supabase/supabase-js`, `@supabase/ssr`
   - `react-hook-form`, `zod`, `@hookform/resolvers`
   - `@tanstack/react-query`
   - `@fullcalendar/react`, `@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`, `@fullcalendar/list`
   - `@react-pdf/renderer`
   - `date-fns`, `lucide-react`, `clsx`, `tailwind-merge`

3. **Inicializar shadcn/ui** con tema slate y CSS variables. Instalar componentes base:
   ```
   button input label form dialog select textarea card table popover command toast badge separator alert sonner
   ```

4. **Crear la estructura de carpetas** según `CONTEXT.md` sección 7. Las carpetas vacías está bien por ahora; las llenaremos en fases posteriores. Para mantenerlas en git puedes agregar un `.gitkeep` en cada una.

5. **Configurar Supabase clients**:
   - `src/lib/supabase/client.ts` — browser client con `createBrowserClient` de `@supabase/ssr`
   - `src/lib/supabase/server.ts` — server client con `createServerClient` y cookies (compatible con Next.js 15 async cookies)
   - `src/lib/supabase/middleware.ts` — función `updateSession` para refresh de tokens

6. **Configurar middleware raíz** en `src/middleware.ts`:
   - Llama a `updateSession`
   - Redirige a `/login` si no hay sesión (excepto rutas `/login`, `/register`, `/api/health`, assets de Next, archivos estáticos)
   - Redirige a `/` si hay sesión y se intenta entrar a `/login` o `/register`
   - Matcher debe excluir `_next/static`, `_next/image`, `favicon.ico` y archivos con extensión de imagen

7. **Crear los types** en `src/types/database.ts` con tipos exportados: `Profile`, `CatalogoMaterial`, `Paciente`, `Cirugia`, `CirugiaMaterial` + todos los enums (`UserRole`, `TipoIncapacidad`, `PrioridadCirugia`, `TipoOperacion`, `EstadoCirugia`, `SistemaOsteo`).

8. **Crear `src/lib/constants.ts`** con un objeto `HOSPITAL` que lea las env vars `HOSPITAL_NOMBRE`, `HOSPITAL_OOAD`, `HOSPITAL_LUGAR` con defaults sensatos, y agregue `servicio: 'Traumatología y Ortopedia'`.

9. **Crear `.env.example`** con todas las variables listadas en `CONTEXT.md` sección 8 (sin valores reales, solo los nombres). Verifica que `.env.local` esté en `.gitignore`.

10. **Crear el health endpoint** en `src/app/api/health/route.ts`:
    - GET handler
    - Cuenta items en `catalogo_material` con `{ count: 'exact', head: true }`
    - Responde `{ status: 'ok', catalogo_size: count, timestamp: ISO }`
    - En caso de error, responde 500 con `{ status: 'error', error: string }`

11. **Aplicar las migraciones a Supabase**:
    - Verifica si el proyecto ya está vinculado (`supabase status` o existencia de `supabase/.temp/project-ref`)
    - Si NO está vinculado, **detente y pídeme** que ejecute `npx supabase login` y `npx supabase link --project-ref <REF>` (no intentes hacerlo tú, requiere mi access token)
    - Si SÍ está vinculado, ejecuta `npx supabase db push` para aplicar las 3 migraciones
    - Confirma vía `psql` o consulta SQL que las tablas existen y `catalogo_material` tiene 510 registros

### Criterio de aceptación de Fase 1

- ✅ `npm run dev` arranca sin errores
- ✅ `npm run build` compila sin errores de TypeScript
- ✅ `http://localhost:3000/api/health` responde `{ status: 'ok', catalogo_size: 510, timestamp: ... }`
- ✅ Acceder a `/` sin sesión redirige a `/login` (aunque `/login` aún no exista — el redirect debe ocurrir; lo que se vea después no importa)
- ✅ Las 3 migraciones aplicadas correctamente en Supabase
- ✅ Repo committed con mensajes claros tipo `feat(fase-1): instala deps y shadcn`, `feat(fase-1): configura supabase clients y middleware`, `feat(fase-1): aplica migraciones iniciales`

### Lo que NO debes hacer en Fase 1

- ❌ Implementar páginas de login/register (es Fase 2)
- ❌ Implementar dashboard, formularios, PDFs (Fases 3-4)
- ❌ Modificar el SQL de las migraciones existentes
- ❌ Ejecutar SQL manualmente en el dashboard de Supabase (usa `supabase db push`)
- ❌ Agregar dependencias fuera del stack definido sin preguntar
- ❌ Crear archivos fuera de la estructura definida en `CONTEXT.md` sección 7

### Antes de empezar

1. Confirma que leíste `CONTEXT.md` completo
2. Ejecuta el paso 1 (auditoría) y reportame el estado actual del repo
3. Lista las tareas que ves problemáticas o ambiguas
4. Hazme las preguntas que tengas
5. Espera mi luz verde antes de empezar a ejecutar las demás tareas

Cuando termines la fase, ejecuta los criterios de aceptación uno por uno y reportame el resultado de cada uno antes de considerarla terminada.
