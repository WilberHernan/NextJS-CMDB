import { NextRequest, NextResponse } from 'next/server';
import { SEDES, type Sede } from '@/lib/sedes';
import { ZipArchive } from 'archiver';

const GITHUB_RAW =
  'https://raw.githubusercontent.com/WilberHernan/NextJS-CMDB/main';

const PLATFORMS = ['win', 'mac', 'linux'] as const;
type Platform = (typeof PLATFORMS)[number];

interface ScriptFile {
  remotePath: string;
  fileName: string;
}

function getFiles (sede: string, platform: Platform): ScriptFile[] {
  const base = `inventario-scripts/${encodeURIComponent(sede)}`;
  switch (platform) {
    case 'win':
      return [
        { remotePath: `${base}/PermisosWin.bat`, fileName: 'PermisosWin.bat' },
        { remotePath: `${base}/inventarioWin.ps1`, fileName: 'inventarioWin.ps1' },
      ];
    case 'mac':
      return [
        {
          remotePath: `${base}/Mac%20y%20Linux/inventarioMac`,
          fileName: 'inventarioMac',
        },
      ];
    case 'linux':
      return [
        {
          remotePath: `${base}/Mac%20y%20Linux/inventarioLinux`,
          fileName: 'inventarioLinux',
        },
      ];
  }
}

async function fetchFromGitHub (path: string): Promise<Buffer> {
  const url = `${GITHUB_RAW}/${path}`;
  const res = await fetch(url);

  if (res.status === 404) {
    throw new Error(`Archivo no encontrado en GitHub: ${path}`);
  }
  if (!res.ok) {
    throw new Error(`GitHub respondió con error ${res.status} para: ${path}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function createZip (files: { name: string; buffer: Buffer }[]): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err: Error) => reject(err));

    for (const file of files) {
      archive.append(file.buffer, { name: file.name });
    }

    archive.finalize();
  });
}

export async function GET (request: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────
  const PAGE_KEY = process.env.PAGE_KEY;
  if (PAGE_KEY) {
    const authCookie = request.cookies.get('cmdb-auth');
    if (authCookie?.value !== PAGE_KEY) {
      return new NextResponse(
        JSON.stringify({ error: 'No autorizado' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // ── 2. Validar parámetros ────────────────────────────────
  const { searchParams } = new URL(request.url);
  const sede = searchParams.get('sede');
  const plataforma = searchParams.get('plataforma');

  if (!sede || !SEDES.includes(sede as Sede)) {
    return new NextResponse(
      JSON.stringify({ error: 'Sede inválida' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!plataforma || !PLATFORMS.includes(plataforma as Platform)) {
    return new NextResponse(
      JSON.stringify({ error: 'Plataforma inválida' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // ── 3. Obtener archivos ──────────────────────────────────
  const files = getFiles(sede, plataforma as Platform);

  try {
    const fileContents = await Promise.all(
      files.map(async (f) => ({
        name: f.fileName,
        buffer: await fetchFromGitHub(f.remotePath),
      }))
    );

    // ── 4. Responder ───────────────────────────────────────
    if (plataforma === 'win') {
      const zipBuffer = await createZip(fileContents);
      const body = new Uint8Array(zipBuffer);

      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="PermisosWin_${sede}.zip"`,
          'Content-Length': body.length.toString(),
        },
      });
    }

    const file = fileContents[0];
    const body = new Uint8Array(file.buffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Length': body.length.toString(),
      },
    });
  } catch (err) {
    console.error('[descargar-script]', err);

    const message =
      err instanceof Error ? err.message : 'Error desconocido';

    return new NextResponse(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
