import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { WalletTransaction } from '@/app/types';
import { buildWalletView, LEVELS } from './wallet';
import {
  cardAriaLabel,
  cardHolder,
  DEMO_HISTORY_LABEL,
  hasDemoHistory,
  HOLDER_FALLBACK,
  isMethodAvailable,
  levelProgressCopy,
  levelRangeLabel,
  levelRatio,
  METHOD_AVAILABILITY,
  monthCaption,
  PAYMENT_OPTIONS,
  RECENT_LIMIT,
  recentTransactions,
  spentOverline,
  stampHint,
  totalCaption,
} from './walletCard';

/** Nazorat qilinadigan sana — 2026-09-09. */
const NOW = new Date(2026, 8, 9, 14, 30);

const tx = (id: string, orderId: string | null = null): WalletTransaction => ({
  id,
  orderId,
  shortId: id,
  categoryId: 'c-tap',
  categoryName: 'Kran taʼmirlash',
  categoryIconKey: 'tap',
  groupId: 'g-plumbing',
  groupName: 'Santexnika',
  masterName: null,
  amount: 1000,
  method: 'cash',
  paidAt: NOW,
});

describe('cardHolder', () => {
  it('ism bor boʻlsa ism tepada, maskalangan raqam pastda', () => {
    expect(cardHolder('Zafar Karimov', '+998901234567')).toEqual({
      primary: 'Zafar Karimov',
      secondary: '+998 90 *** ** 67',
    });
  });

  it('ism yoʻq boʻlsa maskalangan raqam tepaga koʻtariladi, ikkinchi qator yoʻq', () => {
    expect(cardHolder(null, '998901234567')).toEqual({ primary: '+998 90 *** ** 67', secondary: null });
  });

  it('boʻsh satr ism deb hisoblanmaydi', () => {
    expect(cardHolder('   ', '+998901234567').primary).toBe('+998 90 *** ** 67');
  });

  it('ism ham, raqam ham yoʻq boʻlsa rol yorligʻi chiqadi', () => {
    expect(cardHolder(undefined, '')).toEqual({ primary: HOLDER_FALLBACK, secondary: null });
  });

  it('toʻliq raqam hech qachon ochiq chiqmaydi', () => {
    const holder = cardHolder('Ali', '+998 90 123 45 67');
    expect(holder.secondary).not.toContain('123');
  });
});

describe('cardAriaLabel', () => {
  it('null qismlar tashlanadi', () => {
    expect(cardAriaLabel(LEVELS[0], { primary: 'Hizmat24 mijozi', secondary: null })).toBe(
      'Hizmat24 mijoz kartasi. Bronza daraja, 2% chegirma. Hizmat24 mijozi.',
    );
  });

  it('ism va maskalangan raqam qoʻshiladi', () => {
    expect(cardAriaLabel(LEVELS[1], cardHolder('Zafar', '+998901234567'))).toBe(
      'Hizmat24 mijoz kartasi. Kumush daraja, 4% chegirma. Zafar. +998 90 *** ** 67.',
    );
  });
});

