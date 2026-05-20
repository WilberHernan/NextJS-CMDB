# CMDB SENA CCYS

Sistema de Gestión de Configuración (CMDB) para el inventario de equipos TI del SENA Centro de Comercio y Servicios — Cauca.

Migrado desde Google Apps Script a Next.js moderno.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **UI**: shadcn/ui, Lucide Icons, Radix UI
- **Backend**: Next.js Route Handlers
- **Persistencia**: Google Sheets API (con capa de abstracción para migración futura a SQL)
- **Validación**: Zod (preparado para integración con React Hook Form)

## Requisitos

- Node.js >= 18
- Cuenta de Google Cloud con Sheets API habilitada
- Service Account con acceso a la Spreadsheet

## Configuración

1. Clonar el repositorio
2. Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

3. Configurar variables de entorno:

| Variable | Descripción |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` | Ruta al archivo JSON de la service account |
| `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` | O bien, el JSON directo escapado |
| `SPREADSHEET_ID` | ID del Google Sheet (de la URL) |
| `SHEET_EQUIPOS_SENA` | Nombre de la hoja SENA (default: EquiposSena) |
| `SHEET_EQUIPOS_TELEFONICA` | Nombre de la hoja TELEFONICA (default: EquiposTelefonica) |
| `SHEET_VALIDACIONES` | Hoja de validaciones (default: Hoja3) |

4. Compartir el Google Sheet con el email de la service account (Editor).

5. Instalar dependencias:

```bash
npm install
```

6. Iniciar desarrollo:

```bash
npm run dev
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/               # Route Handlers (backend)
│   │   ├── equipos/
│   │   │   ├── buscar/    # GET /api/equipos/buscar?placa=XXX
│   │   │   ├── actualizar/# POST /api/equipos/actualizar
│   │   │   └── crear/     # POST /api/equipos/crear
│   │   ├── validaciones/  # GET /api/validaciones
│   │   └── mapeo-sede/    # GET /api/mapeo-sede
│   ├── globals.css        # Estilos globales + design tokens
│   ├── layout.tsx         # Layout raíz
│   └── page.tsx           # Página principal
├── components/
│   ├── ui/                # Componentes base (shadcn-style)
│   ├── Alert.tsx
│   ├── CustomSelect.tsx
│   ├── DateField.tsx
│   ├── DynamicField.tsx
│   ├── EmptyState.tsx
│   ├── EquipmentForm.tsx
│   ├── Header.tsx
│   ├── Loader.tsx
│   └── ScanCard.tsx
├── hooks/
│   ├── useEquipment.ts    # Lógica de negocio (CRUD)
│   ├── useScanner.ts      # Lógica de escaneo
│   └── useTheme.ts        # Tema dark/light
├── lib/
│   └── utils.ts           # Utilidades (cn, sanitize, date format)
├── repositories/
│   └── equipment.repository.ts  # Acceso a datos (Google Sheets)
├── services/
│   └── sheets.ts          # Cliente Google Sheets API
├── types/
│   ├── api.ts
│   └── equipment.ts       # Tipos: columnas, secciones, equipos
└── validators/
    └── equipment.ts       # Validaciones Zod
```

## Funcionalidades

- **Escaneo por lector**: Captura automática desde escáner de código de barras
- **Escaneo por cámara**: Usa html5-qrcode para decodificar códigos desde foto
- **Búsqueda por placa**: Busca en todas las hojas (SENA y TELEFONICA)
- **Formulario completo**: 53 campos organizados en 12 secciones
- **Actualización**: Guarda cambios en la fila correspondiente
- **Movimiento entre hojas**: Si cambia el propietario (SENA ↔ TELEFONICA), mueve el equipo automáticamente
- **Creación**: Registro de nuevos equipos con validación de placa duplicada
- **Sincronización Sede-ID**: Mapeo bidireccional entre ID de sede y nombre
- **Validaciones**: Dropdowns dinámicos desde Hoja3 + defaults
- **Tema oscuro/claro**: Persistencia en localStorage

## Deploy

```bash
npm run build
npm start
```

Para producción, se recomienda deploy en Vercel, Railway o similar,
configurando las variables de entorno en el panel del proveedor.

## Migración desde Apps Script

La arquitectura actual permite migrar de Google Sheets a una base de datos
real (PostgreSQL, Supabase, Prisma) modificando únicamente la capa de
`repositories/`, sin tocar componentes, hooks ni API routes.

## Licencia

SENA — Centro de Comercio y Servicios, Cauca
