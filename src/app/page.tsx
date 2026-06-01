"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/hooks/useTheme";
import { useEquipment } from "@/hooks/useEquipment";
import { Header } from "@/components/Header";
import { EquipmentForm } from "@/components/EquipmentForm";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { COLUMNAS, DEFAULT_NUEVO_EQUIPO } from "@/types/equipment";
import { findMatchingOption, sanitizarPlaca } from "@/lib/utils";

// ZXing is browser-only (uses navigator, MediaDevices). Dynamic import
// with ssr: false keeps it out of the server bundle.
const ScannerSection = dynamic(
  () =>
    import("@/components/ScannerSection").then((m) => m.ScannerSection),
  { ssr: false, loading: () => null }
);

type BadgeVariant = "default" | "blue" | "secondary";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
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

  const [valores, setValores] = useState<string[]>(
    Array(COLUMNAS.length).fill("")
  );
  const [esModoNuevo, setEsModoNuevo] = useState(false);
  const [hojaActual, setHojaActual] = useState("");
  const [filaActual, setFilaActual] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emptyStatePlaca, setEmptyStatePlaca] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  } | null>(null);
  const propietarioOriginalRef = useRef<string>("");

  // Stable callback to avoid scanner re-init loops
  const handleScan = useCallback(
    async (placa: string) => {
      setAlertInfo(null);
      setEmptyStatePlaca(null);

      const data = await buscar(placa);

      if (data) {
        setEsModoNuevo(false);
        setHojaActual(data.hoja);
        setFilaActual(String(data.fila));
        setValores([...data.valores]);
        propietarioOriginalRef.current = (
          data.valores[2] || ""
        ).toString().toUpperCase().trim();
        setFormVisible(true);
        setAlertInfo({
          type: "success",
          message: "Equipo encontrado correctamente.",
        });
      } else {
        setFormVisible(false);
        setEmptyStatePlaca(placa);
      }
    },
    [buscar]
  );

  const validacionesIndices = Object.keys(validaciones).map(Number);

  const hojaBadgeText = (() => {
    if (esModoNuevo) return "NUEVO EQUIPO";
    if (!formVisible || !hojaActual) return "";

    const propIndex = 2;
    const propValue = (valores[propIndex] || "").toUpperCase().trim();
    const hojaDestino =
      propValue === "TELEFONICA" ? "EquiposTelefonica" : "EquiposSena";

    if (
      hojaDestino !== hojaActual &&
      propietarioOriginalRef.current &&
      propValue !== propietarioOriginalRef.current
    ) {
      return `Se moverá a: ${hojaDestino}`;
    }
    return `${hojaActual} · Fila ${filaActual}`;
  })();

  const hojaBadgeVariant: BadgeVariant =
    esModoNuevo || hojaBadgeText.startsWith("Se moverá")
      ? "blue"
      : "default";

  useEffect(() => {
    cargarValidaciones();
    cargarMapeoSede();
  }, [cargarValidaciones, cargarMapeoSede]);

  const handleModoNuevo = useCallback(
    (placa: string) => {
      setEsModoNuevo(true);
      setFormVisible(true);
      setEmptyStatePlaca(null);

      const nuevos = Array(COLUMNAS.length).fill("");
      Object.entries(DEFAULT_NUEVO_EQUIPO).forEach(([idx, val]) => {
        nuevos[parseInt(idx)] = val;
      });
      nuevos[6] = placa.toUpperCase();

      validacionesIndices.forEach((idx) => {
        const opts = validaciones[idx] || [];
        if (opts.length > 0) {
          const match = findMatchingOption(nuevos[idx] || "", opts);
          if (match) nuevos[idx] = match;
        }
      });

      setValores(nuevos);
      setAlertInfo(null);
    },
    [validaciones, validacionesIndices]
  );

  const handleValorChange = useCallback(
    (index: number, value: string) => {
      setValores((prev) => {
        const next = [...prev];
        next[index] = value;

        // Sincronización ID SEDE (7) ↔ NOMBRE DE LA SEDE (8)
        // Cuando cambia ID SEDE, auto-completa NOMBRE DE LA SEDE
        if (index === 7 && mapeoSedeId.idASede[value]) {
          next[8] = mapeoSedeId.idASede[value];
        }
        // Cuando cambia NOMBRE DE LA SEDE, auto-completa ID SEDE
        if (index === 8 && mapeoSedeId.sedeAId[value]) {
          next[7] = mapeoSedeId.sedeAId[value];
        }

        return next;
      });
    },
    [mapeoSedeId]
  );

  const handleGuardar = useCallback(async () => {
    setSaving(true);
    setAlertInfo(null);

    const valoresLimpios = valores.map((v) =>
      typeof v === "string" ? v.replace(/'/g, "-").toUpperCase() : v
    );

    if (esModoNuevo) {
      const propietario = valoresLimpios[2] || "";
      const hojaDestino =
        propietario === "TELEFONICA" ? "EquiposTelefonica" : "EquiposSena";

      setAlertInfo({
        type: "info",
        message: "Registrando nuevo equipo en CMDB...",
      });

      const respuesta = await crear(hojaDestino, valoresLimpios);
      setSaving(false);

      if (respuesta?.exito) {
        setAlertInfo({ type: "success", message: respuesta.mensaje });
        setFormVisible(false);
        setEsModoNuevo(false);
      } else {
        setAlertInfo({
          type: "error",
          message: `Error al registrar: ${respuesta?.mensaje || "Error desconocido"}`,
        });
      }
    } else {
      setAlertInfo({
        type: "info",
        message: "Sincronizando con CMDB, por favor espere...",
      });

      const respuesta = await actualizar(
        filaActual,
        hojaActual,
        valoresLimpios
      );
      setSaving(false);

      if (respuesta?.exito) {
        setAlertInfo({ type: "success", message: respuesta.mensaje });
        setFormVisible(false);
      } else {
        setAlertInfo({
          type: "error",
          message: `Fallo en la base de datos: ${respuesta?.mensaje || "Error desconocido"}`,
        });
      }
    }
  }, [valores, esModoNuevo, crear, actualizar, filaActual, hojaActual]);

  const handleRetry = useCallback(() => {
    setEmptyStatePlaca(null);
    setAlertInfo(null);
  }, []);

  return (
    <div className="relative min-h-screen bg-surface-base">
      {/* Mesh background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-surface-base">
        <div
          className="absolute inset-0"
          style={{ background: "var(--grad-mesh)" }}
        />
      </div>

      {/* Glow orbs */}
      <div className="fixed top-[-100px] right-[-80px] w-[300px] h-[300px] rounded-full bg-sena-green/10 blur-[60px] pointer-events-none z-0" />
      <div className="fixed bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full bg-blue-500/10 blur-[60px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-8 py-5 sm:py-7 flex flex-col gap-5">
        <Header theme={theme} onToggleTheme={toggleTheme} />

        <ScannerSection loading={loading} onScan={handleScan} />

        {/* Status area */}
        <div className="min-h-[60px] flex items-center">
          {alertInfo && (
            <Alert type={alertInfo.type} message={alertInfo.message} />
          )}
        </div>

        {/* Empty state */}
        {emptyStatePlaca && (
          <EmptyState
            placa={emptyStatePlaca}
            onRetry={handleRetry}
            onRegisterNew={() => handleModoNuevo(emptyStatePlaca)}
          />
        )}

        {/* Equipment form */}
        <EquipmentForm
          visible={formVisible}
          esModoNuevo={esModoNuevo}
          hojaActual={hojaActual}
          filaActual={filaActual}
          hojaBadgeText={hojaBadgeText}
          hojaBadgeVariant={hojaBadgeVariant}
          valores={valores}
          validaciones={validaciones}
          validacionesIndices={validacionesIndices}
          onValorChange={handleValorChange}
          onGuardar={handleGuardar}
          saving={saving}
        />

        <footer className="text-center pt-6 pb-2 text-[10px] tracking-wider text-muted-foreground-60">
          CMDB SENA CCYS — Cauca 2026
        </footer>
      </div>
    </div>
  );
}
