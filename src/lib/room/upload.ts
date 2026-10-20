// Validazione upload binari: il MIME dichiarato dal client è falsificabile,
// quindi il tipo reale si deduce dai magic bytes del file.
//
// Regola: allowlist stretta di formati immagine, niente SVG/HTML (XSS sul
// bucket pubblico `avatars`), e il content-type salvato è quello sniffed,
// mai quello dichiarato dal browser.

export const IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const;

export type ImageType = keyof typeof IMAGE_TYPES;

const MAGIC: Array<{ type: ImageType; test: (b: Buffer) => boolean }> = [
  { type: 'image/png', test: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  { type: 'image/jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/gif', test: (b) => b.length > 6 && b.slice(0, 6).toString('latin1') === 'GIF87a' || (b.length > 6 && b.slice(0, 6).toString('latin1') === 'GIF89a') },
  { type: 'image/webp', test: (b) => b.length > 12 && b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP' },
];

/** Deduce il tipo reale del file dai magic bytes. Null se non è un'immagine ammessa. */
export function sniffImageType(buffer: Buffer): ImageType | null {
  for (const m of MAGIC) {
    try {
      if (m.test(buffer)) return m.type;
    } catch {
      return null;
    }
  }
  return null;
}

/** Estensione sicura derivata dal tipo sniffed. */
export function imageExt(type: ImageType): string {
  return IMAGE_TYPES[type];
}

/**
 * Verifica che il file sia un'immagine ammessa e restituisce
 * { buffer, contentType, ext } con il content-type sniffed.
 * Solleva un errore con messaggio utente-friendly se il file non è valido.
 */
export async function readSafeImage(file: Blob): Promise<{ buffer: Buffer; contentType: ImageType; ext: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    throw new Error('IMAGE_INVALID');
  }
  return { buffer, contentType: sniffed, ext: imageExt(sniffed) };
}

// Estensioni audio ammesse per le note vocali (mai derivate dal MIME del client).
export const AUDIO_EXTS = ['webm', 'ogg', 'mp4', 'm4a', 'wav'] as const;
