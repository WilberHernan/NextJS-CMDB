import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<unknown> };

/** Wraps an API route handler with consistent error handling.
 *
 *  Elimina el try/catch repetido en cada ruta. El handler lanza
 *  y `withApiHandler` lo transforma en un `{ ok: false, error }` 500.
 *
 *  Uso:
 *    export const GET = withApiHandler(async (req, ctx) => { ... });
 */
export function withApiHandler<T> (
  fn: (
    request: Request,
    context: RouteContext
  ) => Promise<NextResponse<T>>
) {
  return async (request: Request, context: RouteContext) => {
    try {
      return await fn(request, context);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error interno del servidor';
      console.error('[API Error]', message);
      return NextResponse.json(
        { ok: false, error: message } as T,
        { status: 500 }
      );
    }
  };
}
