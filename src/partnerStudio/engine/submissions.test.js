import { describe, it, expect } from 'vitest';
import { parseLinks, checkFiles, fileSize, MAX_FILES } from './submissions.js';

describe('parseLinks', () => {
  it('keeps real links, adds https, drops words and duplicates', () => {
    expect(parseLinks('see https://a.com/x and b.org\nnotalink https://a.com/x')).toEqual(['https://a.com/x', 'https://b.org/']);
    expect(parseLinks('')).toEqual([]);
    expect(parseLinks('javascript:alert(1)')).toEqual([]);
  });
});

describe('checkFiles', () => {
  const f = (name, type, size) => ({ name, type, size });
  it('accepts images, PDFs and office files under 10 MB', () => {
    const { ok, rejected } = checkFiles([f('a.png', 'image/png', 1000), f('b.pdf', 'application/pdf', 2000), f('c.exe', 'application/x-msdownload', 10), f('d.png', 'image/png', 11 * 1024 * 1024)]);
    expect(ok.map((x) => x.name)).toEqual(['a.png', 'b.pdf']);
    expect(rejected.map((x) => x.name)).toEqual(['c.exe', 'd.png']);
  });
  it('caps the number of files', () => {
    const { ok } = checkFiles([f('a.png', 'image/png', 1), f('b.png', 'image/png', 1)], MAX_FILES - 1);
    expect(ok).toHaveLength(1);
  });
  it('formats sizes', () => {
    expect(fileSize(2048)).toBe('2 KB');
    expect(fileSize(3 * 1024 * 1024)).toBe('3 MB');
  });
});
