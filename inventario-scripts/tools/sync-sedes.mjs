#!/usr/bin/env node
/**
 * Genera los scripts de inventario para cada sede a partir de plantillas.
 * Uso: node inventario-scripts/tools/sync-sedes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TPL = path.join(__dirname, 'templates');

const SCRIPT_VERSION = '2.1.0';

const SEDES = [
  { id: 'CCYS', label: 'CCYS', org: 'CMDB SENA / CCYS' },
  { id: 'REGIONAL', label: 'REGIONAL', org: 'CMDB SENA / REGIONAL' },
  { id: 'CIUDAD_JARDIN', label: 'CIUDAD JARDIN', org: 'CMDB SENA / CIUDAD JARDIN' }
];

const FILES = [
  { template: 'inventarioWin.ps1', dest: (s) => path.join(ROOT, s.id, 'inventarioWin.ps1') },
  { template: 'PermisosWin.bat', dest: (s) => path.join(ROOT, s.id, 'PermisosWin.bat') },
  { template: 'inventarioMac', dest: (s) => path.join(ROOT, s.id, 'Mac y Linux', 'inventarioMac') },
  { template: 'inventarioLinux', dest: (s) => path.join(ROOT, s.id, 'Mac y Linux', 'inventarioLinux') }
];

function render (templateName, sede) {
  const raw = fs.readFileSync(path.join(TPL, templateName), 'utf8');
  return raw
    .replaceAll('__SEDE__', sede.id)
    .replaceAll('__SEDE_LABEL__', sede.label)
    .replaceAll('__ORG_LABEL__', sede.org)
    .replaceAll('__SCRIPT_VERSION__', SCRIPT_VERSION);
}

let count = 0;
for (const sede of SEDES) {
  for (const { template, dest } of FILES) {
    const out = dest(sede);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(template, sede), 'utf8');
    count++;
    console.log(`  ${path.relative(ROOT, out)}`);
  }
}

console.log(`\nOK: ${count} archivos generados (v${SCRIPT_VERSION})`);
