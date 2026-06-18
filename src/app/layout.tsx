import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk as SpaceGrotesk, IBM_Plex_Mono as IbpPlexMono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AuthGate } from '@/components/AuthGate';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SedeProvider } from '@/contexts/sede-context';
import './globals.css';

/* ── Inline script to prevent dark-mode flash ────────────────
 * Runs before React hydrates. Reads localStorage and sets
 * the `dark` class immediately — no FOUC, no flicker.         */
const themeScript = `
  (function(){try{var t=localStorage.getItem("cmdb-theme");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();
`;

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = SpaceGrotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

const mono = IbpPlexMono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f0eb' },
    { media: '(prefers-color-scheme: dark)', color: '#161514' },
  ],
};

export const metadata: Metadata = {
  title: {
    template: '%s — SENA CMDB',
    default: 'SENA CMDB',
  },
  description:
    'Gestión de Configuración CMDB — SENA Centro de Comercio y Servicios',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'SENA CMDB',
    description:
      'Gestión de Configuración — SENA Centro de Comercio y Servicios',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='es'
      suppressHydrationWarning
      className={cn(inter.variable, display.variable, mono.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
        <link rel='apple-touch-icon' href='/icon.png' />
        <link rel='manifest' href='/manifest.json' />
      </head>
      <body className='antialiased font-sans'>
        <ErrorBoundary>
          <SedeProvider>
            <AuthGate>{children}</AuthGate>
          </SedeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
