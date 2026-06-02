import type { BrowserMultiFormatReader } from "@zxing/browser";

const CONTRAST_FACTOR = 1.3;
const BINARIZE_THRESHOLD = 128;
const MIN_TEXT_LENGTH = 4;
const MAX_TEXT_LENGTH = 20;
const OCR_TIMEOUT_MS = 15_000;

export async function loadImage(src: string | File): Promise<HTMLImageElement> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  const isObjectUrl = typeof src !== "string";
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
      img.src = url;
    });
  } finally {
    if (isObjectUrl) URL.revokeObjectURL(url);
  }
}

export async function preprocessImage(
  imageSource: string | File | HTMLImageElement
): Promise<HTMLCanvasElement> {
  const image =
    imageSource instanceof HTMLImageElement
      ? imageSource
      : await loadImage(imageSource);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context no disponible");

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const contrasted = CONTRAST_FACTOR * (lum - 128) + 128;
    const clamped = Math.max(0, Math.min(255, contrasted));
    const binary = clamped >= BINARIZE_THRESHOLD ? 255 : 0;

    data[i] = binary;
    data[i + 1] = binary;
    data[i + 2] = binary;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export async function tryDecodeBarcode(
  canvas: HTMLCanvasElement,
  reader: BrowserMultiFormatReader
): Promise<string | null> {
  try {
    const dataUrl = canvas.toDataURL("image/png");
    const result = await reader.decodeFromImageUrl(dataUrl);
    const text = result.getText();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

export async function tryRotateAndDecode(
  canvas: HTMLCanvasElement,
  reader: BrowserMultiFormatReader
): Promise<string | null> {
  const rotations: Array<{ angle: 90 | 180 | 270 }> = [
    { angle: 90 },
    { angle: 180 },
    { angle: 270 },
  ];

  for (const { angle } of rotations) {
    const rotated = rotateCanvas(canvas, angle);
    const decoded = await tryDecodeBarcode(rotated, reader);
    if (decoded) return decoded;
  }
  return null;
}

function rotateCanvas(
  source: HTMLCanvasElement,
  angle: 90 | 180 | 270
): HTMLCanvasElement {
  const swap = angle === 90 || angle === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? source.height : source.width;
  canvas.height = swap ? source.width : source.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context no disponible");

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

function isPlausiblePlaca(text: string): boolean {
  if (text.length < MIN_TEXT_LENGTH || text.length > MAX_TEXT_LENGTH) return false;
  if (!/\d/.test(text)) return false;
  return /^[A-Z0-9-]+$/i.test(text);
}

function cleanOcrText(raw: string): string {
  return raw
    .replace(/[^A-Z0-9-]/gi, "")
    .toUpperCase();
}

export async function tryOcrText(
  canvas: HTMLCanvasElement
): Promise<string | null> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", undefined, {
    logger: () => {},
  });

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("OCR timeout")), OCR_TIMEOUT_MS)
    );

    const recognize = (async () => {
      const { data } = await worker.recognize(canvas);
      return data.text;
    })();

    const text = await Promise.race([recognize, timeout]);

    const candidates = text
      .split(/\s+/)
      .map(cleanOcrText)
      .filter((token) => token.length > 0);

    for (const token of candidates) {
      if (isPlausiblePlaca(token)) return token;
    }

    const joined = cleanOcrText(text);
    if (isPlausiblePlaca(joined)) return joined;

    return null;
  } catch {
    return null;
  } finally {
    await worker.terminate();
  }
}
