"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

interface UseScannerReturn {
  scanMode: "scanner" | "camera";
  cameraStatus: string;
  cameraReady: boolean;
  setScanMode: (mode: "scanner" | "camera") => void;
  processScan: (text: string) => string | null;
  scanFile: (file: File) => Promise<string>;
  setCameraStatus: (status: string) => void;
}

// All the formats CMDB SENA equipment plates might use:
// - Code128 (SENA asset tags, common in inventory)
// - Code39 (older industrial labels)
// - QR (sometimes printed on stickers)
// - EAN/UPC (vendor hardware labels)
const HINTS = new Map();
HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.PDF_417,
  BarcodeFormat.AZTEC,
]);
HINTS.set(DecodeHintType.TRY_HARDER, true);

export function useScanner(onScan: (placa: string) => void): UseScannerReturn {
  const [scanMode, setScanMode] = useState<"scanner" | "camera">("scanner");
  const [cameraStatus, setCameraStatus] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const onScanRef = useRef(onScan);

  // Keep the latest onScan callback
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const getReader = useCallback(() => {
    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader(HINTS);
    }
    return readerRef.current;
  }, []);

  const processScan = useCallback((text: string) => {
    const limpia = text
      .toString()
      .replace(/'/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .toUpperCase();
    if (limpia.length === 0) return null;
    onScanRef.current(limpia);
    return limpia;
  }, []);

  const scanFile = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        setCameraStatus("Analizando imagen...");
        setCameraReady(false);

        const reader = getReader();
        const url = URL.createObjectURL(file);
        reader
          .decodeFromImageUrl(url)
          .then((result) => {
            URL.revokeObjectURL(url);
            const text = result.getText();
            setCameraStatus(`Código detectado: ${text}`);
            setCameraReady(true);
            const limpia = processScan(text);
            if (limpia) resolve(limpia);
            else reject(new Error("No se pudo procesar el código"));
          })
          .catch(() => {
            URL.revokeObjectURL(url);
            setCameraStatus(
              "No se detectó código. Intentá con más luz y la foto más de cerca."
            );
            reject(new Error("No code detected"));
          });
      });
    },
    [getReader, processScan]
  );

  return {
    scanMode,
    cameraStatus,
    cameraReady,
    setScanMode,
    processScan,
    scanFile,
    setCameraStatus,
  };
}
