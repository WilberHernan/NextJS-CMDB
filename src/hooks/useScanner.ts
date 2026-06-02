"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import {
  preprocessImage,
  tryDecodeBarcode,
  tryRotateAndDecode,
  tryOcrText,
} from "@/lib/imagePreprocess";

const HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E, BarcodeFormat.ITF, BarcodeFormat.CODABAR,
    BarcodeFormat.DATA_MATRIX, BarcodeFormat.PDF_417, BarcodeFormat.AZTEC,
  ]],
  [DecodeHintType.TRY_HARDER, true],
]);

export type ScanStage = "idle" | "preprocessing" | "decoding" | "ocr" | "done" | "error";

export interface UseScannerReturn {
  scanMode: "scanner" | "camera";
  cameraStatus: string;
  cameraReady: boolean;
  setScanMode: (mode: "scanner" | "camera") => void;
  processScan: (text: string) => string | null;
  scanFile: (file: File) => Promise<string | null>;
  setCameraStatus: (status: string) => void;
  stage: ScanStage;
  pendingValue: string | null;
  confirmPending: (override?: string) => string | null;
  cancelPending: () => void;
}

export function useScanner(onScan: (placa: string) => void): UseScannerReturn {
  const [scanMode, setScanMode] = useState<"scanner" | "camera">("scanner");
  const [cameraStatus, setCameraStatus] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [stage, setStage] = useState<ScanStage>("idle");
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const getReader = (): BrowserMultiFormatReader => {
    if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader(HINTS);
    return readerRef.current;
  };

  const processScan = (text: string): string | null => {
    const limpia = text.toString().replace(/'/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toUpperCase();
    if (limpia.length === 0) return null;
    onScanRef.current(limpia);
    return limpia;
  };

  const scanFile = async (file: File): Promise<string | null> => {
    setCameraStatus("Analizando imagen...");
    setCameraReady(false);
    setStage("preprocessing");
    try {
      const canvas = await preprocessImage(file);
      const reader = getReader();
      setStage("decoding");
      const direct = await tryDecodeBarcode(canvas, reader);
      const rotated = direct ? null : await tryRotateAndDecode(canvas, reader);
      let detected: string | null = direct ?? rotated;
      if (!detected) {
        setStage("ocr");
        const ocr = await tryOcrText(canvas);
        if (ocr) detected = ocr;
      }
      if (detected) {
        setPendingValue(detected);
        setStage("done");
        setCameraStatus(`Código detectado: ${detected}`);
        return detected;
      }
      setStage("error");
      setCameraStatus("No se detectó código. Intentá con más luz y la foto más de cerca.");
      setPendingValue(null);
      return null;
    } catch {
      setStage("error");
      setCameraStatus("Error al procesar la imagen. Intentá de nuevo.");
      setPendingValue(null);
      return null;
    }
  };

  const confirmPending = (override?: string): string | null => {
    const value = override ?? pendingValue;
    if (value === null) return null;
    const result = processScan(value);
    setCameraReady(result !== null);
    setStage("idle");
    setPendingValue(null);
    return result;
  };

  const cancelPending = (): void => {
    setStage("idle");
    setPendingValue(null);
    setCameraReady(false);
    setCameraStatus("");
  };

  return {
    scanMode, cameraStatus, cameraReady, setScanMode, processScan,
    scanFile, setCameraStatus, stage, pendingValue, confirmPending, cancelPending,
  };
}
