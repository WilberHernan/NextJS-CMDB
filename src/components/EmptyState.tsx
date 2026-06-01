"use client";

import { Search, Plus, HelpCircle } from "lucide-react";

interface EmptyStateProps {
  placa: string;
  onRetry: () => void;
  onRegisterNew: () => void;
}

export function EmptyState({ placa, onRetry, onRegisterNew }: EmptyStateProps) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-visual">
        <div className="empty-state-icon-wrap">
          <div className="empty-state-icon-inner">
            <Search className="h-[34px] w-[34px] stroke-[1.8]" />
          </div>
          <div className="empty-state-badge">
            <HelpCircle className="h-[18px] w-[18px] stroke-[2.5]" />
          </div>
        </div>
      </div>

      <h2 className="empty-state-title">Equipo no encontrado</h2>
      <p className="empty-state-desc">
        La placa{" "}
        <span className="empty-state-placa">{placa}</span>{" "}
        no existe en la base de datos.
        <br />
        Verificá que esté bien escaneada o registrá el equipo como nuevo.
      </p>

      <div className="empty-state-actions">
        <button type="button" className="empty-state-btn" onClick={onRetry}>
          <Search className="h-[18px] w-[18px] stroke-[2]" />
          Escanear otra placa
        </button>
        <button
          type="button"
          className="empty-state-btn empty-state-btn-primary"
          onClick={onRegisterNew}
        >
          <Plus className="h-[18px] w-[18px] stroke-[2]" />
          Registrar nuevo
        </button>
      </div>
    </div>
  );
}
