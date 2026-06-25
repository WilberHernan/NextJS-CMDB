# CMDB SENA — Documentación del Proyecto

## ¿Qué es?

CMDB SENA es una aplicación web para gestionar el inventario de equipos de
cómputo del SENA Cauca. Permite registrar, buscar y actualizar equipos con
sus características técnicas (hardware, software, periféricos, etc.) usando
Google Sheets como base de datos.

Está desplegada en **Vercel** y los inspectores la usan desde tablets o
celulares mientras recorren las sedes.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 16.2.7** (App Router) |
| Frontend | **React 19.2.7** + **TypeScript 5.8** |
| Estilos | **Tailwind CSS 3** con sistema de variables CSS |
| Íconos | **Lucide React** (~1.500 íconos SVG) |
| Escáner | **@zxing/browser** + **@zxing/library** (lectura de códigos de barras) |
| Google Sheets | **@googleapis/sheets** con Service Account (JWT) |
| Validación | **Zod 4** (validación de datos) |
| Testing | **Vitest 4** + Testing Library + jsdom |
| Linter | **ESLint 9** con neostandard |
| Git hooks | **Husky** + **lint-staged** |

---

## Frontend y Diseño

### Neumorfismo + Glassmorphism

El diseño combina dos tendencias:

- **Neumorfismo:** las tarjetas y botones tienen sombras internas y externas
  que simulan relieve. Un botón "presionado" se ve hundido (sombras invertidas),
  uno "elevado" se ve flotando. Todo el sistema de sombras usa variables CSS
  (`--neu-shadow-dark` y `--neu-shadow-light`) que cambian entre modo claro y
  oscuro.

- **Glassmorphism:** las tarjetas principales tienen fondo semitransparente
  con desenfoque (`backdrop-filter: blur()`), un borde sutil y un brillo en
  el borde superior que simula vidrio.

### Modo Oscuro

El tema se guarda en `localStorage` con la clave `cmdb-theme`. Al cargar la
página, un script inline anti-FOUC (Flash of Unstyled Content) aplica la clase
`dark` al `<html>` antes de que React hidrate, evitando el parpadeo blanco.

La transición entre temas usa la **View Transitions API** con un efecto de
círculo que se expande desde donde hiciste clic.

### Fuentes

- **Inter** (`--font-sans`) — texto general, readable en pantallas
- **Space Grotesk** (`--font-display`) — títulos, mayúsculas, tracking apretado
- **IBM Plex Mono** (`--font-mono`) — placas de equipo, datos técnicos

### Componentes

Los componentes de formulario (inputs, selects, botones, badges, etc.) comparten
un vocabulario visual común: `rounded-xl`, `px-4 py-3`, `shadow-neu-pressed`,
`focus:border-accent` con un anillo de enfoque verde. Esto asegura que toda la
interfaz se sienta coherente sin importar qué componente se renderice.

---

## Base de Datos (Google Sheets)

No hay base de datos tradicional. Los datos viven en archivos **.xlsx** de
Google Sheets, uno por sede. La conexión se hace mediante una **Service
Account** de Google Cloud:

1. La Service Account se autentica con un JSON privado (JWT).
2. El servidor usa `@googleapis/sheets` para leer y escribir las celdas.
3. Cada equipo ocupa una fila; las columnas están definidas en
   `src/types/equipment.ts` (~50 campos como HOSTNAME, MARCA, SERIAL, PLACA,
   etc.).
4. El proxy de Next.js redirige las rutas `/api/*` para que el frontend no
   llame directamente a Google.

**Variables de entorno necesarias:**
- `GOOGLE_SERVICE_ACCOUNT_KEY_JSON` o `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`
- `SPREADSHEET_ID_CCYS`, `SPREADSHEET_ID_REGIONAL`,
  `SPREADSHEET_ID_CIUDAD_JARDIN`
- `PAGE_KEY` (contraseña maestra)

---

## Seguridad

### Autenticación

La app usa una **cookie de sesión** llamada `cmdb-auth`:

1. El usuario ingresa una contraseña (o la recibe desde un script vía URL).
2. El servidor la compara con `PAGE_KEY` (variable de entorno).
3. Si coincide, crea la cookie con `httpOnly: true`, `secure: true`,
   `sameSite: 'lax'` y **sin fecha de vencimiento** (cookie de sesión).
4. **Al cerrar el navegador, la cookie se destruye.** Volver a entrar requiere
   la contraseña de nuevo.
5. Cada ruta `/api/auth/check` verifica que la cookie coincida con el
   `PAGE_KEY` del servidor.

### Protecciones adicionales

