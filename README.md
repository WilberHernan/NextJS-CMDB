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
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS + diseño neumórfico |
| Tipado | TypeScript 5.8 (strict) |
| Fuentes | Space Grotesk / Inter / IBM Plex Mono |
| Iconos | Lucide React |
| Escaneo | `@zxing/browser` + `@zxing/library` (cámara y lector USB) |
| Persistencia | Google Sheets API v4 (`@googleapis/sheets`) |
| Acceso | Password gate via `PAGE_KEY` |

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
│   │   ├── equipos/
│   │   │   ├── buscar/route.ts       # GET  ?placa=X&sede=CCYS
│   │   │   ├── actualizar/route.ts   # POST { placa, data, sede }
│   │   │   └── crear/route.ts        # POST { placa, data, sede }
│   │   ├── validaciones/route.ts     # GET  ?sede=CCYS
│   │   └── mapeo-sede/route.ts       # GET  ?sede=CCYS
│   ├── globals.css                   # Design tokens + utilidades neumórficas
│   ├── layout.tsx                    # Providers, fuentes, theme-script
│   └── page.tsx                      # Página principal
├── components/
│   ├── AuthGate.tsx                  # Password + selector de sede (burbujas neumórficas via portal)
│   ├── Header.tsx                    # Nav + título dinámico + theme toggle
│   ├── ScanCard.tsx                  # Escaneo por lector + cámara
│   ├── EquipmentForm.tsx             # Formulario de 53 campos
│   ├── DynamicField.tsx              # Campo con dropdown dinámico
│   ├── DateField.tsx                 # Campo de fecha
│   ├── CustomSelect.tsx              # Select nativo estilizado
│   ├── SedeSelector.tsx              # Selector de sede en footer
│   ├── Alert.tsx / EmptyState.tsx / Loader.tsx
│   ├── ErrorBoundary.tsx
│   └── ui/
│       ├── gradient-button.tsx
│       └── skeleton.tsx
├── contexts/
│   └── sede-context.tsx              # SedeProvider + hook useSede()
├── hooks/
│   ├── useEquipment.ts               # Lógica CRUD
│   ├── useEquipmentForm.ts           # Lógica del formulario
│   ├── useScanner.ts                 # Lógica de escaneo
│   └── useTheme.ts                   # Toggle dark/light
├── lib/
│   ├── sedes.ts                      # SEDES, SEDE_LABELS, Sede, isSede()
│   └── utils.ts                      # cn(), sanitize(), formatDate()
├── repositories/
│   └── equipment.repository.ts       # Acceso a datos (única capa que cambia al migrar a SQL)
├── services/
│   └── sheets.ts                     # Cliente Google Sheets API v4
└── types/
    └── equipment.ts                  # Tipos: Columnas, Secciones, Equipo
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
| `POST` | `/api/auth/login` | `{ key }` | Inicia sesión con PAGE_KEY |
| `GET` | `/api/auth/check` | — | Verifica sesión activa |
| `POST` | `/api/auth/logout` | — | Cierra sesión |
| `GET` | `/api/equipos/buscar` | `placa`, `sede` | Busca equipo en la sede |
| `POST` | `/api/equipos/actualizar` | `{ placa, data, sede }` | Actualiza fila |
| `POST` | `/api/equipos/crear` | `{ placa, data, sede }` | Crea equipo nuevo |
| `GET` | `/api/validaciones` | `sede` | Valores para dropdowns |
| `GET` | `/api/mapeo-sede` | `sede` | Mapeo ID ↔ nombre de sedes |
| `GET` | `/api/health` | — | Health check



---

## Mantenimiento

- Cada sede tiene su propio spreadsheet — si una sede necesita cambios estructurales (columnas, validaciones), no afecta a las demás.
- La columna 8 debe mantener el formato de nombre de sede para que el filtro funcione correctamente.
- Si se agrega una sede nueva:
  1. Agregar a `SEDES` y `SEDE_LABELS` en `src/lib/sedes.ts`.
  2. Agregar `SPREADSHEET_ID_<SEDE>` en `src/services/sheets.ts`.
  3. Agregar variable de entorno correspondiente.

---

## Licencia

SENA — Centro de Comercio y Servicios, Cauca.
