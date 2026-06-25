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

    if (!plataforma || !['win', 'mac', 'linux'].includes(plataforma)) {
      return NextResponse.json(
        { ok: false, error: "Parámetro 'plataforma' inválido. Usa: win, mac, linux" },
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

      const stream = new ReadableStream({
        async start (controller) {
          const archive = new ZipArchive();

          archive.on('data', (chunk: Buffer) => {
            controller.enqueue(new Uint8Array(chunk));
          });
          archive.on('end', () => {
            controller.close();
          });
          archive.on('error', (err: Error) => {
            controller.error(err);
          });

          archive.append(ps1Content, { name: 'inventarioWin.ps1' });
          archive.append(batContent, { name: 'PermisosWin.bat' });
          await archive.finalize();
        },
      });

      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="inventario-${sede}.zip"`,
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
