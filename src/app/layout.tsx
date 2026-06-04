import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono, Sora } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

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
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const displayAlt = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display-alt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CMDB — SENA CCYS",
  description:
    "Gestión de Configuración CMDB — SENA Centro de Comercio y Servicios",
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
      className={cn(inter.variable, display.variable, mono.variable, displayAlt.variable)}
    >
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
