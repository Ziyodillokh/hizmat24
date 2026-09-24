import { OrderStatus } from '@prisma/client';
import {
  actionProblem,
  bucketOf,
  etaProblem,
  MASTER_ETA_MAX,
  MASTER_ETA_MIN,
  ownershipProblem,
  type MasterAction,
  type MasterOrderState,
} from './master-order-rules';

const MASTER = 'master-1';
const NOW = new Date('2026-09-24T10:00:00.000Z');

const order = (patch: Partial<MasterOrderState> = {}): MasterOrderState => ({
  status: OrderStatus.ASSIGNED,
  masterId: MASTER,
  masterAckedAt: null,
  ...patch,
});

describe('bucketOf', () => {
  /*
   * `ASSIGNED` ikki xil maʼno beradi va bu farq ekranda koʻrinadi: javob
   * berilmagan ish TAKLIF (u yoʻqolishi mumkin), javob berilgani esa
   * ustaning OʻZ ishi.
   */
  it('javob berilmagan tayinlov — taklif', () => {
    expect(bucketOf(order())).toBe('offer');
  });

  it('qabul qilingan tayinlov — faol ish', () => {
    expect(bucketOf(order({ masterAckedAt: NOW }))).toBe('active');
  });

  it.each([
    OrderStatus.MASTER_EN_ROUTE,
    OrderStatus.ARRIVED_PENDING_CONFIRMATION,
    OrderStatus.IN_PROGRESS,
  ])('%s — faol ish', (status) => {
    expect(bucketOf(order({ status, masterAckedAt: NOW }))).toBe('active');
  });

  it.each([
    OrderStatus.COMPLETED_BY_MASTER,
    OrderStatus.RATED,
    OrderStatus.CLOSED,
    OrderStatus.CANCELLED,
    OrderStatus.SAFETY_FLAGGED,
  ])('%s — tarix', (status) => {
    expect(bucketOf(order({ status, masterAckedAt: NOW }))).toBe('history');
  });
});

describe('ownershipProblem', () => {
  it('oʻz ishida muammo yoʻq', () => {
    expect(ownershipProblem(order(), MASTER)).toBeNull();
  });

  /*
   * Eng koʻp uchraydigan poyga: usta tugmani bosguncha javob kutish vaqti
   * tugagan. Ekranda «topilmadi» emas, aynan shu sabab yozilishi kerak.
   */
  it('boshqa ustaga oʻtgan ish — aniq sabab', () => {
    expect(ownershipProblem(order({ masterId: 'master-2' }), MASTER)).toContain('boshqa usta');
  });

  it('ustasiz qolgan ish — kutish vaqti tugagani aytiladi', () => {
    expect(ownershipProblem(order({ masterId: null }), MASTER)).toContain('kutish vaqti');
  });
});

describe('actionProblem', () => {
  it('yangi taklifni qabul qilish va rad etish mumkin', () => {
    expect(actionProblem('accept', order())).toBeNull();
    expect(actionProblem('decline', order())).toBeNull();
  });

  it('qabul qilingan ishni ikkinchi marta qabul qilib boʻlmaydi', () => {
    expect(actionProblem('accept', order({ masterAckedAt: NOW }))).toContain('allaqachon');
  });

  /*
   * Qabul qilishdan OLDIN yoʻlga chiqish — mijoz ekranida «usta yoʻlda»
   * degan yozuv, usta esa hali javob bermagan holat. Bu koʻrinadigan
   * yolgʻon, shuning uchun toʻsiladi.
   */
  it('qabul qilinmagan ishda yoʻlga chiqib boʻlmaydi', () => {
    expect(actionProblem('depart', order())).toBe('Avval ishni qabul qiling.');
    expect(actionProblem('depart', order({ masterAckedAt: NOW }))).toBeNull();
  });

  it('yetib kelish faqat yoʻldagi ishda', () => {
    expect(actionProblem('arrive', order({ masterAckedAt: NOW }))).not.toBeNull();
    expect(
      actionProblem('arrive', order({ status: OrderStatus.MASTER_EN_ROUTE, masterAckedAt: NOW })),
    ).toBeNull();
  });

  /*
   * Yakunlash faqat `IN_PROGRESS` da: bu holatga mijoz ustani eshik
   * oldida TASDIQLAGANDAN keyin oʻtiladi (xavfsizlik qoidasi).
   */
  it('yakunlash mijoz tasdigʻidan keyin', () => {
    expect(
      actionProblem(
        'finish',
        order({ status: OrderStatus.ARRIVED_PENDING_CONFIRMATION, masterAckedAt: NOW }),
      ),
    ).toContain('tasdiqlagandan keyin');
    expect(
      actionProblem('finish', order({ status: OrderStatus.IN_PROGRESS, masterAckedAt: NOW })),
    ).toBeNull();
  });

  it('bekor qilish faqat ish boshlanmaguncha', () => {
    expect(actionProblem('cancel', order({ masterAckedAt: NOW }))).toBeNull();
    expect(
      actionProblem('cancel', order({ status: OrderStatus.MASTER_EN_ROUTE, masterAckedAt: NOW })),
    ).toBeNull();
    expect(
      actionProblem('cancel', order({ status: OrderStatus.IN_PROGRESS, masterAckedAt: NOW })),
    ).not.toBeNull();
  });

  it('har bir amalning sababi yozilgan va boʻsh emas', () => {
    const actions: MasterAction[] = ['accept', 'decline', 'depart', 'arrive', 'finish', 'cancel'];
    for (const action of actions) {
      const problem = actionProblem(action, order({ status: OrderStatus.CLOSED }));
      expect(problem).not.toBeNull();
      expect((problem ?? '').length).toBeGreaterThan(10);
    }
  });
});

describe('etaProblem', () => {
  it('chegaradagi qiymatlar qabul qilinadi', () => {
    expect(etaProblem(MASTER_ETA_MIN)).toBeNull();
    expect(etaProblem(MASTER_ETA_MAX)).toBeNull();
    expect(etaProblem(30)).toBeNull();
  });

  it('chegaradan tashqarisi rad etiladi', () => {
    expect(etaProblem(0)).not.toBeNull();
    expect(etaProblem(MASTER_ETA_MAX + 1)).toContain(String(MASTER_ETA_MAX));
  });

  it('kasr son qabul qilinmaydi', () => {
    expect(etaProblem(12.5)).toContain('butun');
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    const texts = [
      ownershipProblem(order({ masterId: 'x' }), MASTER),
      ownershipProblem(order({ masterId: null }), MASTER),
      actionProblem('depart', order()),
      actionProblem('finish', order({ status: OrderStatus.IN_PROGRESS })),
      actionProblem('cancel', order({ status: OrderStatus.CLOSED })),
      etaProblem(0),
      etaProblem(1.5),
    ];
    for (const text of texts) expect(text ?? '').not.toMatch(/[a-zA-Z]'[a-zA-Z]/);
  });
});
