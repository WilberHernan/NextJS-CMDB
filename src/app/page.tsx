"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/hooks/useTheme";
import { useEquipmentForm } from "@/hooks/useEquipmentForm";
import { Header } from "@/components/Header";
import { EquipmentForm } from "@/components/EquipmentForm";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";

// ZXing is browser-only (uses navigator, MediaDevices). Dynamic import
// with ssr: false keeps it out of the server bundle.
const ScannerSection = dynamic(
  () => import("@/components/ScannerSection").then((m) => m.ScannerSection),
  { ssr: false, loading: () => null }
);

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const form = useEquipmentForm();

  // Header bottom bar only fires on success — the user just found/registered
  // an equipment. Errors and info alerts don't trigger it.
  const isSuccess = form.alertInfo?.type === "success";

  return (
    <div className="relative min-h-screen bg-surface-base">
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-8 py-5 sm:py-7 flex flex-col gap-5">
        {/* Stagger mount: header → scanner → status → form.
            Each section fades+rises 80ms after the previous one. */}
        <div className="animate-stagger-1">
          <Header
            theme={theme}
            onToggleTheme={toggleTheme}
            highlightSuccess={isSuccess}
          />
        </div>

        <div className="animate-stagger-2">
          <ScannerSection loading={form.loading} onScan={form.handleScan} />
        </div>

        {/* Status area */}
        <div className="min-h-[60px] flex items-center px-1 animate-stagger-3">
          {form.alertInfo && (
            <Alert type={form.alertInfo.type} message={form.alertInfo.message} />
          )}
        </div>

        {/* Empty state */}
        {form.emptyStatePlaca && (
          <EmptyState
            placa={form.emptyStatePlaca}
            onRetry={form.handleRetry}
            onRegisterNew={() => form.handleModoNuevo(form.emptyStatePlaca!)}
          />
        )}

        {/* Equipment form */}
        {form.formVisible && (
          <div className="animate-stagger-4">
            <EquipmentForm
              visible={form.formVisible}
              esModoNuevo={form.esModoNuevo}
              hojaActual={form.hojaActual}
              filaActual={form.filaActual}
              hojaBadgeText={form.hojaBadgeText}
              hojaBadgeVariant={form.hojaBadgeVariant}
              valores={form.valores}
              validaciones={form.validaciones}
              validacionesIndices={form.validacionesIndices}
              onValorChange={form.handleValorChange}
              onGuardar={form.handleGuardar}
              saving={form.saving}
            />
          </div>
        )}

        <footer className="text-center pt-6 pb-2 text-[10px] tracking-display-loose uppercase text-muted-foreground-60">
          CMDB SENA CCYS — Cauca 2026
        </footer>
      </div>
    </div>
  );
}
