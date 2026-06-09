import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthGate } from "@/components/AuthGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

/* ── Inline script to prevent dark-mode flash ────────────────
 * Runs before React hydrates. Reads localStorage and sets
 * the `dark` class immediately — no FOUC, no flicker.         */
const themeScript = `
  (function(){try{var t=localStorage.getItem("cmdb-theme");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();
`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0eb" },
    { media: "(prefers-color-scheme: dark)", color: "#161514" },
  ],
};

export const metadata: Metadata = {
  title: {
    template: "%s — CMDB SENA CCYS",
    default: "CMDB — SENA CCYS",
  },
  description:
    "Gestión de Configuración CMDB — SENA Centro de Comercio y Servicios",
  robots: { index: false, follow: false },
  openGraph: {
    title: "CMDB — SENA CCYS",
    description:
      "Gestión de Configuración CMDB — SENA Centro de Comercio y Servicios",
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(inter.variable, display.variable, mono.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased font-sans">
        <ErrorBoundary>
          <AuthGate>{children}</AuthGate>
        </ErrorBoundary>
      </body>
    </html>
  );
}
