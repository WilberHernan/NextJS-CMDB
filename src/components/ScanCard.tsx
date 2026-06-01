"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Scan, Camera, Search, Image as ImageIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/Loader";
import { useScanner } from "@/hooks/useScanner";

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
  const [showImageFallback, setShowImageFallback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { startLiveScan, stopLiveScan, processScan } = useScanner(onScan);

  // Refs for live video
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveActiveRef = useRef(false);

  // Start/stop live scan when mode changes
  useEffect(() => {
    if (scanMode === "camera" && videoRef.current) {
      setShowImageFallback(false);
      startLiveScan(videoRef.current).catch(() => {});
    } else {
      if (liveActiveRef.current) {
        stopLiveScan().catch(() => {});
      }
    }

    return () => {
      if (liveActiveRef.current) {
        stopLiveScan().catch(() => {});
      }
    };
  }, [scanMode, startLiveScan, stopLiveScan]);

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

  const handleRetryCamera = useCallback(() => {
    if (videoRef.current) {
      startLiveScan(videoRef.current).catch(() => {});
    }
  }, [startLiveScan]);

  return (
    <section className="relative text-center rounded-3xl glass border-border-default p-8 sm:p-9 overflow-hidden">
      <div className="absolute top-0 left-[15%] right-[15%] h-[1.5px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight relative z-10">
        Escanea la placa del equipo
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-7 relative z-10">
        {scanMode === "scanner"
          ? "Posiciona el cursor en el campo y escanea la placa con el lector."
          : "Apuntá a la placa del equipo. La detección es automática."}
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
          {/* Glow blur ::before equivalent */}
          <div
            className={cn(
              "absolute inset-[-2px] rounded-[22px] transition-opacity duration-300 pointer-events-none",
              "bg-gradient-to-r from-accent via-sena-green-light to-accent bg-[length:400%_400%] animate-gradient-shift",
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
              "absolute bottom-[3px] left-[15%] right-[15%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-accent to-transparent",
              "transition-opacity duration-300",
              scanning && "opacity-60 animate-scan-pulse"
            )}
          />
        </div>
      ) : (
        <div className="relative z-10 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Live camera viewfinder */}
          <div
            className={cn(
              "relative mx-auto max-w-md overflow-hidden rounded-2xl",
              "bg-black/90 border border-border-default",
              "shadow-neu-pressed"
            )}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="block w-full aspect-[4/3] object-cover"
            />

            {/* Scanning overlay — reticle in the middle */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
              <div className="absolute inset-[12%]">
                <div className="relative w-full h-full">
                  {/* Corner brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-accent rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-accent rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-accent rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-accent rounded-br-md" />
                  {/* Scanning line */}
                  <div
                    className={cn(
                      "absolute left-[5%] right-[5%] h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent rounded-full",
                      cameraReady && "animate-scan-line"
                    )}
                    style={{ top: "50%" }}
                  />
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[90%]">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                  "bg-black/70 backdrop-blur-sm border border-white/10 text-white",
                  !cameraReady && "text-amber-300"
                )}
              >
                {cameraReady ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                ) : (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                )}
                <span className="truncate">{cameraStatus}</span>
              </div>
            </div>
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleRetryCamera}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                "bg-surface-elevated text-muted-foreground border border-border-default",
                "hover:text-foreground transition-colors"
              )}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar cámara
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                "bg-surface-elevated text-muted-foreground border border-border-default",
                "hover:text-foreground transition-colors"
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Subir imagen
            </button>
          </div>
        </div>
      )}

      {loading && <Loader />}
    </section>
  );
}
