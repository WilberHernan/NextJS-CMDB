"use client";

import { useRef, useCallback, useState } from "react";
import { Scan, Camera, Search, ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";
import { Loader } from "@/components/Loader";

interface ScanCardProps {
  scanMode: "scanner" | "camera";
  loading: boolean;
  cameraStatus: string;
  cameraReady: boolean;
  onSwitchMode: (mode: "scanner" | "camera") => void;
  onScan: (text: string) => void;
  onFileScan: (file: File) => void;
}

export function ScanCard({
  scanMode,
  loading,
  cameraStatus,
  cameraReady,
  onSwitchMode,
  onScan,
  onFileScan,
}: ScanCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScannerMode = useCallback(() => {
    onSwitchMode("scanner");
  }, [onSwitchMode]);

  const handleCameraMode = useCallback(() => {
    onSwitchMode("camera");
  }, [onSwitchMode]);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      clearTimeout(typingTimerRef.current);
      const val = e.target.value;
      if (val.length > 0) {
        typingTimerRef.current = setTimeout(() => onScan(val), 400);
      }
    },
    [onScan]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        clearTimeout(typingTimerRef.current);
        onScan((e.target as HTMLInputElement).value);
      }
    },
    [onScan]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileScan(file);
      e.target.value = "";
    },
    [onFileScan]
  );

  return (
    <section className="relative text-center rounded-3xl glass border-border-default p-8 sm:p-9 overflow-hidden">
      <h2 className="font-display text-[1.625rem] sm:text-[1.75rem] font-semibold text-foreground mb-2 tracking-display-tight relative z-10">
        Escanea la placa del equipo
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-7 relative z-10 text-balance">
        {scanMode === "scanner"
          ? "Posiciona el cursor en el campo y escanea la placa con el lector."
          : "Sacá una foto clara a la placa del equipo."}
      </p>

      <div className="flex gap-3 justify-center mb-6 relative z-10">
        <button
          type="button"
          onClick={handleScannerMode}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-cinematic",
            "shadow-neu border border-border-default",
            scanMode === "scanner"
              ? "bg-accent-soft text-accent border-border-accent shadow-neu-pressed"
              : "bg-surface-elevated text-muted-foreground hover:text-foreground hover:-translate-y-0.5"
          )}
        >
          <Scan className="h-[18px] w-[18px]" />
          <span>Lector</span>
        </button>
        <button
          type="button"
          onClick={handleCameraMode}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-cinematic",
            "shadow-neu border border-border-default",
            scanMode === "camera"
              ? "bg-accent-soft text-accent border-border-accent shadow-neu-pressed"
              : "bg-surface-elevated text-muted-foreground hover:text-foreground hover:-translate-y-0.5"
          )}
        >
          <Camera className="h-[18px] w-[18px]" />
          <span>Cámara</span>
        </button>
      </div>

      {/* === SCANNER MODE (input field) ===
          - No animated gradients. The native blinking caret IS the scanner signal.
          - Focus uses a thin, solid border + soft ring (functional, not decorative). */}
      {scanMode === "scanner" && (
        <div className="relative max-w-lg mx-auto group">
          <div
            className={cn(
              // Scanner field sits between inputs (10px) and containers (16-24px)
              // at 12px — same radius as the buttons/chips tier, so it reads as
              // "the main interactive surface" without feeling like a pill.
              "relative flex items-center rounded-xl bg-surface-input",
              "border border-border-default",
              "shadow-neu-pressed",
              "transition-all duration-200 ease-cinematic",
              "group-focus-within:border-accent group-focus-within:shadow-[var(--focus-ring)]"
            )}
          >
            <Search
              className={cn(
                "absolute left-5 h-[18px] w-[18px] text-muted-foreground pointer-events-none",
                "transition-colors duration-200",
                "group-focus-within:text-accent"
              )}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Esperando lectura del escáner…"
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "w-full bg-transparent py-[18px] pl-14 pr-5",
                "text-base font-semibold font-mono tracking-wide text-foreground",
                "placeholder:text-muted-foreground-60 placeholder:font-normal placeholder:font-sans placeholder:tracking-normal",
                "outline-none"
              )}
            />
          </div>

          {/* Single, intentional status line — replaces the animated gradient.
              Reuses the same SENA-green as a "ready" indicator (only when focused + empty). */}
          <div
            className={cn(
              "mt-3 flex items-center justify-center gap-2",
              "text-[0.6875rem] font-medium uppercase tracking-display-loose",
              "text-muted-foreground-60",
              "transition-colors duration-200",
              "group-focus-within:text-accent"
            )}
          >
            <span
              className={cn(
                "inline-block h-[5px] w-[5px] rounded-full bg-accent",
                "transition-opacity duration-200",
                "opacity-40 group-focus-within:opacity-100"
              )}
              aria-hidden
            />
            Listo para escanear
          </div>
        </div>
      )}

      {/* === CAMERA MODE (native camera / photo upload) === */}
      <div className={cn("relative z-10", scanMode !== "camera" && "hidden")}>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            className={cn(
              "relative mx-auto max-w-md rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ease-cinematic",
              cameraReady
                ? "border-border-accent bg-accent-muted"
                : "border-border-default bg-surface-elevated",
              "min-h-[240px] flex flex-col items-center justify-center gap-4"
            )}
          >
            {cameraReady ? (
              <>
                <div className="rounded-full bg-accent-soft p-3">
                  <CheckCircle2 className="h-10 w-10 text-accent" />
                </div>
                <p className="text-base font-semibold text-foreground">
                  Código detectado
                </p>
                <p className="text-sm text-muted-foreground font-mono tracking-wide">
                  {cameraStatus}
                </p>
                <GradientButton
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Camera className="h-4 w-4" />}
                >
                  Leer otra placa
                </GradientButton>
              </>
            ) : (
              <>
                <div className="rounded-full bg-surface-input p-4">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Tomá una foto clara de la placa
                  </p>
                  <p className="text-xs text-muted-foreground">
                    La foto se analizará automáticamente
                  </p>
                </div>
                <GradientButton
                  variant="primary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<ImageIcon className="h-5 w-5" />}
                >
                  Tomar foto
                </GradientButton>

                {cameraStatus && (
                  <p className="text-xs text-warning max-w-xs">{cameraStatus}</p>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>O</span>
            <button
              type="button"
              onClick={() => {
                const input = fileInputRef.current;
                if (input) {
                  input.removeAttribute("capture");
                  input.click();
                  input.setAttribute("capture", "environment");
                }
              }}
              className="underline hover:text-foreground transition-colors"
            >
              Elegir desde la galería
            </button>
          </div>
        </div>
      </div>

      {loading && <Loader />}
    </section>
  );
}
