import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn (...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeOption (str: string): string {
  return str.toString().toUpperCase().trim().replace(/\s+/g, ' ');
}

export function findMatchingOption (
  valor: string,
  opciones: string[]
): string | null {
  if (!valor) return null;
  const normalizedValor = normalizeOption(valor);
  let match = opciones.find(
    (opt) => normalizeOption(opt) === normalizedValor
  );
  if (match) return match;
  const compactValor = normalizedValor.replace(/\s/g, '');
  match = opciones.find(
    (opt) => normalizeOption(opt).replace(/\s/g, '') === compactValor
  );
  if (match) return match;
  match = opciones.find(
    (opt) =>
      normalizeOption(opt).includes(normalizedValor) ||
      normalizedValor.includes(normalizeOption(opt))
  );
  return match ?? null;
}

export function sanitizarPlaca (texto: string): string {
  return texto
    .toString()
    .replace(/'/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toUpperCase();
}

export function formatearFechaParaInput (valor: string): string {
  if (!valor || valor.trim() === '') return '';
  const str = valor.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const matchDMY = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchDMY) {
    const dia = matchDMY[1].padStart(2, '0');
    const mes = matchDMY[2].padStart(2, '0');
    const anio = matchDMY[3];
    return `${anio}-${mes}-${dia}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return '';
}
