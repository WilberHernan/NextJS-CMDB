# CMDB SENA

Sistema de Gestión de Configuración para el inventario de equipos TI del
**SENA Centro de Comercio y Servicios — Cauca**.

Aplicación web moderna, multi-sede, con escaneo por código de barras,
tema oscuro/claro y una capa de datos que permite migrar a base de
datos sin reescribir la UI.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind CSS 3 + diseño neumórfico |
| Tipado | TypeScript 5.8 (strict) |
| Fuentes | Space Grotesk / Inter / IBM Plex Mono |
| Iconos | Lucide React |
| Escaneo | `@zxing/browser` + `@zxing/library` (cámara y lector USB) |
| Persistencia | Google Sheets API v4 (`@googleapis/sheets`) |
| Acceso | Password gate via `PAGE_KEY` |
| Testing | Vitest + Testing Library (unit) · Playwright (E2E) |
| CI/CD | GitHub Actions (type-check + lint + tests + build + E2E) |

---

## Arquitectura

El sistema se organiza en capas que aíslan responsabilidades:

```
AuthGate (password + selección de sede)
    │
SedeProvider (Context + localStorage)
    │
Layout → Header + Main + Footer
    │
API Routes (/api/equipos/*, /api/validaciones, /api/mapeo-sede)
    │
equipment.repository.ts     ← capa de datos (única que cambia al migrar a SQL)
    │
sheets.ts → Google Sheets API v4
    │
    ├── CCYS / EquiposSena + EquiposTelefonica
    ├── REGIONAL / EquiposSena + EquiposTelefonica
    └── CIUDAD_JARDIN / EquiposSena + EquiposTelefonica
```

Cada sede tiene su propio spreadsheet. Dentro de cada spreadsheet hay dos
hojas: **EquiposSena** y **EquiposTelefonica**. El sistema cruza ambas y
filtra por sede usando la columna 8.

---

## Funcionalidades

- **Multi-sede**: CCYS, REGIONAL, CIUDAD JARDIN — cada una con su propio spreadsheet y validaciones independientes.
- **Escaneo por lector USB**: captura automática desde escáner de código de barras en formato placa.
- **Escaneo por cámara**: decodificación QR/códigos usando `@zxing/browser` para fotos o cámara en vivo.
- **Búsqueda por placa**: recorre EquiposSena → EquiposTelefonica de la sede activa y filtra por columna 8.
- **Formulario completo**: 53 campos en 12 secciones, con validaciones y dropdowns dinámicos.
- **Creación y actualización**: alta de nuevos equipos con validación de placa duplicada; edición directa sobre la fila.
- **Movimiento entre hojas**: al cambiar el propietario (SENA ↔ TELEFONICA), el equipo se mueve automáticamente entre hojas.
- **Dropdowns dinámicos**: opciones cargadas desde una hoja de validaciones + defaults por tipo de campo.
- **Tema oscuro/claro**: con persistencia en localStorage y script inline anti-flash.
- **Auth por página**: password gate simple vía `PAGE_KEY`.
- **Persistencia de sede**: la sede seleccionada se guarda en localStorage y se refleja en Header, Footer y `document.title`.

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/                          # Route Handlers
│   │   ├── auth/                     # login, check, logout
│   │   ├── equipos/
│   │   │   ├── buscar/route.ts       # GET  ?placa=X&sede=CCYS
│   │   │   ├── actualizar/route.ts   # POST { fila, hoja, valores, sede }
│   │   │   └── crear/route.ts        # POST { hoja, valores, sede }
│   │   ├── validaciones/route.ts     # GET  ?sede=CCYS
│   │   ├── mapeo-sede/route.ts       # GET  ?sede=CCYS
│   │   ├── descargar-script/route.ts # GET  — genera .bat/.ps1
│   │   └── health/route.ts           # GET  — health check
│   ├── globals.css                   # Design tokens + z-index + utilidades neumórficas
│   ├── layout.tsx                    # Providers, fuentes, theme-script
│   └── page.tsx                      # Página principal
├── components/
│   ├── AuthGate.tsx                  # Password + selector de sede
│   ├── PasswordCard.tsx              # Card de acceso (glassmorphism)
│   ├── SedeBubbleSelector.tsx        # Selector de sede (burbujas via portal)
│   ├── BubbleList.tsx                # Lista de burbujas + keyboard nav
│   ├── Header.tsx                    # Nav + título dinámico + theme toggle
│   ├── ScannerSection.tsx            # Escaneo por lector + cámara
│   ├── ScanCard.tsx                  # UI del escaneo
│   ├── EquipmentForm.tsx             # Formulario de 53 campos
│   ├── DynamicField.tsx              # Campo con dropdown dinámico (React.memo)
│   ├── DateField.tsx                 # Campo de fecha
│   ├── CustomSelect.tsx              # Select con ARIA + keyboard nav + portal
│   ├── HelpModal.tsx                 # Modal de ayuda (contenido inline)
│   ├── ScriptDownloadMenu.tsx        # Descarga de scripts de sincronización
│   ├── Alert.tsx / EmptyState.tsx / ErrorBoundary.tsx
│   └── ui/
│       ├── badge.tsx
│       └── button.tsx
├── contexts/
│   └── sede-context.tsx              # SedeProvider + hook useSede()
├── hooks/
│   ├── useEquipment.ts               # Lógica CRUD (API integration)
│   ├── useEquipmentForm.ts           # Lógica del formulario (useReducer)
│   ├── useScanner.ts                 # Lógica de escaneo (isMountedRef guard)
│   └── useTheme.ts                   # Toggle dark/light
├── lib/
│   ├── sedes.ts                      # SEDES, SEDE_LABELS, Sede, isSede()
│   ├── utils.ts                      # cn(), sanitize(), formatDate()
│   ├── version.ts                    # APP_VERSION (single source of truth)
│   ├── help-guide.ts                 # Contenido de ayuda (inline, O(1))
│   ├── rate-limiter.ts               # Rate limiting in-memory
│   └── api-error-handler.ts          # Helpers de error para API routes
├── repositories/
│   └── equipment.repository.ts       # Acceso a datos (única capa que cambia al migrar a SQL)
├── services/
│   └── sheets.ts                     # Cliente Google Sheets API v4
└── types/
    └── equipment.ts                  # Tipos: COLUMNAS, SECCIONES, EquipoResponse
