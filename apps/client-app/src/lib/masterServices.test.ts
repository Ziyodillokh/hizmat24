import { describe, expect, it } from 'vitest';
import type { MasterService } from '@/api/masterServices';
import {
  enabledIds,
  groupServices,
  hasChanges,
  newServices,
  saveBlocker,
  toggle,
} from './masterServices';

const svc = (id: string, extra: Partial<MasterService> = {}): MasterService => ({
  categoryId: id,
  name: `Ish ${id}`,
  groupName: 'Santexnika',
  summary: null,
  basePrice: 100_000,
  complexityLevel: 'SIMPLE',
  isEnabled: true,
  isNew: false,
  ...extra,
});

describe('enabledIds', () => {
  it('faqat yoqilganlarini qaytaradi', () => {
    expect(enabledIds([svc('a'), svc('b', { isEnabled: false })])).toEqual(['a']);
  });
});

describe('toggle', () => {
  it('yoʻqni qoʻshadi, borni olib tashlaydi', () => {
    expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('asl massivni oʻzgartirmaydi', () => {
    const original = ['a'];
    toggle(original, 'b');
    expect(original).toEqual(['a']);
  });
});

describe('saveBlocker', () => {
  it('boʻsh tanlovni rad etadi — usta ishsiz qolmasin', () => {
    expect(saveBlocker([])).toContain('Kamida bitta');
  });

  it('bitta yetarli', () => {
    expect(saveBlocker(['a'])).toBeNull();
  });
});

describe('hasChanges', () => {
  const services = [svc('a'), svc('b', { isEnabled: false })];

  it('bir xil tanlovda oʻzgarish yoʻq', () => {
    expect(hasChanges(services, ['a'])).toBe(false);
  });

  it('tartib muhim emas', () => {
    expect(hasChanges([svc('a'), svc('b')], ['b', 'a'])).toBe(false);
  });

  it('qoʻshilgan xizmat — oʻzgarish', () => {
    expect(hasChanges(services, ['a', 'b'])).toBe(true);
  });

  it('olib tashlangan xizmat — oʻzgarish', () => {
    expect(hasChanges(services, [])).toBe(true);
  });

  it('almashtirilgan xizmat — oʻzgarish (soni bir xil boʻlsa ham)', () => {
    expect(hasChanges(services, ['b'])).toBe(true);
  });
});

describe('groupServices', () => {
  it('guruhlar boʻyicha ajratadi', () => {
    const blocks = groupServices([
      svc('a', { groupName: 'Santexnika' }),
      svc('b', { groupName: 'Isitish' }),
      svc('c', { groupName: 'Santexnika' }),
    ]);

    expect(blocks.map((block) => block.groupName)).toEqual(['Isitish', 'Santexnika']);
    expect(blocks[1].services).toHaveLength(2);
  });

  it('guruhsizlar OXIRIDA va aniq sarlavha bilan', () => {
    const blocks = groupServices([svc('a', { groupName: null }), svc('b', { groupName: 'Santexnika' })]);

    expect(blocks.map((block) => block.groupName)).toEqual(['Santexnika', 'Boshqa ishlar']);
  });

  it('boʻsh roʻyxatdan boʻsh natija', () => {
    expect(groupServices([])).toEqual([]);
  });
});

describe('newServices', () => {
  it('faqat yangi qoʻshilganlarini qaytaradi', () => {
    expect(newServices([svc('a'), svc('b', { isNew: true })]).map((s) => s.categoryId)).toEqual(['b']);
  });
});
