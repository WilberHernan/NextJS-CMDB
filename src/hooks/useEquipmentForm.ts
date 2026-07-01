'use client';

import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { useEquipment } from '@/hooks/useEquipment';
import {
  COLUMNAS,
  DEFAULT_NUEVO_EQUIPO,
  type EquipmentValue,
  type ApiResult,
} from '@/types/equipment';
import { findMatchingOption, sanitizarPlaca } from '@/lib/utils';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface AlertInfo {
  type: AlertType;
  message: string;
}

export type BadgeVariant = 'default' | 'blue' | 'secondary';

export interface UseEquipmentFormReturn {
  // Equipment data hook
  loading: boolean;
  validaciones: Record<number, string[]>;
  mapeoSedeId: { sedeAId: Record<string, string>; idASede: Record<string, string> };

  // Form state
  valores: string[];
  esModoNuevo: boolean;
  hojaActual: string;
  filaActual: string;
  formVisible: boolean;
  saving: boolean;
  emptyStatePlaca: string | null;
  alertInfo: AlertInfo | null;
  /** True right after a successful scan — used to change the
   *  "Listo para escanear" text instead of showing a separate alert card. */
  equipmentFound: boolean;

  // Derived
  validacionesIndices: number[];
  hojaBadgeText: string;
  hojaBadgeVariant: BadgeVariant;

  /** Increments after a successful save — use as key={searchResetKey}
   *  on ScannerSection to reset the search input. */
  searchResetKey: number;

  // Actions
  handleScan: (placa: string) => Promise<void>;
  handleModoNuevo: (placa: string) => void;
  handleValorChange: (index: number, value: string) => void;
  handleGuardar: () => Promise<void>;
  handleRetry: () => void;
  clearAlert: () => void;
}

// ---------------------------------------------------------------------------
// Reducer — single source of truth for all form state
// ---------------------------------------------------------------------------

