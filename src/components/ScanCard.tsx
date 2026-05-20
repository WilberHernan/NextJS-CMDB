"use client";

import { useRef, useCallback, useState } from "react";
import { Scan, Camera, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/Loader";

interface ScanCardProps {
  scanMode: "scanner" | "camera";
  loading: boolean;
  onSwitchMode: (mode: "scanner" | "camera") => void;
  onScan: (text: string) => void;
  onFileScan: (file: File) => void;
}

export function ScanCard({
  scanMode,
  loading,
  onSwitchMode,
  onScan,
  onFileScan,
}: ScanCardProps) {
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    },
    [onFileScan]
  );

  return (
    <section className="relative text-center rounded-3xl glass border-border-default p-8 sm:p-9 overflow-hidden">
      <div className="absolute top-0 left-[15%] right-[15%] h-[1.5px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight relative z-10">
        Escanea la placa del equipo
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-7 relative z-10">
        {scanMode === "scanner"
          ? "Posiciona el cursor en el campo y escanea la placa con el lector."
          : "Apunta a la placa, toca el botón y saca la foto."}
      </p>

      <div className="flex gap-3 justify-center mb-6 relative z-10">
        <button
          type="button"
          onClick={() => onSwitchMode("scanner")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            "shadow-neu border border-border-subtle",
            scanMode === "scanner"
              ? "bg-accent/10 text-accent border-accent/25 shadow-neu-pressed"
              : "bg-surface-elevated text-muted-foreground hover:text-foreground hover:-translate-y-0.5"
          )}
        >
          <Scan className="h-[18px] w-[18px]" />
          <span>Lector</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode("camera")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            "shadow-neu border border-border-subtle",
            scanMode === "camera"
              ? "bg-accent/10 text-accent border-accent/25 shadow-neu-pressed"
              : "bg-surface-elevated text-muted-foreground hover:text-foreground hover:-translate-y-0.5"
          )}
        >
          <Camera className="h-[18px] w-[18px]" />
          <span>Cámara</span>
        </button>
      </div>

      {scanMode === "scanner" ? (
        <div
          className={cn(
            "relative max-w-lg mx-auto rounded-2xl p-[2px] transition-all duration-200",
            "bg-gradient-to-r from-accent via-sena-green-light to-accent bg-[length:400%_400%] animate-gradient-shift",
            scanning
              ? "opacity-100 shadow-lg shadow-sena-glow"
              : "opacity-85 hover:opacity-100"
          )}
        >
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
              "absolute bottom-[3px] left-[15%] right-[15%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-accent to-transparent",
              "transition-opacity duration-300",
              scanning && "opacity-60 animate-scan-pulse"
            )}
          />
        </div>
      ) : (
        <div className="relative z-10">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2.5 px-9 py-4 text-base font-bold rounded-2xl bg-surface-input text-foreground shadow-neu border border-border-subtle hover:bg-surface-hover transition-all duration-200 active:scale-[0.98]"
          >
            <Camera className="h-5 w-5" />
            <span>Tomar foto del código de barras</span>
          </button>
        </div>
      )}

      {loading && <Loader />}
    </section>
  );
}
