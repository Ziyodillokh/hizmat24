import { describe, expect, it } from 'vitest';
import { reviveDisputes, serializeDisputes } from './dispute-persistence';
import type { DisputeRecord } from '@/lib/dispute';

const record = (extra: Partial<DisputeRecord> = {}): DisputeRecord => ({
  id: 'd-1',
  orderId: 'live-104912',
  orderShortId: 'HZ-104912',
  categoryName: 'Kran taʼmirlash',
  reason: 'Ish sifatsiz',
  goal: 'fix',
  note: 'Kran yana oqmoqda',
  message: 'Hizmat24 — muammo haqida xabar',
  createdAt: new Date(2026, 8, 12, 14, 30),
  openedChannels: [{ channel: 'telegram', openedAt: new Date(2026, 8, 12, 14, 35) }],
  resolvedAt: null,
  ...extra,
});

const stored = (extra: Record<string, unknown> = {}) => ({
  ...serializeDisputes([record()])[0],
  ...extra,
});

describe('reviveDisputes', () => {
  it('massiv boʻlmagan kirishda null', () => {
    expect(reviveDisputes(null)).toBeNull();
    expect(reviveDisputes({})).toBeNull();
    expect(reviveDisputes('matn')).toBeNull();
    expect(reviveDisputes([])).toBeNull();
  });

  it('buzuq sana yozuvni tashlaydi, yaroqlisi qoladi', () => {
    const result = reviveDisputes([stored({ createdAt: 'salom' }), stored({ id: 'd-2' })]);

    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe('d-2');
  });

  it('majburiy maydon yoʻq boʻlsa yozuv tashlanadi', () => {
    expect(reviveDisputes([stored({ orderShortId: undefined })])).toBeNull();
    expect(reviveDisputes([stored({ message: 42 })])).toBeNull();
  });

  it('notanish kutilma turi yozuvni tashlaydi', () => {
    expect(reviveDisputes([stored({ goal: 'nonexistent' })])).toBeNull();
  });

  it('kanallar massiv boʻlmasa boʻsh roʻyxat, yozuv qoladi', () => {
    const result = reviveDisputes([stored({ openedChannels: 'telegram' })]);

    expect(result).toHaveLength(1);
    expect(result?.[0].openedChannels).toEqual([]);
  });

  it('buzuq hodisa YOZUVNI tashlamaydi — faqat oʻzi tushadi', () => {
    const result = reviveDisputes([
      stored({
        openedChannels: [
          { channel: 'sms', openedAt: new Date().toISOString() },
          { channel: 'telegram', openedAt: 'buzuq' },
          { channel: 'phone', openedAt: new Date(2026, 8, 12, 15, 0).toISOString() },
        ],
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result?.[0].openedChannels).toHaveLength(1);
    expect(result?.[0].openedChannels[0].channel).toBe('phone');
  });

  it('buzuq hal boʻlish sanasi ochiq holatga tushadi', () => {
    expect(reviveDisputes([stored({ resolvedAt: 'buzuq' })])?.[0].resolvedAt).toBeNull();
  });

  it('sanalar Date obyekti boʻlib tiklanadi', () => {
    const result = reviveDisputes([stored({ resolvedAt: new Date(2026, 8, 13).toISOString() })]);

    expect(result?.[0].createdAt).toBeInstanceOf(Date);
    expect(result?.[0].resolvedAt).toBeInstanceOf(Date);
    expect(result?.[0].openedChannels[0].openedAt).toBeInstanceOf(Date);
  });
});

describe('serializeDisputes', () => {
  it('aylanma: saqlab-tiklaganda hamma maydon joyida qoladi', () => {
    const source = record({ resolvedAt: new Date(2026, 8, 13, 10, 0) });
    const back = reviveDisputes(serializeDisputes([source]));

    expect(back).toHaveLength(1);
    expect(back?.[0].id).toBe(source.id);
    expect(back?.[0].message).toBe(source.message);
    expect(back?.[0].createdAt.getTime()).toBe(source.createdAt.getTime());
    expect(back?.[0].resolvedAt?.getTime()).toBe(source.resolvedAt?.getTime());
    expect(back?.[0].openedChannels[0].openedAt.getTime()).toBe(
      source.openedChannels[0].openedAt.getTime(),
    );
  });

  it('kirish massivini oʻzgartirmaydi', () => {
    const source = record();
    const snapshot = JSON.stringify(serializeDisputes([source]));
    serializeDisputes([source]);
    expect(JSON.stringify(serializeDisputes([source]))).toBe(snapshot);
    expect(source.createdAt).toBeInstanceOf(Date);
  });
});
