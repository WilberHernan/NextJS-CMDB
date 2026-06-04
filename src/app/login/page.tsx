"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Ingresá la contraseña");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Contraseña incorrecta");
        setPassword("");
        inputRef.current?.focus();
        return;
      }

      router.push(redirectTo);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      {/* Background atmosphere — same as the main app */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(57, 169, 0, 0.06) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div
        className={cn(
          "relative w-full max-w-sm rounded-3xl glass border-border-default p-9 sm:p-10",
          "animate-fade-in-up"
        )}
      >
        {/* Icon */}
        <div className="mb-7 flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-accent" strokeWidth={1.75} />
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-center text-[clamp(1.1rem,2.5vw,1.35rem)] font-bold tracking-[-0.02em] text-foreground mb-1"
          style={{ fontFamily: "var(--font-display-alt)" }}
        >
          Acceso restringido
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-8 text-balance">
          Ingresá la contraseña para acceder al CMDB
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="password"
              className="block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2"
            >
              Contraseña
            </label>
            <input
              ref={inputRef}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className={cn(
                "flex w-full rounded-xl border bg-surface-input px-4 py-3",
                "text-sm text-foreground placeholder:text-muted-foreground-60",
                "shadow-neu-pressed hover:border-border-hover",
                "focus:border-accent focus:shadow-[var(--focus-ring)] focus:outline-none",
                "transition-all duration-200 ease-cinematic font-sans",
                error ? "border-red-500/50" : "border-border-default"
              )}
            />
            {error && (
              <p className="mt-2 text-[0.8125rem] text-red-400 font-medium">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold",
              "transition-all duration-200 ease-cinematic outline-none font-sans",
              "bg-accent-soft text-accent border border-border-accent shadow-neu-pressed",
              "hover:-translate-y-0.5 hover:shadow-neu-flat",
              "active:translate-y-0 active:shadow-neu-pressed",
              "disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-neu-pressed"
            )}
          >
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
