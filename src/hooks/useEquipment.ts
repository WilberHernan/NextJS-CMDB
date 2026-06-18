'use client';

import { useState, useCallback } from 'react';
import { useSede } from '@/contexts/sede-context';
import { type Sede } from '@/lib/sedes';
import type {
  EquipoResponse,
  EquipmentValue,
  ApiResult,
  MapeoSedeId,
} from '@/types/equipment';

interface UseEquipmentReturn {
  loading: boolean;
  error: string | null;
  result: EquipoResponse | null;
  validaciones: Record<number, string[]>;
  mapeoSedeId: MapeoSedeId;
  buscar: (placa: string) => Promise<EquipoResponse | null>;
  actualizar: (
    fila: string,
    hoja: string,
    valores: EquipmentValue[]
  ) => Promise<ApiResult | null>;
  crear: (
    hoja: string,
    valores: EquipmentValue[]
  ) => Promise<ApiResult | null>;
  cargarValidaciones: () => Promise<void>;
  cargarMapeoSede: () => Promise<void>;
}

export function useEquipment (): UseEquipmentReturn {
  const { sede } = useSede();
  const currentSede: Sede = sede ?? 'CCYS';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EquipoResponse | null>(null);
  const [validaciones, setValidaciones] = useState<Record<number, string[]>>(
    {}
  );
  const [mapeoSedeId, setMapeoSedeId] = useState<MapeoSedeId>({
    sedeAId: {},
    idASede: {},
  });

  const buscar = useCallback(async (placa: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/equipos/buscar?placa=${encodeURIComponent(placa)}&sede=${currentSede}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const data = json.data as EquipoResponse | null;
      setResult(data);
      if (data) {
        setValidaciones(data.validaciones);
        setMapeoSedeId(data.mapeoSedeId);
      }
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al buscar equipo';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentSede]);

  const actualizar = useCallback(
    async (fila: string, hoja: string, valores: EquipmentValue[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/equipos/actualizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fila, hoja, valores, sede: currentSede }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        return json.data as ApiResult;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error al actualizar equipo';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [currentSede]
  );

  const crear = useCallback(async (hoja: string, valores: EquipmentValue[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/equipos/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoja, valores, sede: currentSede }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      return json.data as ApiResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al crear equipo';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentSede]);

  const cargarValidaciones = useCallback(async () => {
    try {
      const res = await fetch(`/api/validaciones?sede=${currentSede}`);
      const json = await res.json();
      if (json.ok) setValidaciones(json.data);
    } catch {
      // Silently use defaults — fallback sin validaciones no bloquea al usuario
    }
  }, [currentSede]);

  const cargarMapeoSede = useCallback(async () => {
    try {
      const res = await fetch(`/api/mapeo-sede?sede=${currentSede}`);
      const json = await res.json();
      if (json.ok) setMapeoSedeId(json.data);
    } catch {
      // Silently use defaults — fallback sin mapeo no bloquea al usuario
    }
  }, [currentSede]);

  return {
    loading,
    error,
    result,
    validaciones,
    mapeoSedeId,
    buscar,
    actualizar,
    crear,
    cargarValidaciones,
    cargarMapeoSede,
  };
}
