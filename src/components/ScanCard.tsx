"use client";

import { useRef, useCallback, useState } from "react";
import { Scan, Camera, Search, ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [scanning, setScanning] = useState(false);
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
      // reset so the same file can be re-selected
      e.target.value = "";
    },
    [onFileScan]
  );

  return (
    <section className="relative text-center rounded-3xl glass border-border-default p-8 sm:p-9 overflow-hidden">
      <div className="absolute top-0 left-[15%] right-[15%] h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />

      <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight relative z-10">
        Escanea la placa del equipo
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-7 relative z-10">
        {scanMode === "scanner"
          ? "Posiciona el cursor en el campo y escanea la placa con el lector."
          : "Sacá una foto clara a la placa del equipo."}
      </p>

      <div className="flex gap-3 justify-center mb-6 relative z-10">
        <button
          type="button"
          onClick={handleScannerMode}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            "shadow-neu border border-border-subtle",
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
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            "shadow-neu border border-border-subtle",
            scanMode === "camera"
              ? "bg-accent-soft text-accent border-border-accent shadow-neu-pressed"
              : "bg-surface-elevated text-muted-foreground hover:text-foreground hover:-translate-y-0.5"
          )}
        >
          <Camera className="h-[18px] w-[18px]" />
          <span>Cámara</span>
        </button>
      </div>

      {/* === SCANNER MODE (input field) === */}
      {scanMode === "scanner" && (
        <div
          className={cn(
            "relative max-w-lg mx-auto rounded-2xl p-[2px] transition-all duration-200",
            "bg-gradient-to-r from-[var(--accent)] via-sena-green-light to-[var(--accent)] bg-[length:400%_400%] animate-gradient-shift",
            scanning
              ? "opacity-100 shadow-lg shadow-sena-glow"
              : "opacity-85 hover:opacity-100"
          )}
        >
          {/* Glow blur ::before equivalent */}
          <div
            className={cn(
              "absolute inset-[-2px] rounded-[22px] transition-opacity duration-300 pointer-events-none",
              "bg-gradient-to-r from-[var(--accent)] via-sena-green-light to-[var(--accent)] bg-[length:400%_400%] animate-gradient-shift",
              scanning ? "opacity-50" : "opacity-0"
            )}
            style={{ filter: "blur(8px)", zIndex: -1 }}
          />

          <div className="relative flex items-center rounded-[14px] bg-surface-input shadow-neu-pressed">
            <Search className="absolute left-5 h-[18px] w-[18px] text-muted-foreground pointer-events-none transition-all duration-300" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Esperando lectura del escáner..."
              onFocus={() => setScanning(true)}
              onBlur={() => setScanning(false)}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              className="w-full bg-transparent py-[18px] pl-14 pr-5 text-base font-semibold font-mono tracking-wide text-foreground placeholder:text-muted-foreground/60 placeholder:font-normal placeholder:font-sans placeholder:tracking-normal outline-none"
            />
          </div>
          <div
            className={cn(
              "absolute bottom-[3px] left-[15%] right-[15%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent",
              "transition-opacity duration-300",
              "opacity-60 animate-scan-pulse"
            )}
          />
        </div>
      )}

      {/* === CAMERA MODE (native camera / photo upload) === */}
      <div className={cn("relative z-10", scanMode !== "camera" && "hidden")}>
        <div className="space-y-4">
          {/* Hidden file input — capture="environment" opens the
              native camera on Android/iOS; on PC it falls through to
              the file picker. */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Photo area — icon + instructions */}
          <div
            className={cn(
              "relative mx-auto max-w-md rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300",
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-accent-25 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/10",
                    "text-white",
                    "hover:bg-accent-35 hover:-translate-y-0.5 active:bg-accent-45 active:translate-y-0",
                    "transition-all duration-200"
                  )}
                >
                  <Camera className="h-4 w-4" />
                  Leer otra placa
                </button>
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold",
                    "bg-accent-25 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/10",
                    "text-white",
                    "hover:bg-accent-35 hover:-translate-y-0.5 active:bg-accent-45 active:translate-y-0",
                    "transition-all duration-200"
                  )}
                >
                  <ImageIcon className="h-5 w-5" />
                  Tomar foto
                </button>

                {/* Status message (error / progress) */}
                {cameraStatus && (
                  <p className="text-xs text-amber-400 max-w-xs">
                    {cameraStatus}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Secondary fallback link */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span>O</span>
            <button
              type="button"
              onClick={() => {
                // Remove capture on mobile to browse gallery
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
