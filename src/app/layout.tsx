import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
