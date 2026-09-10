import { describe, expect, it } from 'vitest';
import {
  buildDayStrip,
  buildHours,
  dayKey,
  DAY_STRIP_LENGTH,
  groupHours,
  slotAt,
  timingLabel,
} from './schedule';

/** 2026-09-10, payshanba. */
const TODAY = new Date(2026, 8, 10, 8, 0);

describe('dayKey', () => {
  it('oy va kunni ikki xonali qiladi', () => {
    expect(dayKey(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(dayKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('bir kunning turli soatlarida bir xil kalit beradi', () => {
    expect(dayKey(new Date(2026, 8, 5, 0, 0))).toBe(dayKey(new Date(2026, 8, 5, 23, 59)));
  });
});

describe('buildDayStrip', () => {
  it('yettita kun qaytaradi va birinchisi bugun', () => {
    const days = buildDayStrip(TODAY);

    expect(days).toHaveLength(DAY_STRIP_LENGTH);
    expect(days[0].key).toBe('2026-09-10');
    expect(days[6].key).toBe('2026-09-16');
  });

  it('har bir kun 00:00 ga normallashgan', () => {
    for (const day of buildDayStrip(TODAY)) {
      expect(day.date.getHours()).toBe(0);
      expect(day.date.getMinutes()).toBe(0);
    }
  });

  it('oy chegarasidan oʻtadi', () => {
    expect(buildDayStrip(new Date(2026, 7, 31, 8, 0))[6].key).toBe('2026-09-06');
  });

  it('yil chegarasidan oʻtadi', () => {
    expect(buildDayStrip(new Date(2026, 11, 29, 8, 0))[6].key).toBe('2027-01-04');
  });

  it('kech boʻlganda bugungi kun tanlanmaydi, ertangisi tanlanadi', () => {
    const days = buildDayStrip(new Date(2026, 8, 10, 23, 0));

    expect(days[0].hasSlots).toBe(false);
    expect(days[1].hasSlots).toBe(true);
  });
});

describe('buildHours', () => {
  const day = new Date(2026, 8, 10);

  it('ertangi kunda toʻqqizta slot', () => {
    const tomorrow = new Date(2026, 8, 11);
    expect(buildHours(tomorrow, TODAY)).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it('erta tongda bugungi hamma slot ochiq', () => {
    expect(buildHours(day, new Date(2026, 8, 10, 7, 0))).toHaveLength(9);
  });

  it('bir soatdan kam qolgan slot chizilmaydi', () => {
    // 12:30 da 13:00 ga bir soat yoʻq — u tushib qoladi.
    expect(buildHours(day, new Date(2026, 8, 10, 12, 30))).toEqual([14, 15, 16, 17]);
  });

  it('kun oxirida bitta slot qoladi', () => {
    // 15:30 da 16:00 ga yarim soat qolgan — u tushadi, 17:00 qoladi.
    expect(buildHours(day, new Date(2026, 8, 10, 15, 30))).toEqual([17]);
  });

  it('aynan bir soat qolgan slot HALI ochiq', () => {
    // 16:00 da 17:00 ga aynan 60 daqiqa — chegara qatʼiy emas.
    expect(buildHours(day, new Date(2026, 8, 10, 16, 0))).toEqual([17]);
  });

  it('bir soatdan bir daqiqa kam qolsa slot yopiladi', () => {
    expect(buildHours(day, new Date(2026, 8, 10, 16, 1))).toEqual([]);
  });

  it('oxirgi slot ham oʻtib ketsa boʻsh qaytaradi', () => {
    expect(buildHours(day, new Date(2026, 8, 10, 16, 30))).toEqual([]);
  });

  it('oʻtgan kunda slot boʻlmaydi', () => {
    expect(buildHours(new Date(2026, 8, 9), TODAY)).toEqual([]);
  });
});

describe('groupHours', () => {
  it('uch guruhga boʻladi', () => {
    const groups = groupHours([9, 10, 11, 12, 13, 14, 15, 16, 17]);

    expect(groups.map((group) => group.label)).toEqual(['Ertalab', 'Kunduzi', 'Kechqurun']);
    expect(groups[0].hours).toEqual([9, 10, 11]);
    expect(groups[2].hours).toEqual([15, 16, 17]);
  });

  it('boʻsh guruhni qaytarmaydi', () => {
    const groups = groupHours([16, 17]);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe('evening');
  });

  it('slot yoʻq boʻlsa guruh ham yoʻq', () => {
    expect(groupHours([])).toEqual([]);
  });
});

describe('slotAt', () => {
  it('kun va soatdan aniq vaqt yasaydi', () => {
    expect(slotAt(new Date(2026, 8, 10), 14)).toEqual(new Date(2026, 8, 10, 14, 0, 0, 0));
  });
});

describe('timingLabel', () => {
  const now = new Date(2026, 8, 10, 8, 0);

  it('rejalashtirilgan buyurtmada aniq sana va soat', () => {
    expect(timingLabel({ scheduledAt: new Date(2026, 8, 10, 14, 0), isUrgent: false }, now)).toBe(
      'Bugun, 14:00',
    );
  });

  it('shoshilinch buyurtma', () => {
    expect(timingLabel({ scheduledAt: null, isUrgent: true }, now)).toBe('Shoshilinch');
  });

  it('oddiy buyurtma', () => {
    expect(timingLabel({ scheduledAt: null, isUrgent: false }, now)).toBe('Imkon qadar tez');
  });

  it('sana bor boʻlsa shoshilinch bayrogʻi ustidan yozmaydi', () => {
    // Invariant `setDraftSchedule` da saqlanadi, lekin buzilsa ham sana ustun.
    expect(timingLabel({ scheduledAt: new Date(2026, 8, 11, 9, 0), isUrgent: true }, now)).toBe(
      'Ertaga, 09:00',
    );
  });
});
