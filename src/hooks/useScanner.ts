"use client";

import { useState, useCallback, useRef } from "react";

interface UseScannerReturn {
  scanMode: "scanner" | "camera";
  cameraStatus: string;
  setScanMode: (mode: "scanner" | "camera") => void;
  processScan: (text: string) => string | null;
  scanFile: (file: File) => Promise<string>;
  setCameraStatus: (status: string) => void;
}

export function useScanner(
  onScan: (placa: string) => void
): UseScannerReturn {
  const [scanMode, setScanMode] = useState<"scanner" | "camera">("scanner");
  const [cameraStatus, setCameraStatus] = useState(
    "Apunta a la placa, toca el botón y saca la foto"
  );

  const processScan = useCallback(
    (text: string) => {
      const limpia = text
        .toString()
        .replace(/'/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .toUpperCase();
      if (limpia.length === 0) return null;
      onScan(limpia);
      return limpia;
    },
    [onScan]
  );

  const scanFile = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        setCameraStatus("Analizando imagen...");

        import("html5-qrcode").then(({ Html5Qrcode }) => {
          const reader = new Html5Qrcode("camera-reader");
          reader
            .scanFile(file, true)
            .then((decodedText: string) => {
              setCameraStatus(
                `Código detectado: ${decodedText}! Buscando en BD...`
              );
              reader.clear();
              const limpia = processScan(decodedText);
              if (limpia) resolve(limpia);
              else reject(new Error("No se pudo procesar el código"));
            })
            .catch(() => {
              setCameraStatus(
                "No se detectó código. Intente tomar la foto más cerca y sin reflejos."
              );
              reject(new Error("No code detected"));
            });
        });
      });
    },
    [processScan]
  );

  return {
    scanMode,
    cameraStatus,
    setScanMode,
    processScan,
    scanFile,
    setCameraStatus,
  };
}
