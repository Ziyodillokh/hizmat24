import { describe, expect, it } from 'vitest';
import { ORDER_STATUS } from './orderStateMachine';
import {
  buildWalletView,
  byGroup,
  cashbackFor,
  largestRemainder,
  levelFor,
  mergeTransactions,
  nextLevelFor,
  orderToTransaction,
  monthlySeries,
  percentOf,
  LEVELS,
} from './wallet';
import { materializeTransactions } from '@/mocks/wallet';
import type { LiveOrder, PaymentMethod, WalletTransaction } from '@/app/types';

/** Nazorat qilinadigan sana — natija barqaror boʻlsin. 2026-09-09, chorshanba. */
const NOW = new Date(2026, 8, 9, 14, 30);

let counter = 0;

function tx(
  amount: number,
  paidAt: Date,
  options: Partial<WalletTransaction> = {},
): WalletTransaction {
  counter += 1;
  return {
    id: `tx-${counter}`,
    orderId: null,
    shortId: `HZ-1041${counter.toString().padStart(2, '0')}`,
    categoryName: "Kran taʼmirlash",
    categoryIconKey: 'tap',
    groupId: 'g-plumbing',
    groupName: 'Santexnika',
    masterName: 'Akmal Rahimov',
    amount,
    method: 'escrow' as PaymentMethod,
    paidAt,
    ...options,
  };
}

function order(status: LiveOrder['status'], options: Partial<LiveOrder> = {}): LiveOrder {
  return {
    id: 'live-1',
    shortId: 'HZ-104901',
    categoryId: 'c-tap',
    categoryName: "Kran taʼmirlash",
    categoryIconKey: 'tap',
    description: '',
    price: 100_000,
    isUrgent: false,
    address: { label: 'Chilonzor' },
    status,
    master: null,
    etaMinutes: null,
    queuePosition: null,
    createdAt: new Date(2026, 8, 8, 10, 0),
    completedAt: new Date(2026, 8, 8, 12, 0),
    cancelReason: null,
    cancelledBy: null,
    rating: null,
    ...options,
  };
}

describe('percentOf', () => {
  it('jami nol boʻlsa nolga boʻlmaydi', () => {
    expect(percentOf(5, 0)).toBe(0);
    expect(percentOf(0, 0)).toBe(0);
  });

  it('oddiy ulushni hisoblaydi', () => {
    expect(percentOf(25, 100)).toBe(25);
  });
});

