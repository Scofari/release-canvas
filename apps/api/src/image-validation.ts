export const supportedImageMimeTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type SupportedImageMimeType = (typeof supportedImageMimeTypes)[number];

export function detectImageMimeType(bytes: Uint8Array): SupportedImageMimeType | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export function validateUploadedImage(bytes: Uint8Array, claimedMimeType: SupportedImageMimeType, claimedByteSize: number) {
  if (bytes.byteLength !== claimedByteSize) throw new Error('Uploaded object size does not match the completed upload');
  const detectedMimeType = detectImageMimeType(bytes);
  if (!detectedMimeType || detectedMimeType !== claimedMimeType) throw new Error('Uploaded object content does not match its declared image type');
}
