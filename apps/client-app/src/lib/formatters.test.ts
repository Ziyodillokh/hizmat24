import { describe, expect, it } from 'vitest';
import {
  EMPTY_VALUE,
  formatApproxDuration,
  formatApproxPrice,
  formatDateTime,
  formatDuration,
  formatPhone,
  formatPrice,
  formatQueuePosition,
  formatRating,
  formatShortDate,
  formatTime,
  greeting,
  maskPhone,
  orEmpty,
} from './formatters';

/** Nazorat qilinadigan sana — `new Date()` ishlatilmaydi, natija barqaror boʻlsin. */
const NOW = new Date(2026, 8, 5, 14, 30);

describe('formatPrice (8.4-band)', () => {
  it("mingliklarni probel bilan ajratadi va \"soʻm\" qoʻshadi", () => {
    expect(formatPrice(150_000)).toBe("150 000 soʻm");
  });

  it('kasr qismini yaxlitlaydi — tiyin ishlatilmaydi', () => {
    expect(formatPrice(99_999.6)).toBe("100 000 soʻm");
  });

  it('millionni ham to\'g\'ri ajratadi', () => {
    expect(formatPrice(1_500_000)).toBe("1 500 000 soʻm");
  });

  it.each([
    ['UZS'],
    ['сум'],
    [','],
    ['.'],
    ['K'],
  ])('natijada taqiqlangan "%s" belgisi bo\'lmaydi', (forbidden) => {
    expect(formatPrice(150_000)).not.toContain(forbidden);
  });

  it('bosh sahifada aniq summa emas, taxminiy shakl ishlatiladi', () => {
    expect(formatApproxPrice(150_000)).toBe("taxminan 150 000 soʻm");
  });
});

describe('formatRating (8.5-band)', () => {
  it("oʻnlik ajratkich sifatida VERGUL ishlatadi", () => {
    expect(formatRating(4.8)).toBe('4,8');
  });

  it('server 4.75 bersa ham bitta kasr xonagacha yaxlitlaydi', () => {
    expect(formatRating(4.75)).toBe('4,8');
  });

  it('butun sonda ham kasr xona ko\'rsatadi', () => {
    expect(formatRating(5)).toBe('5,0');
  });
});

describe('formatTime va formatDateTime (8.5-band)', () => {
  it('24 soatlik format — AM/PM yo\'q', () => {
    expect(formatTime(new Date(2026, 8, 5, 14, 30))).toBe('14:30');
    expect(formatTime(new Date(2026, 8, 5, 9, 5))).toBe('09:05');
  });

  it('bugungi sanani "Bugun" bilan ko\'rsatadi', () => {
    expect(formatDateTime(new Date(2026, 8, 5, 14, 30), NOW)).toBe('Bugun, 14:30');
  });

  it('kechagi sanani "Kecha" bilan ko\'rsatadi', () => {
    expect(formatDateTime(new Date(2026, 8, 4, 9, 15), NOW)).toBe('Kecha, 09:15');
  });

  it('shu yil ichidagi sanada yil yozilmaydi', () => {
    expect(formatDateTime(new Date(2026, 8, 1, 14, 30), NOW)).toBe('1-sentabr, 14:30');
  });

  it('o\'tgan yilgi sanada yil yoziladi', () => {
    expect(formatDateTime(new Date(2025, 8, 5, 14, 30), NOW)).toBe('2025-yil 5-sentabr, 14:30');
  });

  it('oy nomlari kichik harf bilan yoziladi', () => {
    expect(formatDateTime(new Date(2026, 0, 15, 10, 0), NOW)).toContain('yanvar');
  });

  it('qisqa sana formati ro\'yxatlar uchun', () => {
    expect(formatShortDate(new Date(2026, 8, 5))).toBe('05.09.2026');
  });
});

describe('formatDuration (8.5-band)', () => {
  it.each([
    [15, '15 daqiqa'],
    [60, '1 soat'],
    [80, '1 soat 20 daqiqa'],
  ])('%s daqiqa → "%s"', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it.each(['min', 'daq.', '15m'])('taqiqlangan "%s" qisqartmasi ishlatilmaydi', (forbidden) => {
    expect(formatDuration(15)).not.toContain(forbidden);
  });

  it('`~` faqat taxminiy vaqt va navbat uchun', () => {
    expect(formatApproxDuration(15)).toBe('~15 daqiqa');
    expect(formatQueuePosition(3)).toBe("~3-oʻrin");
    expect(formatPrice(150_000)).not.toContain('~');
  });
});

describe('telefon raqami (8.3-band)', () => {
  it('maskalangan shakl o\'rta qismni yashiradi', () => {
    expect(maskPhone('+998901234567')).toBe('+998 90 *** ** 67');
  });

  it('04-ekran uchun to\'liq shakl', () => {
    expect(formatPhone('+998901234567')).toBe('+998 90 123 45 67');
  });

  it('kutilmagan uzunlikdagi qiymatni o\'zgartirmaydi', () => {
    expect(maskPhone('12345')).toBe('12345');
  });
});

describe('greeting (8.3-band)', () => {
  it.each([
    [6, 'Xayrli tong,'],
    [11, 'Xayrli tong,'],
    [12, 'Xayrli kun,'],
    [17, 'Xayrli kun,'],
    [18, 'Xayrli kech,'],
    [23, 'Xayrli kech,'],
    [3, 'Xayrli kech,'],
  ])('soat %s → "%s"', (hour, expected) => {
    expect(greeting(new Date(2026, 8, 5, hour, 0))).toBe(expected);
  });
});

describe('orEmpty (8.5-band)', () => {
  it('ma\'lumot yo\'qligini "—" bilan ko\'rsatadi, "N/A" bilan emas', () => {
    expect(orEmpty(null)).toBe(EMPTY_VALUE);
    expect(EMPTY_VALUE).toBe('—');
    expect(orEmpty('Akmal')).toBe('Akmal');
  });
});