```

---

## Multi-Sede: Flujo de Datos

### Selección de sede

1. `AuthGate` muestra un selector de burbujas neumórficas con las 3 sedes.
2. Al seleccionar, `SedeProvider` guarda en `localStorage` (`cmdb-sede`).
3. `SEDE_LABELS["CIUDAD_JARDIN"]` → `"CIUDAD JARDIN"` para display.
4. El Header muestra `"SENA {sede}"`, el Footer `"CMDB SENA {sede} — Cauca 2026"`, y `document.title` se actualiza via `useEffect`.

### Filtro por sede en búsqueda (columna 8)

Cuando `buscarEquipo()` recorre EquiposSena y EquiposTelefonica, cada fila se filtra por columna 8:

- Si la celda **está vacía** → pasa (datos legacy, anteriores a la segmentación).
- Si contiene un **nombre de sede conocido** y **no coincide** con la sede esperada → se filtra (evita cruces).
- Si contiene **otro valor** (ej: `"TELEFONICA"`) → pasa (sigue perteneciendo a la sede correcta).

Esto permite que una misma placa exista en sedes diferentes sin contaminar resultados.

---

## Variables de Entorno

### Autenticación Google Sheets (usar una)

| Variable | Descripción |
|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Ruta al archivo JSON de la service account |
| `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` | JSON completo escapado en una línea |

### Spreadsheet IDs por sede

| Variable | Descripción |
|----------|-------------|
| `SPREADSHEET_ID_CCYS` | ID del spreadsheet — Sede CCYS |
| `SPREADSHEET_ID_REGIONAL` | ID del spreadsheet — Sede REGIONAL |
| `SPREADSHEET_ID_CIUDAD_JARDIN` | ID del spreadsheet — Sede CIUDAD JARDIN |

### Seguridad

| Variable | Descripción |
|----------|-------------|
| `PAGE_KEY` | Clave para acceder a la aplicación (AuthGate) |

### Nombres de hojas (opcional — tienen defaults)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `SHEET_EQUIPOS_SENA` | `EquiposSena` | Nombre de la hoja SENA |
| `SHEET_EQUIPOS_TELEFONICA` | `EquiposTelefonica` | Nombre de la hoja TELEFÓNICA |
| `SHEET_VALIDACIONES` | `Hoja3` | Hoja de validaciones/dropdowns |

---

## API

| Método | Ruta | Parámetros | Descripción |
|--------|------|-----------|-------------|
| `POST` | `/api/auth/login` | `{ password }` | Inicia sesión con PAGE_KEY |
| `GET` | `/api/auth/check` | — | Verifica sesión activa |
| `POST` | `/api/auth/logout` | — | Cierra sesión |
| `GET` | `/api/equipos/buscar` | `placa`, `sede` | Busca equipo en la sede |
| `POST` | `/api/equipos/actualizar` | `{ fila, hoja, valores, sede }` | Actualiza fila |
| `POST` | `/api/equipos/crear` | `{ hoja, valores, sede }` | Crea equipo nuevo |
| `GET` | `/api/validaciones` | `sede` | Valores para dropdowns |
| `GET` | `/api/mapeo-sede` | `sede` | Mapeo ID ↔ nombre de sedes |
| `GET` | `/api/descargar-script` | `sede`, `tipo` | Descarga scripts de sincronización |
| `GET` | `/api/health` | — | Health check |

---

## Scripts

```bash
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run type-check   # Verificación de tipos (tsc --noEmit)
npm run lint         # ESLint
npm run test         # Tests unitarios (Vitest)
npm run test:watch   # Tests unitarios en watch mode
npm run test:e2e     # Tests E2E (Playwright)
```

---

## Testing

### Tests Unitarios (Vitest + Testing Library)

114 tests cubriendo:

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `formReducer.test.ts` | 18 | Reducer puro: 13 acciones, inmutabilidad, sede sync |
| `useEquipment.test.ts` | 19 | Hook CRUD: buscar, actualizar, crear, cargarValidaciones, cargarMapeoSede |
| `CustomSelect.test.tsx` | 19 | ARIA, keyboard nav (↑↓/Home/End/Escape/Enter), selección |
| `EquipmentForm.test.tsx` | 16 | Renderizado, 53 campos, secciones, modos, saving |
| `utils.test.ts` | 20 | cn(), sanitize(), formatDate() |
| `PasswordCard.test.tsx` | 6 | Renderizado, sede, password toggle, submit |
| `rate-limiter.test.ts` | 5 | Rate limiting in-memory |
| `sedes.test.ts` | 5 | SEDES, SEDE_LABELS, isSede() |
| `help-guide.test.ts` | 4 | getHelpSections() por sede |
| `version.test.ts` | 2 | APP_VERSION consistency |

### Tests E2E (Playwright)

7 tests cubriendo el flujo de autenticación:

- Carga de página y password card
- Selector de sede visible
- Input de contraseña
- Toggle mostrar/ocultar contraseña
- Validación client-side (contraseña vacía)
- Error de API (contraseña incorrecta, mockeada)
- Footer visible

Las APIs se mockean con `page.route()` para que los tests sean determinísticos.

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) ejecuta en cada push/PR a `main`:

1. **Job `quality`**: type-check → lint → tests unitarios → build
2. **Job `e2e`**: instala Playwright + chromium → tests E2E

Concurrencia con cancelación de runs obsoletas. Artefactos de test subidos en caso de fallo.



---

## Mantenimiento

- Cada sede tiene su propio spreadsheet — si una sede necesita cambios estructurales (columnas, validaciones), no afecta a las demás.
- La columna 8 debe mantener el formato de nombre de sede para que el filtro funcione correctamente.
- Si se agrega una sede nueva:
  1. Agregar a `SEDES` y `SEDE_LABELS` en `src/lib/sedes.ts`.
  2. Agregar `SPREADSHEET_ID_<SEDE>` en `src/services/sheets.ts`.
  3. Agregar variable de entorno correspondiente.

---

## Design System

### Z-Index Tokens

```css
--z-header: 30;      /* Header sticky */
--z-dropdown: 40;    /* CustomSelect, SedeBubbleSelector */
--z-modal: 50;       /* HelpModal, AuthGate */
--z-bubble: 45;      /* Sede bubbles portal */
```

### Clases Utilitarias

| Clase | Uso |
|-------|-----|
| `.glass-card` | Tarjetas glassmorphism (PasswordCard, HelpModal) |
| `.header-stuck` | Header con sombra al hacer scroll |
| `.btn-lift` | Botones con hover lift + active press |
| `.success-bar-gradient` | Barra de éxito con gradiente animado |

### Accesibilidad

- `CustomSelect`: `role="combobox"` + `aria-haspopup="listbox"` + keyboard nav completa (WAI-ARIA APG)
- `SedeBubbleSelector`: `aria-expanded` + `aria-controls` + keyboard nav (↑↓/Escape)
- `prefers-reduced-motion`: todas las animaciones se reducen a 0.01ms
- Focus rings visibles en todos los interactivos (`focus-visible`)

---

## Licencia

SENA — Centro de Comercio y Servicios, Cauca.
