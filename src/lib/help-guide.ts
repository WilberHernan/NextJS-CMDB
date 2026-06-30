import { APP_VERSION } from '@/lib/version';
import { SEDE_LABELS, SEDES, type Sede } from '@/lib/sedes';

export type HelpSection =
  | { kind: 'header'; text: string }
  | { kind: 'step'; text: string; num: string }
  | { kind: 'code'; text: string }
  | { kind: 'tip'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'blank' };

/** Source of truth for the Help modal — not tied to inventario-scripts downloads. */
const HELP_GUIDE_TEMPLATE = `
Los scripts detectan el hardware del equipo (RAM, disco,
procesador, red) y abren el navegador con el formulario CMDB
con los datos ya precargados.


--- REQUISITOS ------------------------------------------------

  - Conexion a internet
  - Navegador web instalado (Chrome, Firefox, Edge, etc.)
  - Windows: PowerShell (viene instalado)
  - Mac / Linux: Terminal con bash


--- WINDOWS ---------------------------------------------------

  1. Abrir la carpeta donde estan los scripts descargados

  2. Hacer doble clic en PermisosWin.bat

     Si Windows muestra "Windows protegio tu PC":
       Hacer clic en "Mas informacion"
       Hacer clic en "Ejecutar de todas formas"

  3. El script pedira permisos y abrira el formulario CMDB
     en el navegador

  4. Escanear o escribir la placa cuando lo solicite


--- LINUX -----------------------------------------------------

  1. Abrir terminal (Ctrl + Alt + T)

  2. Ir a la carpeta del script:

      cd /ruta/completa/hasta/Mac\\ y\\ Linux/

     Pista: escribi "cd " (con espacio al final) y arrastra
     la carpeta "Mac y Linux" a la terminal, luego Enter

  3. Dar permisos de ejecucion (solo la primera vez):

      chmod +x inventarioLinux

  4. Ejecutar:

      bash inventarioLinux

  5. Escanear o escribir la placa cuando lo solicite


--- MACOS -----------------------------------------------------

  1. Abrir Terminal
     (Spotlight: Cmd + Espacio, escribir "Terminal", Enter)

  2. Ir a la carpeta del script:

      cd /ruta/completa/hasta/Mac\\ y\\ Linux/

     Pista: escribi "cd " (con espacio al final) y arrastra
     la carpeta "Mac y Linux" a la terminal, luego Enter

  3. Dar permisos de ejecucion (solo la primera vez):

      chmod +x inventarioMac

  4. Ejecutar:

      bash inventarioMac

  5. Escanear o escribir la placa cuando lo solicite


--- SOLUCION DE PROBLEMAS -------------------------------------

  Permission denied
    -> Ejecutar el paso chmod +x (solo la primera vez)

  Command not found / "no se encuentra el comando"
    -> Verifica que estas en la carpeta correcta (paso cd)

  No abre el navegador
    -> Revisar la conexion a internet. El script igual
       muestra la URL en la terminal para abrirla manual

  Windows bloquea el script / "ExecutionPolicy"
    -> Hacer clic derecho sobre PermisosWin.bat
       "Ejecutar como administrador"

  Windows no deja ejecutar / "no firmado"
    -> Hacer clic derecho → "Propiedades"
       En "General", tildar "Permitir" en Seguridad
       Aceptar y volver a ejecutar

  Datos incompletos en el formulario
    -> Completar los campos faltantes en la pagina y guardar


--- SOPORTE ---------------------------------------------------

  Si el problema persiste, contactar al administrador del
  sistema o al area de tecnologia de la sede __SEDE_LABEL__.
`.trim();

export function renderHelpGuide (template: string, sede: Sede): string {
  return template
    .replace(/__SEDE_LABEL__/g, SEDE_LABELS[sede])
    .replace(/__SCRIPT_VERSION__/g, APP_VERSION);
}

export function parseHelpGuide (raw: string): HelpSection[] {
  const lines = raw.split('\n');
  const sections: HelpSection[] = [];
  let inBanner = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('===')) {
      inBanner = !inBanner;
      continue;
    }
    if (inBanner) continue;
    if (/^ {2}CMDB SENA/.test(trimmed)) continue;
    if (/^ {2}Sede:/.test(trimmed)) continue;

    if (/^---/.test(trimmed)) {
      const title = trimmed.replace(/^-{3,}\s*/, '').replace(/\s*-{3,}$/, '').trim();
      if (title) sections.push({ kind: 'header', text: title });
      continue;
    }

    if (trimmed.length === 0) {
      sections.push({ kind: 'blank' });
      continue;
    }

    if (trimmed.includes('->')) {
      sections.push({ kind: 'tip', text: trimmed });
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const [, num, ...rest] = trimmed.match(/^(\d+)\.\s+(.*)/)!;
      sections.push({ kind: 'step', text: rest.join(' '), num });
      continue;
    }

    if (/^ {6}(bash |cd |chmod |sudo |\.\/)/.test(line) || /^\s{2,}(bash |cd |chmod )/.test(trimmed)) {
      sections.push({ kind: 'code', text: trimmed });
      continue;
    }

    sections.push({ kind: 'text', text: trimmed });
  }

  return sections;
}

function buildSections (sede: Sede): HelpSection[] {
  return parseHelpGuide(renderHelpGuide(HELP_GUIDE_TEMPLATE, sede));
}

const HELP_SECTIONS_BY_SEDE = Object.fromEntries(
  SEDES.map((sede) => [sede, buildSections(sede)])
) as Record<Sede, HelpSection[]>;

/** Pre-parsed guide sections — instant lookup, no fetch or parse on open. */
export function getHelpSections (sede: Sede): HelpSection[] {
  return HELP_SECTIONS_BY_SEDE[sede];
}
