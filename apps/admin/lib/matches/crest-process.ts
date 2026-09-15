import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

type Rgba = { width: number; height: number; data: Uint8Array };

const WHITE_MIN = 248;
const WHITE_DELTA = 12;

function isNearWhite(r: number, g: number, b: number, a: number): boolean {
  if (a < 8) {
    return true;
  }
  if (r < WHITE_MIN || g < WHITE_MIN || b < WHITE_MIN) {
    return false;
  }
  return Math.max(r, g, b) - Math.min(r, g, b) <= WHITE_DELTA;
}

function decodeImage(buffer: Buffer, mime: string): Rgba | null {
  try {
    if (mime.includes('png')) {
      const png = PNG.sync.read(buffer);
      return { width: png.width, height: png.height, data: png.data };
    }
    if (mime.includes('jpeg') || mime.includes('jpg')) {
      const decoded = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
      return {
        width: decoded.width,
        height: decoded.height,
        data: decoded.data as Uint8Array,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/** Remove only edge-connected near-white background; preserve interior whites. */
export function removeEdgeWhiteBackground(input: Rgba): Rgba {
  const { width, height, data } = input;
  const out = new Uint8Array(data);
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  const pushIfBg = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }
    const i = y * width + x;
    if (visited[i]) {
      return;
    }
    const o = i * 4;
    if (!isNearWhite(out[o]!, out[o + 1]!, out[o + 2]!, out[o + 3]!)) {
      return;
    }
    visited[i] = 1;
    queue.push(i);
  };

  for (let x = 0; x < width; x += 1) {
    pushIfBg(x, 0);
    pushIfBg(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    pushIfBg(0, y);
    pushIfBg(width - 1, y);
  }

  while (queue.length > 0) {
    const i = queue.pop()!;
    const o = i * 4;
    out[o + 3] = 0;
    const x = i % width;
    const y = Math.floor(i / width);
    pushIfBg(x + 1, y);
    pushIfBg(x - 1, y);
    pushIfBg(x, y + 1);
    pushIfBg(x, y - 1);
  }

  return { width, height, data: out };
}

export function trimTransparent(input: Rgba, padding = 2): Rgba {
  const { width, height, data } = input;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const a = data[(y * width + x) * 4 + 3] ?? 0;
      if (a > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    return input;
  }
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const next = new Uint8Array(tw * th * 4);
  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      const src = ((minY + y) * width + (minX + x)) * 4;
      const dst = (y * tw + x) * 4;
      next[dst] = data[src]!;
      next[dst + 1] = data[src + 1]!;
      next[dst + 2] = data[src + 2]!;
      next[dst + 3] = data[src + 3]!;
    }
  }
  return { width: tw, height: th, data: next };
}

export function encodePng(input: Rgba): Buffer {
  const png = new PNG({ width: input.width, height: input.height });
  png.data.set(input.data);
  return PNG.sync.write(png);
}

/**
 * Convert crest bytes to trimmed transparent PNG.
 * Edge flood-fill only — logo-interior whites stay opaque.
 */
export function processCrestToTransparentPng(buffer: Buffer, mime: string): Buffer | null {
  const decoded = decodeImage(buffer, mime);
  if (!decoded || decoded.width < 8 || decoded.height < 8) {
    return null;
  }
  const cleared = removeEdgeWhiteBackground(decoded);
  const trimmed = trimTransparent(cleared);
  if (trimmed.width < 8 || trimmed.height < 8) {
    return null;
  }
  return encodePng(trimmed);
}
