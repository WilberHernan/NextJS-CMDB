"use client";

import { useCallback } from "react";
import { useScanner } from "@/hooks/useScanner";
import { ScanCard } from "@/components/ScanCard";

interface ScannerSectionProps {
  loading: boolean;
  onScan: (text: string) => void;
}

/**
 * Client-only wrapper that isolates @zxing/* from the server bundle.
 * Must be loaded via next/dynamic({ ssr: false }) from any parent.
 */
export function ScannerSection({ loading, onScan }: ScannerSectionProps) {
  const {
    scanMode,
    setScanMode,
    scanFile,
    stage,
    pendingValue,
    confirmPending,
    cancelPending,
  } = useScanner(onScan);

  const handleFileScan = useCallback(
    async (file: File) => {
      try {
        await scanFile(file);
      } catch {
        // status already set inside scanFile
      }
    },
    [scanFile]
  );

  return (
    <ScanCard
      scanMode={scanMode}
      loading={loading}
      onSwitchMode={setScanMode}
      onScan={onScan}
      onFileScan={handleFileScan}
      stage={stage}
      pendingValue={pendingValue}
      onConfirm={confirmPending}
      onCancel={cancelPending}
    />
  );
}
