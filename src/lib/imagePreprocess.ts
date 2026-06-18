import type { BrowserMultiFormatReader } from '@zxing/browser';

const CONTRAST_FACTOR = 1.3;
const MAX_IMAGE_WIDTH = 1280;
const DEFAULT_BUDGET_MS = 3000;
const ROTATIONS: ReadonlyArray<0 | 90 | 180 | 270> = [0, 90, 180, 270] as const;

export type Strategy =
  | 'raw'
  | 'contrast'
  | 'bin-80'
  | 'bin-128'
  | 'bin-180'
  | 'inverted';

const STRATEGY_ORDER: ReadonlyArray<Strategy> = [
  'raw',
  'contrast',
  'bin-128',
  'bin-80',
  'bin-180',
  'inverted',
] as const;

export interface DecodeAttempt {
  variant: string;
  angle: number;
  durationMs: number;
}

export interface AggressiveOptions {
  budgetMs?: number;
  onAttempt?: (info: DecodeAttempt) => void;
}

export async function loadImage (src: string | File): Promise<HTMLImageElement> {
  const url = typeof src === 'string' ? src : URL.createObjectURL(src);
  const isObjectUrl = typeof src !== 'string';
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = url;
    });
  } finally {
    if (isObjectUrl) URL.revokeObjectURL(url);
  }
}

function getCtx (canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context no disponible');
  return ctx;
}

function drawImageToCanvas (source: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement {
  const w = source instanceof HTMLImageElement
    ? (source.naturalWidth || source.width)
    : source.width;
  const h = source instanceof HTMLImageElement
    ? (source.naturalHeight || source.height)
    : source.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  getCtx(canvas).drawImage(source, 0, 0, w, h);
  return canvas;
}

export function rotateCanvas (
  source: HTMLCanvasElement,
  angle: 90 | 180 | 270
): HTMLCanvasElement {
  const swap = angle === 90 || angle === 270;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? source.height : source.width;
  canvas.height = swap ? source.width : source.height;
  const ctx = getCtx(canvas);
  if (angle === 90) {
    ctx.translate(canvas.width, 0);
    ctx.rotate((Math.PI / 180) * 90);
  } else if (angle === 180) {
    ctx.translate(canvas.width, canvas.height);
    ctx.rotate((Math.PI / 180) * 180);
  } else {
    ctx.translate(0, canvas.height);
    ctx.rotate((Math.PI / 180) * 270);
  }
  ctx.drawImage(source, 0, 0);
  return canvas;
}

const clamp = (v: number): number => Math.max(0, Math.min(255, v));

function applyPixelTransform (
  source: HTMLCanvasElement,
  transform: (gray: number) => number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = getCtx(canvas);
  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const value = transform(gray);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function toGrayscaleContrast (canvas: HTMLCanvasElement): HTMLCanvasElement {
  return applyPixelTransform(canvas, (g) => clamp(CONTRAST_FACTOR * (g - 128) + 128));
}

export function binarizeCanvas (
  canvas: HTMLCanvasElement,
  threshold: number
): HTMLCanvasElement {
  return applyPixelTransform(canvas, (g) => (g >= threshold ? 255 : 0));
}

export function invertCanvas (canvas: HTMLCanvasElement): HTMLCanvasElement {
  return applyPixelTransform(canvas, (g) => 255 - g);
}

export function sharpenCanvas (canvas: HTMLCanvasElement): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = getCtx(canvas);
  const src = ctx.getImageData(0, 0, w, h).data;
  const out = ctx.createImageData(w, h);
  const o = out.data;
  const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          sum += (0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2]) *
            k[(ky + 1) * 3 + (kx + 1)];
        }
      }
      const v = clamp(sum);
      const outIdx = (y * w + x) * 4;
      o[outIdx] = v;
      o[outIdx + 1] = v;
      o[outIdx + 2] = v;
      o[outIdx + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return canvas;
}