describe('recentTransactions / hasDemoHistory', () => {
  it('birinchi uchtasini tartibni buzmay qaytaradi', () => {
    const list = ['a', 'b', 'c', 'd', 'e'].map((id) => tx(id));
    expect(recentTransactions(list).map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(RECENT_LIMIT).toBe(3);
  });

  it('qisqa, boʻsh va manfiy limit — xatosiz', () => {
    expect(recentTransactions([tx('a')])).toHaveLength(1);
    expect(recentTransactions([])).toEqual([]);
    expect(recentTransactions([tx('a')], -1)).toEqual([]);
  });

  it('demo yozuv (orderId null) bor boʻlsa true', () => {
    expect(hasDemoHistory([tx('a', 'o-1'), tx('b')])).toBe(true);
    expect(hasDemoHistory([tx('a', 'o-1')])).toBe(false);
    expect(hasDemoHistory([])).toBe(false);
  });
});

describe('toʻlov usullari', () => {
  it('faqat naqd ishlaydi — checkout va Karta sahifasi bitta manbadan', () => {
    expect(isMethodAvailable('cash')).toBe(true);
    expect(isMethodAvailable('escrow')).toBe(false);
    expect(isMethodAvailable('card')).toBe(false);
    expect(Object.entries(METHOD_AVAILABILITY).filter(([, value]) => value).map(([key]) => key)).toEqual(['cash']);
  });

  it('roʻyxatda faqat naqd "Faol", u birinchi turadi', () => {
    expect(PAYMENT_OPTIONS[0].key).toBe('cash');
    expect(PAYMENT_OPTIONS.filter((option) => option.isAvailable).map((option) => option.key)).toEqual(['cash']);
  });

  it('kalitlar takrorlanmaydi, izohlar 360px ga sigʻadi', () => {
    const keys = PAYMENT_OPTIONS.map((option) => option.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const option of PAYMENT_OPTIONS) expect(option.hint.length).toBeLessThanOrEqual(36);
  });
});

describe('daraja matnlari', () => {
  it('keyingi daraja bor boʻlsa nomi va qolgan buyurtmalar', () => {
    expect(levelProgressCopy({ nextLevel: LEVELS[2], ordersToNextLevel: 14 })).toBe(
      'Oltin darajaga yana 14 ta buyurtma',
    );
    expect(levelProgressCopy({ nextLevel: null, ordersToNextLevel: 0 })).toBe('Eng yuqori daraja');
  });

  it('nisbat: "16 / 30", eng yuqorida faqat son', () => {
    expect(levelRatio({ nextLevel: LEVELS[2], ordersTotal: 16 })).toBe('16 / 30');
    expect(levelRatio({ nextLevel: null, ordersTotal: 31 })).toBe('31 ta');
  });

  it('diapazonlar LEVELS dan hisoblanadi', () => {
    expect(LEVELS.map(levelRangeLabel)).toEqual(['0–9 ta buyurtma', '10–29 ta buyurtma', '30+ ta buyurtma']);
  });

  it('nol buyurtmali foydalanuvchi Bronza · 2% — bu haqiqiy daraja', () => {
    const view = buildWalletView([], [], NOW);
    expect(view.level.label).toBe('Bronza');
    expect(levelProgressCopy(view)).toBe('Kumush darajaga yana 10 ta buyurtma');
  });

  it('shtamp izohi uch holatda', () => {
    expect(stampHint({ filled: 0, remaining: 10 })).toBe('Blok boshlanmagan · 10 ta buyurtma qoldi');
    expect(stampHint({ filled: 10, remaining: 0 })).toBe('10 ta toʻldirildi · blok yakunlandi');
    expect(stampHint({ filled: 6, remaining: 4 })).toBe('6 ta toʻldirildi · 4 ta qoldi');
  });
});

describe('izohlar', () => {
  it('oy nomi oʻrin-payt kelishigida', () => {
    expect(spentOverline('Sentabr')).toBe('Sentabrda sarflangan');
  });

  it('bu oyda buyurtma bor', () => {
    expect(monthCaption(5, NOW, NOW)).toBe('5 ta buyurtma');
  });

  it('bu oyda yoʻq, lekin tarix bor — oxirgi toʻlov sanasi', () => {
    expect(monthCaption(0, new Date(2026, 7, 26), NOW)).toBe('oxirgi toʻlov 26-avgust');
    expect(monthCaption(0, new Date(2026, 8, 8), NOW)).toBe('oxirgi toʻlov kecha');
  });

  it('tarix umuman yoʻq — nol yashirilmaydi', () => {
    expect(monthCaption(0, null, NOW)).toBe('buyurtma yoʻq');
    expect(totalCaption(0)).toBe('hali buyurtma yoʻq');
    expect(totalCaption(16)).toBe('16 ta buyurtma');
  });
});

describe('matn qoidasi', () => {
  it('kutubxona matnlarida ASCII apostrof yoʻq (faqat ʻ / ʼ)', () => {
    const source = readFileSync(new URL('./walletCard.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/[a-zA-Z]'[a-zA-Z]/);
    expect(DEMO_HISTORY_LABEL).not.toMatch(/'/);
  });
});
