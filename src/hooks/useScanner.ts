"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";

interface UseScannerReturn {
  scanMode: "scanner" | "camera";
  cameraStatus: string;
  cameraReady: boolean;
  setScanMode: (mode: "scanner" | "camera") => void;
  processScan: (text: string) => string | null;
  scanFile: (file: File) => Promise<string>;
  startLiveScan: (
    videoEl: HTMLVideoElement,
    deviceId?: string
  ) => Promise<void>;
  stopLiveScan: () => Promise<void>;
  listCameras: () => Promise<MediaDeviceInfo[]>;
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
  const [cameraStatus, setCameraStatus] = useState("Iniciando cámara...");
  const [cameraReady, setCameraReady] = useState(false);

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ text: string; ts: number } | null>(null);
  const onScanRef = useRef(onScan);

  // Keep the latest onScan callback without re-creating the reader
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const getReader = useCallback(() => {
    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader(HINTS, {
        delayBetweenScanAttempts: 80,
        delayBetweenScanSuccess: 350,
      });
    }
    return readerRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
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

  const handleResult = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      // Debounce: ignore the same code within 1.5s — live scanning reads the
      // same code many times in a row
      if (
        lastScanRef.current &&
        lastScanRef.current.text === decodedText &&
        now - lastScanRef.current.ts < 1500
      ) {
        return;
      }
      lastScanRef.current = { text: decodedText, ts: now };
      setCameraStatus(`Código detectado: ${decodedText}`);
      processScan(decodedText);
    },
    [processScan]
  );

  const startLiveScan = useCallback(
    async (videoEl: HTMLVideoElement, deviceId?: string) => {
      try {
        // Stop any previous stream first
        if (controlsRef.current) {
          await controlsRef.current.stop();
          controlsRef.current = null;
        }
        setCameraStatus("Solicitando permiso de cámara...");
        setCameraReady(false);

        const reader = getReader();
        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
          audio: false,
        };

        controlsRef.current = await reader.decodeFromConstraints(
          constraints,
          videoEl,
          (result, _err) => {
            if (result) {
              handleResult(result.getText());
            }
            // _err is expected on every frame that doesn't decode — ignore
          }
        );

        setCameraStatus("Apuntá a la placa del equipo");
        setCameraReady(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setCameraStatus(
          message.includes("Permission") || message.includes("NotAllowed")
            ? "Permiso de cámara denegado. Habilitalo en los ajustes del navegador."
            : message.includes("NotFound") || message.includes("Requested device not found")
            ? "No se encontró ninguna cámara en el dispositivo."
            : `Error de cámara: ${message}`
        );
        setCameraReady(false);
      }
    },
    [getReader, handleResult]
  );

  const stopLiveScan = useCallback(async () => {
    if (controlsRef.current) {
      try {
        await controlsRef.current.stop();
      } catch {
        // ignore — stream may already be closed
      }
      controlsRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const listCameras = useCallback(async () => {
    try {
      // Need to ask for permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      return devices;
    } catch {
      return [];
    }
  }, []);

  const scanFile = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        setCameraStatus("Analizando imagen...");

        const reader = getReader();
        const url = URL.createObjectURL(file);
        reader
          .decodeFromImageUrl(url)
          .then((result) => {
            URL.revokeObjectURL(url);
            const text = result.getText();
            setCameraStatus(`Código detectado: ${text}`);
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
    startLiveScan,
    stopLiveScan,
    listCameras,
    setCameraStatus,
  };
}