- La cookie es `httpOnly` (JavaScript no puede leerla) y `secure` (solo HTTPS).
- Las rutas de API validan la cookie antes de devolver datos.
- No se almacenan contraseñas en el navegador — solo la cookie de sesión.

---

## Scripts de Inventario

En la carpeta `inventario-scripts/` hay scripts por sede que automatizan el
registro de equipos nuevos en Windows.

### ¿Qué hacen?

Cada sede tiene su propia carpeta con un script `.ps1` y un `.bat`:

```
inventario-scripts/
├── CCYS/
│   ├── inventarioWin.ps1
│   └── PermisosWin.bat
├── CIUDAD_JARDIN/
│   ├── inventarioWin.ps1
│   └── PermisosWin.bat
└── REGIONAL/
    ├── inventarioWin.ps1
    └── PermisosWin.bat
```

Los scripts:

### Seguridad en los scripts

- La contraseña (`PAGE_KEY`) está escrita directamente en el script `.ps1`.
  No está "encriptada" — el script la contiene para poder pasarla por URL.
  Es una limitación conocida: el script debe tener la clave para poder
  autenticarse.
- La clave viaja por HTTPS, nunca por HTTP.
- Si alguien obtiene el script, tiene la clave. Por eso la rotación periódica
  de `PAGE_KEY` es recomendable.

---

## Escáner de Códigos de Barras

La app puede leer códigos de barras de las placas de los equipos de dos
maneras:

### Modo Lector (escáner USB)

El usuario posiciona el cursor en el campo de búsqueda y escanea con un
lector de código de barras USB. El lector escribe el texto como si fuera
un teclado.

### Modo Cámara

El usuario saca una foto a la placa del equipo. La app:

1. Toma la imagen y la procesa con canvas (redimensiona a máximo 1280px de
   ancho, aumenta el contraste 1.3x).
2. Prueta **@zxing/library** para decodificar el código de barras desde la
   imagen.
3. Si no lo logra, aplica **6 estrategias distintas** de preprocesamiento:
   - Imagen original
   - Contraste aumentado
   - Binarización con 3 umbrales diferentes (80, 128, 180)
   - Colores invertidos
4. Cada estrategia se prueba en **4 rotaciones** (0°, 90°, 180°, 270°) por
   si la foto se tomó en orientación vertical u horizontal.
5. En total, hasta **24 intentos** por foto en menos de 3 segundos.
6. Cuando encuentra un código, muestra el valor en pantalla para que el
   usuario lo confirme antes de buscarlo.

---

## Múltiples Sedes

La app maneja 3 sedes:

| Código | Nombre |
|---|---|
| CCYS | Centro de Comercio y Servicios |
| REGIONAL | Sede Regional Cauca |
| CIUDAD_JARDIN | Sede Ciudad Jardín |

Cada sede tiene su propio Google Sheet (configurado por variable de entorno).
Al seleccionar una sede, la app lee y escribe en el sheet correspondiente.

La sede seleccionada se guarda en `localStorage` con la clave `cmdb-sede`,
así que aunque la sesión expire al cerrar el navegador, la sede elegida se
recuerda.

---

## Estructura del Proyecto

```
src/
├── app/                    # Rutas de Next.js (App Router)
│   ├── api/                # Endpoints de API (/api/auth/*, /api/equipos/*)
│   ├── globals.css         # Variables CSS, animaciones, utilidades
│   ├── layout.tsx          # Layout raíz (fuentes, AuthGate, SedeProvider)
│   └── page.tsx            # Página principal (escáner + formulario)
├── components/             # Componentes React
│   ├── ui/                 # Componentes base (Button, Input, Badge, etc.)
│   ├── AuthGate.tsx        # Portada de login
│   ├── PasswordCard.tsx    # Formulario de contraseña
│   ├── ScanCard.tsx        # Tarjeta del escáner
│   ├── CustomSelect.tsx    # Select desplegable personalizado
│   ├── EquipmentForm.tsx   # Formulario de equipo (50 campos)
│   ├── SedeSelector.tsx    # Selector de sedes
│   └── ...
├── contexts/               # Contextos React (sede-context)
├── hooks/                  # Custom hooks (useEquipment, useScanner, etc.)
├── lib/                    # Utilidades (imagePreprocess, rate-limiter, etc.)
├── services/               # Google Sheets API
├── types/                  # Tipos y constantes (equipment.ts)
└── proxy.ts                # Middleware de Next.js (proxy a Google)
```

---

## Comandos Útiles

```bash
npm run dev          # Iniciar en desarrollo (localhost:3000)
npm run build        # Compilar para producción
npm run test         # Ejecutar tests (Vitest)
npm run lint         # Verificar código con ESLint
npm run lint:fix     # Corregir problemas automáticamente
npm run type-check   # Verificar tipos de TypeScript
```