function downscaleIfNeeded (image: HTMLImageElement, maxWidth: number): HTMLCanvasElement {
  const w = image.naturalWidth || image.width;
  const h = image.naturalHeight || image.height;
  if (w <= maxWidth) return drawImageToCanvas(image);
  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = Math.round((h * maxWidth) / w);
  getCtx(canvas).drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function preprocessImage (
  imageSource: string | File | HTMLImageElement
): Promise<HTMLCanvasElement> {
  const image =
    imageSource instanceof HTMLImageElement
      ? imageSource
      : await loadImage(imageSource);
  return binarizeCanvas(toGrayscaleContrast(drawImageToCanvas(image)), 128);
}

export async function tryDecodeBarcode (
  canvas: HTMLCanvasElement,
  reader: BrowserMultiFormatReader
): Promise<string | null> {
  try {
    const result = await reader.decodeFromImageUrl(canvas.toDataURL('image/png'));
    const text = result.getText();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

export async function tryRotateAndDecode (
  canvas: HTMLCanvasElement,
  reader: BrowserMultiFormatReader
): Promise<string | null> {
  for (const angle of [90, 180, 270] as const) {
    const decoded = await tryDecodeBarcode(rotateCanvas(canvas, angle), reader);
    if (decoded) return decoded;
  }
  return null;
}

/**
 * Tries up to 6 preprocessing strategies × 4 rotations = 24 attempts.
 * Returns the first successful decode within the time budget.
 *
 * Strategy order (WHY this order):
 *  1. raw — most common case. Clear photos decode in <100ms with no preprocessing.
 *  2. contrast-1.3 — handles washed-out / low-contrast barcodes where bars and
 *     spaces have similar luminance but no B&W quantization is needed.
 *  3. bin-128 — binarization handles noisy backgrounds (text, logos, paper
 *     texture). 128 is the universal default threshold.
 *  4. bin-80 — for darker / underexposed photos. Lower threshold = a pixel must
 *     be darker to count as "black", preserving the bar pattern when dim.
 *  5. bin-180 — for brighter / overexposed photos. Higher threshold = a pixel
 *     must be lighter to count as "white", preserving the bar pattern under glare.
 *  6. inverted — handles white-on-black barcodes (industrial labels, photo
 *     negatives). ZXing's ALSO_INVERTED hint also tries this internally per
 *     attempt; explicit preprocessing is a safety net for the contrast stage.
 *
 * Preprocessing runs ONCE per strategy; the result is just rotated for each
 * angle — much faster than re-binarizing per rotation. Yields to the UI
 * between failed attempts so the spinner stays responsive.
 */
export async function tryDecodeAggressive (
  img: HTMLImageElement,
  reader: BrowserMultiFormatReader,
  options: AggressiveOptions = {}
): Promise<string | null> {
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;
  const onAttempt = options.onAttempt;
  const start = Date.now();
  const base = downscaleIfNeeded(img, MAX_IMAGE_WIDTH);

  for (const strategy of STRATEGY_ORDER) {
    if (Date.now() - start > budgetMs) return null;
    const prepared = prepareStrategy(base, strategy);

    for (const angle of ROTATIONS) {
      if (Date.now() - start > budgetMs) return null;
      const attemptStart = Date.now();
      const candidate = angle === 0 ? prepared : rotateCanvas(prepared, angle);
      const decoded = await tryDecodeBarcode(candidate, reader);
      onAttempt?.({ variant: strategy, angle, durationMs: Date.now() - attemptStart });
      if (decoded) return decoded;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  return null;
}

function prepareStrategy (base: HTMLCanvasElement, strategy: Strategy): HTMLCanvasElement {
  switch (strategy) {
    case 'raw': return base;
    case 'contrast': return toGrayscaleContrast(base);
    case 'bin-80': return binarizeCanvas(base, 80);
    case 'bin-128': return binarizeCanvas(base, 128);
    case 'bin-180': return binarizeCanvas(base, 180);
    case 'inverted': return invertCanvas(binarizeCanvas(base, 128));
  }
}