interface FormState {
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

type FormAction =
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

const initialState: FormState = {
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

function formReducer (state: FormState, action: FormAction): FormState {
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Encapsulates ALL form/business logic for the equipment page:
 *  - Equipment lookup
 *  - New equipment creation flow
 *  - URL-param auto-fill (from the local PS1 script)
 *  - Bidirectional ID<->Name sede sync
 *  - Save (create or update) with auto-move between sheets
 *
 * page.tsx should consume this hook and render UI only.
 */
export function useEquipmentForm (): UseEquipmentFormReturn {
  const {
    loading,
    validaciones,
    buscar,
    actualizar,
    crear,
    cargarValidaciones,
    cargarMapeoSede,
    mapeoSedeId,
  } = useEquipment();

  const [state, dispatch] = useReducer(formReducer, initialState);

  // Destructure for ergonomic access + stable useMemo deps
  const {
    valores,
    esModoNuevo,
    hojaActual,
    filaActual,
    formVisible,
    saving,
    searchResetKey,
    emptyStatePlaca,
    alertInfo,
    equipmentFound,
  } = state;

  /** Ref mirror so async handlers read latest state without
   *  re-creating their useCallback on every state change. */
  const stateRef = useRef(state);
  stateRef.current = state;

  /** Preserves the original propietario value to detect "will move"
   *  badge state. Not rendering state — kept in a ref. */
  const propietarioOriginalRef = useRef<string>('');

  /** Tracks the most recent search to cancel stale async responses. */
  const latestSearchRef = useRef<string>('');

  // Initial data load
  useEffect(() => {
    cargarValidaciones();
    cargarMapeoSede();
  }, [cargarValidaciones, cargarMapeoSede]);

  const validacionesIndices = useMemo(
    () => Object.keys(validaciones).map(Number),
    [validaciones]
  );

  // URL-param auto-fill (from local PS1 inventory script)
  const urlParamsRef = useRef(false);
  useEffect(() => {
    if (urlParamsRef.current) return;
    if (Object.keys(validaciones).length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const modo = params.get('modo');
    const placa = params.get('placa');
    if (modo !== 'nuevo' || !placa) return;

    const mapeo: Record<string, number> = {
      hostname: 0,
      marca: 3,
      modelo: 4,
      serial: 5,
      placa: 6,
      procesador: 16,
      disco1_tipo: 17,
      disco1_tam: 18,
      disco2_tipo: 19,
      disco2_tam: 20,
      tipo_memoria: 21,
      ram: 22,
      video: 23,
      mac_cableada: 31,
      mac_wifi: 32,
      so: 33,
      version_so: 34,
      fecha_mantenimiento: 47,
      fecha_impacto: 48,
      propietario: 2,
      ciudad: 9,
    };

    const nuevos = Array(COLUMNAS.length).fill('');
    Object.entries(DEFAULT_NUEVO_EQUIPO).forEach(([idx, val]) => {
      nuevos[parseInt(idx)] = val;
    });

    for (const [key, idx] of Object.entries(mapeo)) {
      const val = params.get(key);
      if (!val) continue;
      const upperVal = val.toString().toUpperCase().trim();
      const opts = validaciones[idx];
      nuevos[idx] = opts?.length ? (findMatchingOption(upperVal, opts) || upperVal) : upperVal;
    }

    nuevos[6] = sanitizarPlaca(placa);
    dispatch({ type: 'URL_PARAMS', valores: nuevos });

    window.history.replaceState({}, '', window.location.pathname);
    urlParamsRef.current = true;
  }, [validaciones]);

  // Compute the target sheet (SENA vs Telefonica) based on propietario
  const getHojaDestino = useCallback(
    (propietario: string) =>
      propietario === 'TELEFONICA' ? 'EquiposTelefonica' : 'EquiposSena',
    []
  );

  // Derived: badge text and variant
  const hojaBadgeText = useMemo(() => {
    if (esModoNuevo) return 'NUEVO EQUIPO';
    if (!formVisible || !hojaActual) return '';

    const propValue = (valores[2] || '').toUpperCase().trim();
    const hojaDestino = getHojaDestino(propValue);

    if (
      hojaDestino !== hojaActual &&
      propietarioOriginalRef.current &&
      propValue !== propietarioOriginalRef.current
    ) {
      return `Se moverá a: ${hojaDestino}`;
    }
    return `${hojaActual} · Fila ${filaActual}`;
  }, [esModoNuevo, formVisible, hojaActual, filaActual, valores, getHojaDestino]);

  const hojaBadgeVariant: BadgeVariant =
    esModoNuevo || hojaBadgeText.startsWith('Se moverá') ? 'blue' : 'default';

  // ---- Handlers ----

  const handleScan = useCallback(
    async (placa: string) => {
      const clean = sanitizarPlaca(placa.trim());
      if (!clean) return;

      latestSearchRef.current = clean;
      dispatch({ type: 'SCAN_START' });

      let data;
      try {
        data = await buscar(clean);
      } catch {
        if (latestSearchRef.current !== clean) return;
        dispatch({
          type: 'SCAN_ERROR',
          message: 'Error de conexión al buscar el equipo. Intentá de nuevo.',
        });
        return;
      }

      if (latestSearchRef.current !== clean) return;

      if (!data) {
        dispatch({ type: 'SCAN_NOT_FOUND', placa: clean });
        return;
      }

      propietarioOriginalRef.current = (data.valores[2] || '')
        .toString()
        .toUpperCase()
        .trim();

      dispatch({
        type: 'SCAN_SUCCESS',
        valores: [...data.valores],
        hoja: data.hoja,
        fila: String(data.fila),
      });
    },
    [buscar]
  );

  const handleModoNuevo = useCallback(
    (placa: string) => {
      const nuevos = Array(COLUMNAS.length).fill('');
      Object.entries(DEFAULT_NUEVO_EQUIPO).forEach(([idx, val]) => {
        nuevos[parseInt(idx)] = val;
      });
      nuevos[6] = placa.toUpperCase();

      validacionesIndices.forEach((idx) => {
        const opts = validaciones[idx] || [];
        if (opts.length === 0) return;
        const match = findMatchingOption(nuevos[idx] || '', opts);
        if (match) nuevos[idx] = match;
      });

      dispatch({ type: 'MODO_NUEVO', valores: nuevos });
    },
    [validaciones, validacionesIndices]
  );

  const handleValorChange = useCallback(
    (index: number, value: string) => {
      dispatch({
        type: 'VALOR_CHANGE',
        index,
        value,
        idASede: mapeoSedeId.idASede,
        sedeAId: mapeoSedeId.sedeAId,
      });
    },
    [mapeoSedeId]
  );

  const handleGuardar = useCallback(async () => {
    const current = stateRef.current;
    const isModoNuevo = current.esModoNuevo;
    const verb = isModoNuevo ? 'registrado' : 'actualizado';

    dispatch({
      type: 'SAVE_START',
      message: isModoNuevo
        ? 'Registrando nuevo equipo en CMDB...'
        : 'Sincronizando con CMDB, por favor espere...',
    });

    const valoresLimpios: EquipmentValue[] = current.valores.map((v, i) => {
      // Observaciones (index 50) preserves original case — free text field
      if (i === 50) return v.replace(/'/g, '-');
      return v.replace(/'/g, '-').toUpperCase();
    });

    let respuesta: ApiResult | null = null;

    try {
      if (isModoNuevo) {
        const hojaDestino = getHojaDestino(valoresLimpios[2] || '');
        respuesta = await crear(hojaDestino, valoresLimpios);
      } else {
        respuesta = await actualizar(current.filaActual, current.hojaActual, valoresLimpios);
      }
    } catch {
      dispatch({
        type: 'SAVE_ERROR',
        message: 'Error de conexión al guardar. Intentá de nuevo.',
      });
      return;
    }

    if (respuesta?.exito) {
      dispatch({ type: 'SAVE_SUCCESS', message: respuesta.mensaje });
    } else {
      dispatch({
        type: 'SAVE_FAILURE',
        message: `Error al ${verb}: ${respuesta?.mensaje || 'Error desconocido'}`,
      });
    }
  }, [crear, actualizar, getHojaDestino]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  /** Clear current alert (used for auto-dismiss). */
  const clearAlert = useCallback(() => dispatch({ type: 'CLEAR_ALERT' }), []);

  return {
    loading,
    validaciones,
    mapeoSedeId,
    valores,
    esModoNuevo,
    hojaActual,
    filaActual,
    formVisible,
    saving,
    emptyStatePlaca,
    alertInfo,
    searchResetKey,
    equipmentFound,
    validacionesIndices,
    hojaBadgeText,
    hojaBadgeVariant,
    handleScan,
    handleModoNuevo,
    handleValorChange,
    handleGuardar,
    handleRetry,
    clearAlert,
  };
}
