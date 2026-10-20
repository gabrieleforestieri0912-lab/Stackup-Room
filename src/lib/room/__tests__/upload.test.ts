import { describe, it, expect } from 'vitest';
import { sniffImageType, imageExt, readSafeImage } from '../upload';

const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const gif = Buffer.concat([Buffer.from('GIF89a', 'latin1'), Buffer.alloc(16)]);
const webp = Buffer.concat([Buffer.from('RIFF', 'latin1'), Buffer.alloc(4), Buffer.from('WEBP', 'latin1'), Buffer.alloc(8)]);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const html = Buffer.from('<html><script>alert(1)</script></html>');

describe('sniffImageType (magic bytes)', () => {
  it('riconosce i formati immagine ammessi', () => {
    expect(sniffImageType(png)).toBe('image/png');
    expect(sniffImageType(jpeg)).toBe('image/jpeg');
    expect(sniffImageType(gif)).toBe('image/gif');
    expect(sniffImageType(webp)).toBe('image/webp');
  });

  it('rifiuta SVG, HTML e rumore binario', () => {
    expect(sniffImageType(svg)).toBeNull();
    expect(sniffImageType(html)).toBeNull();
    expect(sniffImageType(Buffer.from([0x00, 0x01, 0x02, 0x03]))).toBeNull();
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
  });

  it('non si lascia ingannare da un MIME dichiarato falso', () => {
    // Il file dice "image/png" ma il contenuto è SVG: deve essere rifiutato.
    const fake = new Blob([svg], { type: 'image/png' });
    expect(sniffImageType(Buffer.from(svg))).toBeNull();
    return expect(readSafeImage(fake)).rejects.toThrow('IMAGE_INVALID');
  });

  it('estensione derivata dal tipo reale', () => {
    expect(imageExt('image/png')).toBe('png');
    expect(imageExt('image/jpeg')).toBe('jpg');
    expect(imageExt('image/webp')).toBe('webp');
    expect(imageExt('image/gif')).toBe('gif');
  });

  it('accetta un PNG reale e restituisce il content-type sniffed', async () => {
    const file = new Blob([png], { type: 'application/octet-stream' });
    const safe = await readSafeImage(file);
    expect(safe.contentType).toBe('image/png');
    expect(safe.ext).toBe('png');
  });
});
