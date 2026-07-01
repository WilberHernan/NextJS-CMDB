import {
  COLUMNAS,
  type EquipmentValue,
} from '@/types/equipment';
import type { AlertInfo } from '@/hooks/useEquipmentForm';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface FormState {
  valores: string[];
  esModoNuevo: boolean;
  hojaActual: string;
  filaActual: string;
  formVisible: boolean;
  saving: boolean;
  searchResetKey: number;
  emptyStatePlaca: string | null;
  alertInfo: AlertInfo | null;
  equipmentFound: boolean;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type FormAction =
  | { type: 'SCAN_START' }
  | { type: 'SCAN_ERROR'; message: string }
  | { type: 'SCAN_NOT_FOUND'; placa: string }
  | { type: 'SCAN_SUCCESS'; valores: string[]; hoja: string; fila: string }
  | { type: 'MODO_NUEVO'; valores: string[] }
  | { type: 'VALOR_CHANGE'; index: number; value: string; idASede: Record<string, string>; sedeAId: Record<string, string> }
  | { type: 'URL_PARAMS'; valores: string[] }
  | { type: 'SAVE_START'; message: string }
  | { type: 'SAVE_ERROR'; message: string }
  | { type: 'SAVE_SUCCESS'; message: string }
  | { type: 'SAVE_FAILURE'; message: string }
  | { type: 'RETRY' }
  | { type: 'CLEAR_ALERT' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export const initialState: FormState = {
  valores: Array(COLUMNAS.length).fill(''),
  esModoNuevo: false,
  hojaActual: '',
  filaActual: '',
  formVisible: false,
  saving: false,
  searchResetKey: 0,
  emptyStatePlaca: null,
  alertInfo: null,
  equipmentFound: false,
};

export function formReducer (state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SCAN_START':
      return {
        ...state,
        alertInfo: null,
        emptyStatePlaca: null,
        equipmentFound: false,
      };

    case 'SCAN_ERROR':
      return {
        ...state,
        alertInfo: { type: 'error', message: action.message },
      };

    case 'SCAN_NOT_FOUND':
      return {
        ...state,
        formVisible: false,
        emptyStatePlaca: action.placa,
      };

    case 'SCAN_SUCCESS':
      return {
        ...state,
        esModoNuevo: false,
        hojaActual: action.hoja,
        filaActual: action.fila,
        valores: action.valores,
        formVisible: true,
        equipmentFound: true,
      };

    case 'MODO_NUEVO':
      return {
        ...state,
        esModoNuevo: true,
        formVisible: true,
        emptyStatePlaca: null,
        valores: action.valores,
        alertInfo: null,
      };

    case 'VALOR_CHANGE': {
      const next = [...state.valores];
      next[action.index] = action.value;

      // Bidirectional sync: ID SEDE (7) <-> NOMBRE DE LA SEDE (8)
      if (action.index === 7 && action.idASede[action.value]) {
        next[8] = action.idASede[action.value];
      }
      if (action.index === 8 && action.sedeAId[action.value]) {
        next[7] = action.sedeAId[action.value];
      }

      return { ...state, valores: next };
    }

    case 'URL_PARAMS':
      return {
        ...state,
        valores: action.valores,
        esModoNuevo: true,
        formVisible: true,
        alertInfo: null,
      };

    case 'SAVE_START':
      return {
        ...state,
        saving: true,
        alertInfo: { type: 'info', message: action.message },
      };

    case 'SAVE_ERROR':
      return {
        ...state,
        saving: false,
        alertInfo: { type: 'error', message: action.message },
      };

    case 'SAVE_SUCCESS':
      return {
        ...state,
        saving: false,
        alertInfo: { type: 'success', message: action.message },
        formVisible: false,
        searchResetKey: state.searchResetKey + 1,
        esModoNuevo: false,
      };

    case 'SAVE_FAILURE':
      return {
        ...state,
        saving: false,
        alertInfo: { type: 'error', message: action.message },
      };

    case 'RETRY':
      return { ...state, emptyStatePlaca: null, alertInfo: null };

    case 'CLEAR_ALERT':
      return { ...state, alertInfo: null };

    default:
      return state;
  }
}

// Re-export for convenience so the hook can import from one place
export type { EquipmentValue };
