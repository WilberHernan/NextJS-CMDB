import { describe, it, expect } from 'vitest';
import { formReducer, initialState, type FormAction } from '@/hooks/formReducer';
import { COLUMNAS } from '@/types/equipment';

// Helper to build a state with some values pre-filled
function makeState (overrides: Partial<typeof initialState> = {}) {
  return { ...initialState, ...overrides };
}

const mockSedeMaps = {
  idASede: { '001': 'CCYS', '002': 'REGIONAL' },
  sedeAId: { CCYS: '001', REGIONAL: '002' },
};

describe('formReducer', () => {
  // ---- SCAN_START ----
  it('SCAN_START clears alert, emptyState, and equipmentFound', () => {
    const state = makeState({
      alertInfo: { type: 'error', message: 'prev error' },
      emptyStatePlaca: 'ABC123',
      equipmentFound: true,
    });
    const next = formReducer(state, { type: 'SCAN_START' });
    expect(next.alertInfo).toBeNull();
    expect(next.emptyStatePlaca).toBeNull();
    expect(next.equipmentFound).toBe(false);
  });

  // ---- SCAN_ERROR ----
  it('SCAN_ERROR sets error alert', () => {
    const next = formReducer(initialState, {
      type: 'SCAN_ERROR',
      message: 'Error de conexión',
    });
    expect(next.alertInfo).toEqual({ type: 'error', message: 'Error de conexión' });
  });

  // ---- SCAN_NOT_FOUND ----
  it('SCAN_NOT_FOUND hides form and sets emptyStatePlaca', () => {
    const state = makeState({ formVisible: true });
    const next = formReducer(state, { type: 'SCAN_NOT_FOUND', placa: 'XYZ789' });
    expect(next.formVisible).toBe(false);
    expect(next.emptyStatePlaca).toBe('XYZ789');
  });

  // ---- SCAN_SUCCESS ----
  it('SCAN_SUCCESS populates valores, hoja, fila and shows form', () => {
    const valores = Array(COLUMNAS.length).fill('');
    valores[6] = 'PLACA001';
    const next = formReducer(initialState, {
      type: 'SCAN_SUCCESS',
      valores,
      hoja: 'EquiposSena',
      fila: '15',
    });
    expect(next.esModoNuevo).toBe(false);
    expect(next.hojaActual).toBe('EquiposSena');
    expect(next.filaActual).toBe('15');
    expect(next.valores).toBe(valores);
    expect(next.formVisible).toBe(true);
    expect(next.equipmentFound).toBe(true);
  });

  // ---- MODO_NUEVO ----
  it('MODO_NUEVO sets new mode with provided valores', () => {
    const valores = Array(COLUMNAS.length).fill('');
    valores[6] = 'NEW001';
    const next = formReducer(initialState, { type: 'MODO_NUEVO', valores });
    expect(next.esModoNuevo).toBe(true);
    expect(next.formVisible).toBe(true);
    expect(next.emptyStatePlaca).toBeNull();
    expect(next.valores).toBe(valores);
    expect(next.alertInfo).toBeNull();
  });

  // ---- VALOR_CHANGE ----
  it('VALOR_CHANGE updates a single field', () => {
    const next = formReducer(initialState, {
      type: 'VALOR_CHANGE',
      index: 0,
      value: 'HOSTNAME01',
      ...mockSedeMaps,
    });
    expect(next.valores[0]).toBe('HOSTNAME01');
  });

  it('VALOR_CHANGE syncs nombre sede when ID sede changes (7 → 8)', () => {
    const next = formReducer(initialState, {
      type: 'VALOR_CHANGE',
      index: 7,
      value: '001',
      ...mockSedeMaps,
    });
    expect(next.valores[7]).toBe('001');
    expect(next.valores[8]).toBe('CCYS');
  });

  it('VALOR_CHANGE syncs ID sede when nombre sede changes (8 → 7)', () => {
    const next = formReducer(initialState, {
      type: 'VALOR_CHANGE',
      index: 8,
      value: 'REGIONAL',
      ...mockSedeMaps,
    });
    expect(next.valores[8]).toBe('REGIONAL');
    expect(next.valores[7]).toBe('002');
  });

  it('VALOR_CHANGE does not sync when value is not in map', () => {
    const next = formReducer(initialState, {
      type: 'VALOR_CHANGE',
      index: 7,
      value: '999',
      ...mockSedeMaps,
    });
    expect(next.valores[7]).toBe('999');
    expect(next.valores[8]).toBe('');
  });

  // ---- URL_PARAMS ----
  it('URL_PARAMS sets valores, modo nuevo, and shows form', () => {
    const valores = Array(COLUMNAS.length).fill('');
    valores[6] = 'URL001';
    const next = formReducer(initialState, { type: 'URL_PARAMS', valores });
    expect(next.valores).toBe(valores);
    expect(next.esModoNuevo).toBe(true);
    expect(next.formVisible).toBe(true);
    expect(next.alertInfo).toBeNull();
  });

  // ---- SAVE_START ----
  it('SAVE_START sets saving and info alert', () => {
    const next = formReducer(initialState, {
      type: 'SAVE_START',
      message: 'Guardando...',
    });
    expect(next.saving).toBe(true);
    expect(next.alertInfo).toEqual({ type: 'info', message: 'Guardando...' });
  });

  // ---- SAVE_ERROR ----
  it('SAVE_ERROR clears saving and sets error alert', () => {
    const state = makeState({ saving: true });
    const next = formReducer(state, {
      type: 'SAVE_ERROR',
      message: 'Error de conexión',
    });
    expect(next.saving).toBe(false);
    expect(next.alertInfo).toEqual({ type: 'error', message: 'Error de conexión' });
  });

  // ---- SAVE_SUCCESS ----
  it('SAVE_SUCCESS clears saving, sets success, hides form, increments searchResetKey', () => {
    const state = makeState({
      saving: true,
      esModoNuevo: true,
      formVisible: true,
      searchResetKey: 3,
    });
    const next = formReducer(state, {
      type: 'SAVE_SUCCESS',
      message: 'Equipo guardado',
    });
    expect(next.saving).toBe(false);
    expect(next.alertInfo).toEqual({ type: 'success', message: 'Equipo guardado' });
    expect(next.formVisible).toBe(false);
    expect(next.searchResetKey).toBe(4);
    expect(next.esModoNuevo).toBe(false);
  });

  // ---- SAVE_FAILURE ----
  it('SAVE_FAILURE clears saving and sets error alert', () => {
    const state = makeState({ saving: true });
    const next = formReducer(state, {
      type: 'SAVE_FAILURE',
      message: 'Error al registrar: algo salió mal',
    });
    expect(next.saving).toBe(false);
    expect(next.alertInfo).toEqual({ type: 'error', message: 'Error al registrar: algo salió mal' });
  });

  // ---- RETRY ----
  it('RETRY clears emptyStatePlaca and alertInfo', () => {
    const state = makeState({
      emptyStatePlaca: 'FAIL001',
      alertInfo: { type: 'error', message: 'no encontrado' },
    });
    const next = formReducer(state, { type: 'RETRY' });
    expect(next.emptyStatePlaca).toBeNull();
    expect(next.alertInfo).toBeNull();
  });

  // ---- CLEAR_ALERT ----
  it('CLEAR_ALERT only clears alertInfo', () => {
    const state = makeState({
      alertInfo: { type: 'success', message: 'ok' },
      emptyStatePlaca: 'STAYS',
      formVisible: true,
    });
    const next = formReducer(state, { type: 'CLEAR_ALERT' });
    expect(next.alertInfo).toBeNull();
    expect(next.emptyStatePlaca).toBe('STAYS');
    expect(next.formVisible).toBe(true);
  });

  // ---- Unknown action returns same state ----
  it('unknown action returns state unchanged', () => {
    const next = formReducer(initialState, { type: 'UNKNOWN' } as unknown as FormAction);
    expect(next).toBe(initialState);
  });

  // ---- Immutability ----
  it('does not mutate the original state', () => {
    const state = makeState({ valores: ['a', 'b', 'c'] });
    const next = formReducer(state, {
      type: 'VALOR_CHANGE',
      index: 0,
      value: 'X',
      idASede: {},
      sedeAId: {},
    });
    expect(state.valores[0]).toBe('a');
    expect(next.valores[0]).toBe('X');
    expect(next.valores).not.toBe(state.valores);
  });
});
