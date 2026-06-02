"use client";

import { useRef, useState, useEffect } from "react";
import { Scan, Camera, Search, ImageIcon, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradientButton } from "@/components/ui/gradient-button";
import { Loader } from "@/components/Loader";
import type { ScanStage } from "@/hooks/useScanner";

interface ScanCardProps {
  scanMode: "scanner" | "camera";
  loading: boolean;
  onSwitchMode: (mode: "scanner" | "camera") => void;
  onScan: (text: string) => void;
  onFileScan: (file: File) => void;
  stage: ScanStage;
  pendingValue: string | null;
  currentAttempt: string | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const STAGE_COPY: Record<Exclude<ScanStage, "idle" | "done" | "error">, string> = {
  preprocessing: "Preparando imagen...",
  decoding: "Leyendo código de barras...",
};

function isInProgress(stage: ScanStage): stage is Exclude<ScanStage, "idle" | "done" | "error"> {
  return stage === "preprocessing" || stage === "decoding";
}

export function ScanCard({
  scanMode,
  loading,
  onSwitchMode,
  onScan,
  onFileScan,
  stage,
  pendingValue,
  currentAttempt,
  onConfirm,
  onCancel,
}: ScanCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editedValue, setEditedValue] = useState("");

  useEffect(() => {
    if (pendingValue !== null) setEditedValue(pendingValue);
  }, [pendingValue]);

  const handleScannerMode = () => onSwitchMode("scanner");
  const handleCameraMode = () => onSwitchMode("camera");

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(typingTimerRef.current);
    const val = e.target.value;
    if (val.length > 0) {
      typingTimerRef.current = setTimeout(() => onScan(val), 400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(typingTimerRef.current);
      onScan((e.target as HTMLInputElement).value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileScan(file);
    e.target.value = "";
  };

  const triggerCamera = () => fileInputRef.current?.click();
  const triggerGallery = () => {
    const input = fileInputRef.current;
    if (input) {
      input.removeAttribute("capture");
      input.click();
      input.setAttribute("capture", "environment");
    }
  };

  const handleConfirm = () => {
    if (editedValue.trim().length === 0) return;
    onConfirm(editedValue);
  };

  const handleRescan = () => {
    setEditedValue("");
    onCancel();
  };

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

      {scanMode === "scanner" && (
        <div className="relative max-w-lg mx-auto group">
          <div
            className={cn(
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
                "text-base font-semibold text-foreground",
                "placeholder:text-muted-foreground-60 placeholder:font-normal placeholder:font-sans",
                "outline-none"
              )}
            />
          </div>

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

          {stage === "done" && pendingValue !== null ? (
            <div
              className={cn(
                "relative mx-auto max-w-md rounded-xl p-5",
                "bg-success-soft border border-border-accent",
                "text-left"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-accent-soft p-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Código detectado
                </p>
              </div>
              <input
                type="text"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                placeholder="Placa detectada"
                className={cn(
                  "w-full bg-surface-input px-4 py-3 rounded-xl",
                  "border border-border-default",
                  "text-base font-semibold text-foreground",
                  "placeholder:text-muted-foreground-60 placeholder:font-normal",
                  "outline-none",
                  "transition-all duration-200 ease-cinematic",
                  "focus:border-accent focus:shadow-[var(--focus-ring)]"
                )}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Verificá el valor y corregilo si es necesario.
              </p>
              <div className="mt-4 flex gap-3">
                <GradientButton
                  variant="primary"
                  size="md"
                  onClick={handleConfirm}
                  disabled={editedValue.trim().length === 0}
                  className="flex-1"
                >
                  Confirmar
                </GradientButton>
                <button
                  type="button"
                  onClick={handleRescan}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                    "bg-surface-elevated text-muted-foreground hover:text-foreground",
                    "border border-border-default shadow-neu",
                    "transition-all duration-200 ease-cinematic",
                    "hover:-translate-y-0.5"
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-sm font-semibold">Re-escanear</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "relative mx-auto max-w-md rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ease-cinematic",
                stage === "error"
                  ? "border-danger bg-danger-soft"
                  : "border-border-default bg-surface-elevated",
                "min-h-[240px] flex flex-col items-center justify-center gap-4"
              )}
            >
              {isInProgress(stage) ? (
                <>
                  <div className="rounded-full bg-accent-soft p-4">
                    <div className="h-12 w-12 rounded-full border-4 border-accent-soft border-t-accent animate-spin-slow" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {STAGE_COPY[stage]}
                    </p>
                    <p className="text-xs text-muted-foreground min-h-[1.25rem]">
                      {stage === "decoding" && currentAttempt
                        ? `Probando ${currentAttempt}…`
                        : "Esto puede tardar unos segundos"}
                    </p>
                  </div>
                </>
              ) : stage === "error" ? (
                <>
                  <div className="rounded-full bg-danger-soft p-4">
                    <ImageIcon className="h-12 w-12 text-danger" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      No se pudo leer el código
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Asegúrate de que esté bien iluminado, enfocado y que el
                      código de barras sea visible.
                    </p>
                  </div>
                  <GradientButton
                    variant="primary"
                    size="md"
                    onClick={triggerCamera}
                    icon={<Camera className="h-5 w-5" />}
                  >
                    Reintentar
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
                    onClick={triggerCamera}
                    icon={<ImageIcon className="h-5 w-5" />}
                  >
                    Tomar foto
                  </GradientButton>
                </>
              )}
            </div>
          )}

          {stage !== "done" && (
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <span>O</span>
              <button
                type="button"
                onClick={triggerGallery}
                disabled={isInProgress(stage)}
                className={cn(
                  "underline hover:text-foreground transition-colors",
                  isInProgress(stage) && "opacity-50 pointer-events-none"
                )}
              >
                Elegir desde la galería
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <Loader />}
    </section>
  );
}
