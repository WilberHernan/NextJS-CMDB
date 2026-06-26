import { NextRequest, NextResponse } from 'next/server';
import { isSede } from '@/lib/sedes';
import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';

const SCRIPTS_DIR = path.join(process.cwd(), 'inventario-scripts');

export async function GET (request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sedeRaw = searchParams.get('sede');
    const plataforma = searchParams.get('plataforma');

    if (!sedeRaw || !isSede(sedeRaw)) {
      return NextResponse.json(
        { ok: false, error: "Parámetro 'sede' inválido" },
        { status: 400 }
      );
    }

    if (!plataforma || !['win', 'mac', 'linux', 'guia'].includes(plataforma)) {
      return NextResponse.json(
        { ok: false, error: "Parámetro 'plataforma' inválido. Usa: win, mac, linux, guia" },
        { status: 400 }
      );
    }

    const sede = sedeRaw;

    if (plataforma === 'win') {
      const ps1Path = path.join(SCRIPTS_DIR, sede, 'inventarioWin.ps1');
      const batPath = path.join(SCRIPTS_DIR, sede, 'PermisosWin.bat');

      if (!fs.existsSync(ps1Path) || !fs.existsSync(batPath)) {
        return NextResponse.json(
          { ok: false, error: 'Archivos de script no encontrados para esta sede' },
          { status: 404 }
        );
      }

      const ps1Content = fs.readFileSync(ps1Path);
      const batContent = fs.readFileSync(batPath);

      // Collect ZIP into buffer (más confiable que streaming en serverless)
      const chunks: Buffer[] = [];
      const archive = new ZipArchive();

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));

      archive.append(ps1Content, { name: 'inventarioWin.ps1' });
      archive.append(batContent, { name: 'PermisosWin.bat' });

      await archive.finalize();

      const zipBuffer = Buffer.concat(chunks);

      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="inventario-${sede}.zip"`,
        },
      });
    }

    // Execution guide (same for all platforms)
    if (plataforma === 'guia') {
      const guiaPath = path.join(SCRIPTS_DIR, sede, 'Mac y Linux', 'GUIA-EJECUCION.txt');

      if (!fs.existsSync(guiaPath)) {
        return NextResponse.json(
          { ok: false, error: 'Guía de ejecución no encontrada para esta sede' },
          { status: 404 }
        );
      }

      const content = fs.readFileSync(guiaPath);

      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': 'attachment; filename="GUIA-EJECUCION.txt"',
        },
      });
    }

    // macOS or Linux
    const subdir = 'Mac y Linux';
    const filename = plataforma === 'mac' ? 'inventarioMac' : 'inventarioLinux';
    const filePath = path.join(SCRIPTS_DIR, sede, subdir, filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { ok: false, error: 'Archivo de script no encontrado para esta sede' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(filePath);

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}.sh"`,
      },
    });
  } catch (error) {
    console.error('Error en descargar-script:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
