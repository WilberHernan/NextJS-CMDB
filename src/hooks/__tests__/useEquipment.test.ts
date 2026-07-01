import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEquipment } from '@/hooks/useEquipment';
import type { EquipoResponse, MapeoSedeId } from '@/types/equipment';

// ── Mock useSede so we don't need SedeProvider + localStorage ──
vi.mock('@/contexts/sede-context', () => ({
  useSede: () => ({ sede: 'CCYS', setSede: vi.fn(), loading: false }),
}));

// ── Mock fetch ──
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockResponse (data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  };
}

const mockEquipoResponse: EquipoResponse = {
  hoja: 'EquiposSena',
  fila: 15,
  valores: Array(53).fill(''),
  validaciones: { 3: ['HP', 'DELL'], 4: ['ProBook', 'Latitude'] },
  validacionesIndices: [3, 4],
  mapeoSedeId: {
    sedeAId: { CCYS: '123' },
    idASede: { 123: 'CCYS' },
  } satisfies MapeoSedeId,
};

describe('useEquipment', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct initial state', () => {
    const { result } = renderHook(() => useEquipment());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.result).toBe(null);
    expect(result.current.validaciones).toEqual({});
    expect(result.current.mapeoSedeId).toEqual({ sedeAId: {}, idASede: {} });
  });

  // ── buscar ──

  it('buscar: success sets result, validaciones, mapeoSedeId', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: mockEquipoResponse })
    );

    const { result } = renderHook(() => useEquipment());

    let data: EquipoResponse | null = null;
    await act(async () => {
      data = await result.current.buscar('PLACA123');
    });

    expect(data).toEqual(mockEquipoResponse);
    expect(result.current.result).toEqual(mockEquipoResponse);
    expect(result.current.validaciones).toEqual({ 3: ['HP', 'DELL'], 4: ['ProBook', 'Latitude'] });
    expect(result.current.mapeoSedeId).toEqual(mockEquipoResponse.mapeoSedeId);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('buscar: sends correct URL with placa and sede', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: null })
    );

    const { result } = renderHook(() => useEquipment());

    await act(async () => {
      await result.current.buscar('ABC-123');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/equipos/buscar?placa=ABC-123&sede=CCYS'
    );
  });

  it('buscar: not found returns null without setting validaciones', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: null })
    );

    const { result } = renderHook(() => useEquipment());

    let data: EquipoResponse | null = null;
    await act(async () => {
      data = await result.current.buscar('NOTFOUND');
    });

    expect(data).toBe(null);
    expect(result.current.result).toBe(null);
    expect(result.current.validaciones).toEqual({});
    expect(result.current.error).toBe(null);
  });

  it('buscar: API error sets error message', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: false, error: 'Placa no encontrada' }, false, 404)
    );

    const { result } = renderHook(() => useEquipment());

    let data: EquipoResponse | null = null;
    await act(async () => {
      data = await result.current.buscar('BADPLACA');
    });

    expect(data).toBe(null);
    expect(result.current.error).toBe('Placa no encontrada');
    expect(result.current.loading).toBe(false);
  });

  it('buscar: network error sets generic error message', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useEquipment());

    let data: EquipoResponse | null = null;
    await act(async () => {
      data = await result.current.buscar('ANY');
    });

    expect(data).toBe(null);
    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  // ── actualizar ──

  it('actualizar: success returns ApiResult', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: { exito: true, mensaje: 'Actualizado' } })
    );

    const { result } = renderHook(() => useEquipment());

    let res;
    await act(async () => {
      res = await result.current.actualizar('15', 'EquiposSena', Array(53).fill(''));
    });

    expect(res).toEqual({ exito: true, mensaje: 'Actualizado' });
    expect(result.current.error).toBe(null);
  });

  it('actualizar: sends correct POST body', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: { exito: true, mensaje: 'OK' } })
    );

    const { result } = renderHook(() => useEquipment());

    const valores = ['HOST', 'LAPTOP', '', '', ''];
    await act(async () => {
      await result.current.actualizar('15', 'EquiposSena', valores);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/equipos/actualizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fila: '15',
        hoja: 'EquiposSena',
        valores,
        sede: 'CCYS',
      }),
    });
  });

  it('actualizar: API error returns ApiResult with exito=false', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: false, error: 'Sin permisos' }, false, 403)
    );

    const { result } = renderHook(() => useEquipment());

    let res;
    await act(async () => {
      res = await result.current.actualizar('15', 'EquiposSena', []);
    });

    expect(res).toEqual({ exito: false, mensaje: 'Sin permisos' });
    expect(result.current.error).toBe('Sin permisos');
  });

  it('actualizar: network error returns ApiResult with generic message', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

    const { result } = renderHook(() => useEquipment());

    let res;
    await act(async () => {
      res = await result.current.actualizar('15', 'EquiposSena', []);
    });

    expect(res).toEqual({ exito: false, mensaje: 'Connection refused' });
    expect(result.current.error).toBe('Connection refused');
  });

  // ── crear ──

  it('crear: success returns ApiResult', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: { exito: true, mensaje: 'Creado' } })
    );

    const { result } = renderHook(() => useEquipment());

    let res;
    await act(async () => {
      res = await result.current.crear('EquiposSena', Array(53).fill(''));
    });

    expect(res).toEqual({ exito: true, mensaje: 'Creado' });
  });

  it('crear: sends correct POST body without fila', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: { exito: true, mensaje: 'OK' } })
    );

    const { result } = renderHook(() => useEquipment());

    const valores = ['HOST', 'LAPTOP'];
    await act(async () => {
      await result.current.crear('EquiposSena', valores);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/equipos/crear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hoja: 'EquiposSena',
        valores,
        sede: 'CCYS',
      }),
    });
  });

  it('crear: API error returns ApiResult with exito=false', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: false, error: 'Placa ya existe' }, false, 409)
    );

    const { result } = renderHook(() => useEquipment());

    let res;
    await act(async () => {
      res = await result.current.crear('EquiposSena', []);
    });

    expect(res).toEqual({ exito: false, mensaje: 'Placa ya existe' });
    expect(result.current.error).toBe('Placa ya existe');
  });

  // ── cargarValidaciones ──

  it('cargarValidaciones: success sets validaciones', async () => {
    const validaciones = { 3: ['HP', 'DELL'], 5: ['SN-001', 'SN-002'] };
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: validaciones })
    );

    const { result } = renderHook(() => useEquipment());

    await act(async () => {
      await result.current.cargarValidaciones();
    });

    expect(result.current.validaciones).toEqual(validaciones);
  });

  it('cargarValidaciones: error silently keeps defaults', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useEquipment());

    await act(async () => {
      await result.current.cargarValidaciones();
    });

    expect(result.current.validaciones).toEqual({});
    expect(result.current.error).toBe(null);
  });

  it('cargarValidaciones: API returns ok=false silently keeps defaults', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: false, error: 'No data' }, false, 500)
    );

    const { result } = renderHook(() => useEquipment());

    await act(async () => {
      await result.current.cargarValidaciones();
    });

    expect(result.current.validaciones).toEqual({});
  });

  // ── cargarMapeoSede ──

  it('cargarMapeoSede: success sets mapeoSedeId', async () => {
    const mapeo: MapeoSedeId = {
      sedeAId: { CCYS: '100', REGIONAL: '200' },
      idASede: { 100: 'CCYS', 200: 'REGIONAL' },
    };
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: mapeo })
    );

    const { result } = renderHook(() => useEquipment());

    await act(async () => {
      await result.current.cargarMapeoSede();
    });

    expect(result.current.mapeoSedeId).toEqual(mapeo);
  });

  it('cargarMapeoSede: error silently keeps defaults', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useEquipment());

    await act(async () => {
      await result.current.cargarMapeoSede();
    });

    expect(result.current.mapeoSedeId).toEqual({ sedeAId: {}, idASede: {} });
    expect(result.current.error).toBe(null);
  });

  // ── sede in URL ──

  it('buscar: URL-encodes the placa', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ ok: true, data: null })
    );

    const { result } = renderHook(() => useEquipment());

    await act(async () => {
      await result.current.buscar('PLACA/CON#ESPACIOS');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('placa=PLACA%2FCON%23ESPACIOS')
    );
  });
});
