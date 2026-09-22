import {
  checkMedia,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  mediaFileName,
  mediaUrl,
} from './media-rules';

describe('yuklanadigan fayl qoidalari', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp', 'IMAGE/JPEG'])('%s — rasm', (mimeType) => {
    const result = checkMedia({ mimeType, byteSize: 1000 });
    expect(result.ok && result.verdict.kind).toBe('IMAGE');
  });

  it('mp4 — video', () => {
    const result = checkMedia({ mimeType: 'video/mp4', byteSize: 1000 });
    expect(result.ok && result.verdict.kind).toBe('VIDEO');
  });

  it('charset qoʻshimchasi bilan kelgan turni ham tushunadi', () => {
    // Brauzer baʼzan `image/jpeg; charset=binary` yuboradi.
    expect(checkMedia({ mimeType: 'image/jpeg; charset=binary', byteSize: 10 }).ok).toBe(true);
  });

  it.each(['application/pdf', 'image/gif', 'video/quicktime', ''])('%s — rad etiladi', (mimeType) => {
    const result = checkMedia({ mimeType, byteSize: 10 });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.problem).toContain('JPEG');
  });

  it('chegaradagi rasm qabul qilinadi, undan kattasi yoʻq', () => {
    expect(checkMedia({ mimeType: 'image/png', byteSize: MAX_IMAGE_BYTES }).ok).toBe(true);
    const tooBig = checkMedia({ mimeType: 'image/png', byteSize: MAX_IMAGE_BYTES + 1 });
    expect(tooBig.ok).toBe(false);
    expect(!tooBig.ok && tooBig.problem).toContain('5 MB');
  });

  it('chegaradan katta video rad etiladi va oʻlcham aytiladi', () => {
    const tooBig = checkMedia({ mimeType: 'video/mp4', byteSize: MAX_VIDEO_BYTES + 1 });
    expect(!tooBig.ok && tooBig.problem).toContain('60 MB');
  });
});

describe('fayl nomi', () => {
  it('rasm webp, video mp4 boʻladi', () => {
    expect(mediaFileName('abc', 'IMAGE')).toBe('abc.webp');
    expect(mediaFileName('abc', 'VIDEO')).toBe('abc.mp4');
  });

  it('kiritilgan nomdan mustaqil — katalogdan chiqib boʻlmaydi', () => {
    // Nom umuman ishlatilmaydi; id server tomonidan beriladi.
    expect(mediaFileName('11111111-1111-4111-8111-111111111111', 'IMAGE')).not.toContain('/');
    expect(mediaUrl(mediaFileName('x', 'IMAGE'))).toBe('/media/x.webp');
  });
});
