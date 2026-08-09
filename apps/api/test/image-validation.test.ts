import { describe, expect, it } from 'vitest';
import { detectImageMimeType, validateUploadedImage } from '../src/image-validation.js';

describe('image upload validation', () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]);
  const webp = new TextEncoder().encode('RIFF0000WEBP');

  it('detects supported image signatures', () => {
    expect(detectImageMimeType(png)).toBe('image/png');
    expect(detectImageMimeType(jpeg)).toBe('image/jpeg');
    expect(detectImageMimeType(webp)).toBe('image/webp');
  });

  it('rejects a renamed or size-spoofed upload', () => {
    expect(() => validateUploadedImage(png, 'image/jpeg', png.byteLength)).toThrow(/declared image type/);
    expect(() => validateUploadedImage(png, 'image/png', png.byteLength + 1)).toThrow(/size/);
  });
});
