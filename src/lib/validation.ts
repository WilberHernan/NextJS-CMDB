import { z } from 'zod';
import { SEDES } from '@/lib/sedes';

/** Zod schemas for API route input validation.
 *
 *  Every schema is a DROP-IN — it does NOT change the shape of the
 *  accepted body compared to what the routes already expect. It only
 *  REJECTS malformed requests earlier, with a clear error message.
 */

export const crearEquipoSchema = z.object({
  hoja: z.string().min(1, 'hoja es requerida'),
  valores: z.array(z.string()).min(1, 'valores no puede estar vacío'),
  sede: z.enum(SEDES).optional(),
});

export const actualizarEquipoSchema = z.object({
  fila: z.string().min(1, 'fila es requerida').regex(/^\d+$/, 'fila debe ser numérica'),
  hoja: z.string().min(1, 'hoja es requerida'),
  valores: z.array(z.string()).min(1, 'valores no puede estar vacío'),
  sede: z.enum(SEDES).optional(),
});

export const buscarEquipoSchema = z.object({
  placa: z.string().min(1, 'placa es requerida'),
  sede: z.enum(SEDES).optional(),
});

export const loginSchema = z.object({
  password: z.string().min(1, 'password es requerida'),
});
