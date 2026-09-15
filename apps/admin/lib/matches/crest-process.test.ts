import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { processCrestToTransparentPng, removeEdgeWhiteBackground } from './crest-process';

function solidPng(width: number, height: number, fill: [number, number, number, number], center?: [number, number, number, number]) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const useCenter =
        center && x > width * 0.3 && x < width * 0.7 && y > height * 0.3 && y < height * 0.7;
      const color = useCenter ? center : fill;
      png.data[i] = color[0];
      png.data[i + 1] = color[1];
      png.data[i + 2] = color[2];
      png.data[i + 3] = color[3];
    }
  }
  return PNG.sync.write(png);
}

describe('crest edge white removal', () => {
  it('clears edge white but keeps interior white badge', () => {
    const buffer = solidPng(40, 40, [255, 255, 255, 255], [255, 255, 255, 255]);
    // Paint a red ring so center white is not edge-connected.
    const png = PNG.sync.read(buffer);
    for (let y = 8; y < 32; y += 1) {
      for (let x = 8; x < 32; x += 1) {
        const onRing = x === 8 || x === 31 || y === 8 || y === 31;
        if (onRing) {
          const i = (y * 40 + x) * 4;
          png.data[i] = 200;
          png.data[i + 1] = 16;
          png.data[i + 2] = 46;
          png.data[i + 3] = 255;
        }
      }
    }
    const cleared = removeEdgeWhiteBackground({ width: 40, height: 40, data: png.data });
    expect(cleared.data[3]).toBe(0);
    const center = ((20 * 40 + 20) * 4) + 3;
    expect(cleared.data[center]).toBe(255);
  });

  it('returns a png buffer from processed crest', () => {
    const buffer = solidPng(32, 32, [255, 255, 255, 255], [200, 16, 46, 255]);
    const out = processCrestToTransparentPng(buffer, 'image/png');
    expect(out).toBeInstanceOf(Buffer);
    expect(out!.byteLength).toBeGreaterThan(40);
  });

  it('keeps interior white on already-transparent preferred-style PNG', () => {
    const png = new PNG({ width: 24, height: 24 });
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = 0;
      png.data[i + 1] = 0;
      png.data[i + 2] = 0;
      png.data[i + 3] = 0;
    }
    for (let y = 6; y < 18; y += 1) {
      for (let x = 6; x < 18; x += 1) {
        const i = (y * 24 + x) * 4;
        const interiorWhite = x >= 10 && x <= 13 && y >= 10 && y <= 13;
        png.data[i] = interiorWhite ? 255 : 200;
        png.data[i + 1] = interiorWhite ? 255 : 16;
        png.data[i + 2] = interiorWhite ? 255 : 46;
        png.data[i + 3] = 255;
      }
    }
    const buffer = PNG.sync.write(png);
    const out = processCrestToTransparentPng(buffer, 'image/png');
    expect(out).toBeTruthy();
    const decoded = PNG.sync.read(out!);
    expect(decoded.width).toBeLessThanOrEqual(24);
    expect(decoded.height).toBeLessThanOrEqual(24);
    let opaqueWhite = 0;
    for (let i = 0; i < decoded.data.length; i += 4) {
      if (
        decoded.data[i] === 255 &&
        decoded.data[i + 1] === 255 &&
        decoded.data[i + 2] === 255 &&
        decoded.data[i + 3] === 255
      ) {
        opaqueWhite += 1;
      }
    }
    expect(opaqueWhite).toBeGreaterThan(0);
  });
});