describe('largestRemainder', () => {
  it('yigʻindi aynan 100 boʻladi', () => {
    const result = largestRemainder([1, 1, 1]);
    expect(result.reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it('jami nol boʻlsa hammasi nol', () => {
    expect(largestRemainder([0, 0])).toEqual([0, 0]);
  });

  it('qoldiqni eng katta kasrli qatorga beradi', () => {
    // 3 ta teng ulush: 33,33% → 33+33+33 = 99, qolgan 1 birinchisiga.
    expect(largestRemainder([1, 1, 1])).toEqual([34, 33, 33]);
  });

  it('yaxlitlash yoʻqotishini eng katta kasrga taqsimlaydi', () => {
    // 7/9/9/9 → 20,59 / 26,47 / 26,47 / 26,47 → floor 20+26+26+26 = 98.
    // Qolgan 2 birlik eng katta kasrli ikki qatorga: 0,59 va (teng
    // kasrlardan birinchisi) 0,47.
    expect(largestRemainder([7, 9, 9, 9])).toEqual([21, 27, 26, 26]);
  });
});

describe('levelFor (daraja buyurtma soniga bogʻliq)', () => {
  it('chegaralarni toʻgʻri ajratadi', () => {
    expect(levelFor(0).key).toBe('bronze');
    expect(levelFor(9).key).toBe('bronze');
    expect(levelFor(10).key).toBe('silver');
    expect(levelFor(29).key).toBe('silver');
    expect(levelFor(30).key).toBe('gold');
    expect(levelFor(500).key).toBe('gold');
  });

  it('eng yuqori darajada keyingisi yoʻq', () => {
    expect(nextLevelFor(30)).toBeNull();
    expect(nextLevelFor(9)?.key).toBe('silver');
  });

  it('chegaralar qatʼiy oʻsadi', () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(LEVELS[i].minOrders).toBeGreaterThan(LEVELS[i - 1].minOrders);
    }
  });
});

describe('cashbackFor (har 10 buyurtmada 1%)', () => {
  it('buyurtma yoʻq boʻlsa hammasi nol', () => {
    expect(cashbackFor([])).toEqual({
      filled: 0,
      remaining: 10,
      blockPaid: 0,
      pending: 0,
      earned: 0,
    });
  });

  it('toʻlmagan blokda faqat kutilayotgan summa boʻladi', () => {
    const items = Array.from({ length: 7 }, () => tx(58_571, NOW));
    const result = cashbackFor(items);

    expect(result.filled).toBe(7);
    expect(result.remaining).toBe(3);
    expect(result.earned).toBe(0);
    // 7 x 58 571 = 409 997 → 1% = 4 099,97 → eng yaqin 100 = 4 100.
    expect(result.pending).toBe(4_100);
  });

  it('aynan 10 ta boʻlganda katakcha toʻladi va cashback yigʻiladi', () => {
    const items = Array.from({ length: 10 }, () => tx(100_000, NOW));
    const result = cashbackFor(items);

    expect(result.filled).toBe(10);
    expect(result.remaining).toBe(0);
    expect(result.earned).toBe(10_000);
  });

  it('11-buyurtma yangi blokni boshlaydi', () => {
    const items = Array.from({ length: 11 }, () => tx(100_000, NOW));
    const result = cashbackFor(items);

    expect(result.filled).toBe(1);
    expect(result.earned).toBe(10_000);
    expect(result.pending).toBe(1_000);
  });
});

describe('orderToTransaction', () => {
  it('faqat yakunlangan buyurtma tranzaksiyaga aylanadi', () => {
    expect(orderToTransaction(order(ORDER_STATUS.CLOSED))).not.toBeNull();
    expect(orderToTransaction(order(ORDER_STATUS.CANCELLED))).toBeNull();
    expect(orderToTransaction(order(ORDER_STATUS.COMPLETED_BY_MASTER))).toBeNull();
    expect(orderToTransaction(order(ORDER_STATUS.IN_PROGRESS))).toBeNull();
  });

  it('sohani katalogdan topadi', () => {
    const result = orderToTransaction(order(ORDER_STATUS.CLOSED));
    expect(result?.groupId).toBe('g-plumbing');
    expect(result?.groupName).toBe('Santexnika');
  });

  it('nomaʼlum kategoriya "Boshqa" guruhiga tushadi, tashlab yuborilmaydi', () => {
    const result = orderToTransaction(order(ORDER_STATUS.CLOSED, { categoryId: 'c-yoq' }));
    expect(result?.groupId).toBe('g-other');
    expect(result?.amount).toBe(100_000);
  });

  it('yakunlangan vaqt yoʻq boʻlsa yaratilgan vaqtga tushadi', () => {
    const created = new Date(2026, 8, 1, 9, 0);
    const result = orderToTransaction(
      order(ORDER_STATUS.CLOSED, { completedAt: null, createdAt: created }),
    );
    expect(result?.paidAt).toEqual(created);
  });

  it('manfiy narx nolga tushadi', () => {
    const result = orderToTransaction(order(ORDER_STATUS.CLOSED, { price: -5_000 }));
    expect(result?.amount).toBe(0);
  });
});

describe('mergeTransactions', () => {
  it('bir xil buyurtmani ikki marta sanamaydi', () => {
    const live = tx(100_000, NOW, { id: 'live-1', orderId: 'live-1' });
    const mock = tx(100_000, NOW, { id: 'live-1', orderId: 'live-1' });

    expect(mergeTransactions([mock], [live])).toHaveLength(1);
  });

  it('yangisini tepaga qoʻyadi', () => {
    const older = tx(100_000, new Date(2026, 7, 1));
    const newer = tx(100_000, new Date(2026, 8, 1));

    expect(mergeTransactions([older, newer], [])[0]).toBe(newer);
  });
});

describe('byGroup', () => {
  it('nol summali guruhni chizmaydi', () => {
    const rows = byGroup([
      tx(100_000, NOW),
      tx(0, NOW, { groupId: 'g-gas', groupName: 'Gaz' }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].percent).toBe(100);
  });

  it('foizlar yigʻindisi 100 boʻladi', () => {
    const rows = byGroup([
      tx(100_000, NOW),
      tx(100_000, NOW, { groupId: 'g-gas', groupName: 'Gaz' }),
      tx(100_000, NOW, { groupId: 'g-electric', groupName: 'Elektrika' }),
    ]);

    expect(rows.reduce((sum, row) => sum + row.percent, 0)).toBe(100);
  });
});

describe('byGroup ikonasi', () => {
  it('qator GURUH ikonasini oladi, xizmat ikonasini emas', () => {
    // 'tap' — kran xizmatining ikonasi; 'plumber' — Santexnika guruhiniki.
    const rows = byGroup([tx(100_000, NOW, { categoryIconKey: 'tap' })]);

    expect(rows[0].label).toBe('Santexnika');
    expect(rows[0].iconKey).toBe('plumber');
  });

  it('nomaʼlum guruhda xizmat ikonasiga tushadi', () => {
    const rows = byGroup([
      tx(100_000, NOW, { groupId: 'g-other', groupName: 'Boshqa', categoryIconKey: 'tap' }),
    ]);

    expect(rows[0].iconKey).toBe('tap');
  });
});

describe('buildWalletView', () => {
  it('buyurtma yoʻq boʻlsa boʻsh holat bayrogʻini koʻtaradi', () => {
    const view = buildWalletView([], [], NOW);

    expect(view.hasHistory).toBe(false);
    expect(view.spentThisMonth).toBe(0);
    expect(view.groups).toEqual([]);
    expect(view.level.key).toBe('bronze');
  });

  it('oʻtgan oydagi tranzaksiya shu oy summasiga kirmaydi', () => {
    const view = buildWalletView(
      [tx(100_000, new Date(2026, 8, 2, 10, 0)), tx(200_000, new Date(2026, 7, 25, 10, 0))],
      [],
      NOW,
    );

    expect(view.spentThisMonth).toBe(100_000);
    expect(view.ordersThisMonth).toBe(1);
    expect(view.spentTotal).toBe(300_000);
  });

  it('taqsimot faqat shu oy boʻyicha hisoblanadi', () => {
    // Tepadagi katta raqam shu oydan keladi; taqsimot butun tarixdan
    // hisoblansa, ikkita raqam bir-biriga mos kelmay qolardi.
    const view = buildWalletView(
      [
        tx(100_000, new Date(2026, 8, 2, 10, 0)),
        tx(200_000, new Date(2026, 7, 25, 10, 0), { groupId: 'g-gas', groupName: 'Gaz' }),
      ],
      [],
      NOW,
    );

    expect(view.groups).toHaveLength(1);
    expect(view.groups[0].amount).toBe(100_000);
  });

  it('bekor qilingan buyurtma darajaga qoʻshilmaydi', () => {
    const view = buildWalletView([], [order(ORDER_STATUS.CANCELLED)], NOW);
    expect(view.ordersTotal).toBe(0);
  });

  it('eng yuqori darajada progress toʻla va keyingisi yoʻq', () => {
    const items = Array.from({ length: 30 }, () => tx(10_000, NOW));
    const view = buildWalletView(items, [], NOW);

    expect(view.level.key).toBe('gold');
    expect(view.nextLevel).toBeNull();
    expect(view.ordersToNextLevel).toBe(0);
    expect(view.levelPercent).toBe(100);
  });

  it('daraja ichidagi progressni hisoblaydi', () => {
    const items = Array.from({ length: 5 }, () => tx(10_000, NOW));
    const view = buildWalletView(items, [], NOW);

    // Bronza 0 dan, Kumush 10 dan: 5 ta buyurtma — yarim yoʻl.
    expect(view.levelPercent).toBe(50);
    expect(view.ordersToNextLevel).toBe(5);
  });
});

describe('MOCK_TRANSACTIONS (demo maʼlumoti)', () => {
  const anchor = new Date(2026, 8, 9, 10, 0).getTime();
  const items = materializeTransactions(anchor);

  it('barcha urugʻ katalogda mavjud xizmatga bogʻlangan', () => {
    expect(items).toHaveLength(16);
    expect(items.every((item) => item.groupName !== '')).toBe(true);
  });

  it('kelajakdagi toʻlov yoʻq', () => {
    expect(items.every((item) => item.paidAt.getTime() <= anchor)).toBe(true);
  });

  it('oyning 1-sanasida ham shu oy summasi boʻsh qolmaydi', () => {
    const firstOfMonth = new Date(2026, 9, 1, 9, 0);
    const view = buildWalletView(materializeTransactions(firstOfMonth.getTime()), [], firstOfMonth);

    expect(view.ordersThisMonth).toBe(5);
    expect(view.spentThisMonth).toBeGreaterThan(0);
  });

  it('demo holati: Kumush daraja, Oltingacha 14 ta buyurtma', () => {
    const view = buildWalletView(items, [], new Date(anchor));

    expect(view.ordersTotal).toBe(16);
    expect(view.level.key).toBe('silver');
    expect(view.ordersToNextLevel).toBe(14);
    expect(view.cashback.filled).toBe(6);
  });

  it('toʻlov usullarining uchalasi ham roʻyxatda bor', () => {
    const view = buildWalletView(items, [], new Date(anchor));
    expect(view.methods.map((row) => row.key).sort()).toEqual(['card', 'cash', 'escrow']);
  });
});

describe('cashbackFor xronologik tartibi', () => {
  /*
   * Bir xil summali va bir xil sanali yozuvlar bilan test saralashni umuman
   * bogʻlamaydi: `chronological` komparatorini teskari qilsa ham test oʻtib
   * ketardi. Shuning uchun bu yerda summalar HAM, sanalar HAM har xil.
   */
  it('eski oʻnta yozuv birinchi blokka, yangisi joriy blokka tushadi', () => {
    const items = [
      ...Array.from({ length: 10 }, (_, index) =>
        tx(100_000, new Date(2026, 7, index + 1, 10, 0)),
      ),
      tx(900_000, new Date(2026, 8, 1, 10, 0)),
    ];

    const result = cashbackFor(items);

    expect(result.earned).toBe(10_000);
    expect(result.blockPaid).toBe(900_000);
    expect(result.pending).toBe(9_000);
  });

  it('teskari tartibda berilgan roʻyxat ham bir xil natija beradi', () => {
    const items = [
      tx(900_000, new Date(2026, 8, 1, 10, 0)),
      ...Array.from({ length: 10 }, (_, index) =>
        tx(100_000, new Date(2026, 7, index + 1, 10, 0)),
      ),
    ];

    expect(cashbackFor(items).earned).toBe(10_000);
    expect(cashbackFor(items).blockPaid).toBe(900_000);
  });
});

describe('cashbackFor chegarasi (toʻlgan blok ikki marta sanalmaydi)', () => {
  it('aynan 10 ta boʻlganda kutilayotgan summa nol boʻladi', () => {
    const items = Array.from({ length: 10 }, () => tx(100_000, NOW));
    const result = cashbackFor(items);

    expect(result.earned).toBe(10_000);
    expect(result.pending).toBe(0);
  });

  it('aynan 20 ta boʻlganda ikki blok yigʻiladi, kutilayotgani nol', () => {
    const items = Array.from({ length: 20 }, () => tx(100_000, NOW));
    const result = cashbackFor(items);

    expect(result.earned).toBe(20_000);
    expect(result.pending).toBe(0);
  });
});

describe('monthlySeries (oxirgi 6 oy)', () => {
  it('oltita oyni eskidan yangiga qaytaradi', () => {
    const rows = monthlySeries([], NOW);

    expect(rows).toHaveLength(6);
    expect(rows[5].monthStart).toEqual(new Date(2026, 8, 1));
    expect(rows[0].monthStart).toEqual(new Date(2026, 3, 1));
  });

  it('yil chegarasidan oʻtadi', () => {
    const rows = monthlySeries([], new Date(2026, 0, 15), 3);
    expect(rows[0].monthStart).toEqual(new Date(2025, 10, 1));
  });

  it('eng katta oy 100% boʻladi', () => {
    const rows = monthlySeries(
      [tx(300_000, new Date(2026, 8, 2)), tx(150_000, new Date(2026, 7, 2))],
      NOW,
    );

    expect(rows[5].percent).toBe(100);
    expect(rows[4].percent).toBe(50);
  });

  it('hamma oy nol boʻlsa hamma ulush nol', () => {
    expect(monthlySeries([], NOW).every((row) => row.percent === 0)).toBe(true);
  });
});
