"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSede } from "@/contexts/sede-context";
import { isSede, type Sede } from "@/lib/sedes";
import { PasswordCard } from "@/components/PasswordCard";

type Stage = "loading" | "password" | "done";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>("loading");
  const [fade, setFade] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sede, setSede } = useSede();
  const [selectedSede, setSelectedSede] = useState<Sede>("CCYS");

  // Sync selectedSede from context once it resolves
  useEffect(() => {
    if (sede) setSelectedSede(sede);
  }, [sede]);

  // ── Init: auto-login from key → check auth → resolve stage ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const params = new URLSearchParams(window.location.search);
      const keyFromUrl = params.get("key");

      if (keyFromUrl) {
        try {
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: keyFromUrl }),
          });
        } catch {
          // Swallow — we'll check auth below
        }
      }

      // Check if authenticated
      try {
        const res = await fetch("/api/auth/check");
        if (res.ok && !cancelled) {
          finishAuth();
          return;
        }
      } catch {
        // Not authenticated — show password
      }

      if (!cancelled) {
        setStage("password");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Finish auth: set sede from URL or context, then done ──
  const finishAuth = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const sedeFromUrl = params.get("sede");

    if (isSede(sedeFromUrl)) {
      setSede(sedeFromUrl);
    }

    setStage("done");
    setFade(true);
    setTimeout(() => setMounted(false), 550);
  }, [setSede]);

  // ── Password submit ──
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password.trim()) {
        setError("Ingresá la contraseña");
        return;
      }
      setSubmitting(true);
      setError("");
      try {
        const r = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (r.ok) {
          setSede(selectedSede);
          setStage("done");
          setFade(true);
          setTimeout(() => setMounted(false), 550);
        } else {
          const d = await r.json();
          setError(d.error || "Contraseña incorrecta");
          setPassword("");
          inputRef.current?.focus();
        }
      } catch {
        setError("Error de conexión");
      } finally {
        setSubmitting(false);
      }
    },
    [password, selectedSede, setSede]
  );

  return (
    <>
      {children}

      {mounted && (
        <div
          className="fixed inset-0 z-[9999] transition-opacity duration-500 ease-out"
          style={{
            opacity: fade ? 0 : 1,
            pointerEvents: fade ? "none" : "auto",
          }}
        >
          {/* Blur backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              backgroundColor: "rgba(0,0,0,0.12)",
            }}
          />

          {/* Content container */}
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            {stage === "password" && (
              <PasswordCard
                password={password}
                setPassword={setPassword}
                error={error}
                setError={setError}
                submitting={submitting}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                selectedSede={selectedSede}
                setSelectedSede={setSelectedSede}
                onSubmit={handleSubmit}
                inputRef={inputRef}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
