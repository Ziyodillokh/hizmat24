import { describe, expect, it } from 'vitest';
import {
  ACTIVE_ORDER_STATUSES,
  canCancel,
  canRate,
  DETAIL_ACTION_LABELS,
  getDetailActions,
  getStepperState,
  hasReceipt,
  isBlockingConfirmation,
  isMasterPhoneVisible,
  isTerminal,
  matchesHistoryFilter,
  needsSafetyNotice,
  ORDER_STATUS,
  paymentStateFor,
  STATUS_CHIPS,
  STEPPER_LABELS,
  type HistoryFilter,
  type OrderStatus,
} from './orderStateMachine';

const ALL: OrderStatus[] = Object.values(ORDER_STATUS);

describe('status chiplari (10.2-band)', () => {
  it('aynan 10 ta chip mavjud', () => {
    expect(Object.keys(STATUS_CHIPS)).toHaveLength(10);
  });

  it('har bir holat uchun chip aniqlangan', () => {
    for (const status of ALL) {
      expect(STATUS_CHIPS[status]).toBeDefined();
    }
  });

  it('"Qoralama" va "Baholandi" alohida holat sifatida yasalmagan', () => {
    const labels = Object.values(STATUS_CHIPS).map((chip) => chip.label);
    expect(labels).not.toContain('Qoralama');
    expect(labels).not.toContain('Baholandi');
  });
});

describe('canCancel (1-bo\'lim, 4-qoida)', () => {
  it.each([
    ORDER_STATUS.SEARCHING,
    ORDER_STATUS.SEARCHING_QUEUED,
    ORDER_STATUS.ASSIGNED,
    ORDER_STATUS.MASTER_EN_ROUTE,
  ])('%s holatida bekor qilish mumkin', (status) => {
    expect(canCancel(status)).toBe(true);
  });

  it.each([
    ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
    ORDER_STATUS.IN_PROGRESS,
    ORDER_STATUS.COMPLETED_BY_MASTER,
    ORDER_STATUS.CLOSED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.SAFETY_FLAGGED,
  ])('%s holatida bekor qilish tugmasi umuman chizilmaydi', (status) => {
    expect(canCancel(status)).toBe(false);
  });

  it('aynan 4 ta holatda ruxsat beriladi', () => {
    expect(ALL.filter(canCancel)).toHaveLength(4);
  });
});

describe('isMasterPhoneVisible (1-bo\'lim, 3-qoida)', () => {
  it('aynan 4 ta holatda telefon ko\'rinadi', () => {
    expect(ALL.filter(isMasterPhoneVisible)).toHaveLength(4);
  });

  it('ish yakunlangach telefon yashiriladi', () => {
    expect(isMasterPhoneVisible(ORDER_STATUS.COMPLETED_BY_MASTER)).toBe(false);
    expect(isMasterPhoneVisible(ORDER_STATUS.CLOSED)).toBe(false);
  });

  it('xavfsizlik tekshiruvida telefon berilmaydi', () => {
    expect(isMasterPhoneVisible(ORDER_STATUS.SAFETY_FLAGGED)).toBe(false);
  });
});

describe('isTerminal (1-bo\'lim, 17-qoida)', () => {
  it('terminal holatlar aynan uchta', () => {
    expect(ALL.filter(isTerminal)).toEqual([
      ORDER_STATUS.CLOSED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.SAFETY_FLAGGED,
    ]);
  });
});

describe('hasReceipt va canRate (1-bo\'lim, 7 va 8-qoida)', () => {
  it('chek faqat yakunlangan buyurtmalarda', () => {
    expect(hasReceipt(ORDER_STATUS.COMPLETED_BY_MASTER)).toBe(true);
    expect(hasReceipt(ORDER_STATUS.CLOSED)).toBe(true);
  });

  it('bekor qilingan va xavfsizlik tekshiruvidagi buyurtmada chek yo\'q', () => {
    expect(hasReceipt(ORDER_STATUS.CANCELLED)).toBe(false);
    expect(hasReceipt(ORDER_STATUS.SAFETY_FLAGGED)).toBe(false);
  });

  it('baholash faqat "Ish yakunlandi" holatida', () => {
    expect(ALL.filter(canRate)).toEqual([ORDER_STATUS.COMPLETED_BY_MASTER]);
  });
});

describe('getStepperState (10.1-band)', () => {
  it('5 bosqich yorlig\'i mavjud', () => {
    expect(STEPPER_LABELS).toHaveLength(5);
  });

  it.each([
    [ORDER_STATUS.SEARCHING, 0],
    [ORDER_STATUS.SEARCHING_QUEUED, 0],
    [ORDER_STATUS.ASSIGNED, 1],
    [ORDER_STATUS.MASTER_EN_ROUTE, 2],
    [ORDER_STATUS.IN_PROGRESS, 3],
    [ORDER_STATUS.COMPLETED_BY_MASTER, 4],
    [ORDER_STATUS.CLOSED, 4],
  ])('%s → %s-bosqich', (status, step) => {
    expect(getStepperState(status).currentStep).toBe(step);
  });

  it.each([
    ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.SAFETY_FLAGGED,
  ])('%s holatida stepper umuman chizilmaydi', (status) => {
    expect(getStepperState(status).currentStep).toBeNull();
  });

  it('"Ish yakunlandi" da 5-bosqich joriy, lekin BAJARILGAN emas', () => {
    const state = getStepperState(ORDER_STATUS.COMPLETED_BY_MASTER);
    expect(state.currentStep).toBe(4);
    expect(state.currentCompleted).toBe(false);
  });

  it('"Yakunlandi" da barcha bosqichlar bajarilgan', () => {
    expect(getStepperState(ORDER_STATUS.CLOSED).currentCompleted).toBe(true);
  });
});

describe('aktiv buyurtma kartasi (06-ekran)', () => {
  it('aynan 6 ta variant uchun holat sanalgan', () => {
    expect(ACTIVE_ORDER_STATUSES).toHaveLength(6);
  });

  it('"Usta yetib keldi" ro\'yxatda YO\'Q — u holatda bosh sahifa ko\'rsatilmaydi', () => {
    expect(ACTIVE_ORDER_STATUSES).not.toContain(ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION);
    expect(isBlockingConfirmation(ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION)).toBe(true);
  });

  it('terminal holatlar aktiv ro\'yxatda bo\'lmaydi', () => {
    for (const status of ACTIVE_ORDER_STATUSES) {
      expect(isTerminal(status)).toBe(false);
    }
  });
});

describe('getDetailActions (23-ekran jadvali)', () => {
  it.each([
    [ORDER_STATUS.SEARCHING, ['cancel']],
    [ORDER_STATUS.SEARCHING_QUEUED, ['cancel']],
    [ORDER_STATUS.ASSIGNED, ['call', 'cancel']],
    [ORDER_STATUS.MASTER_EN_ROUTE, ['call', 'cancel']],
    [ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, ['confirm-master', 'reject-master']],
    [ORDER_STATUS.IN_PROGRESS, ['call', 'support']],
    [ORDER_STATUS.COMPLETED_BY_MASTER, ['rate', 'receipt']],
    [ORDER_STATUS.CLOSED, ['receipt', 'reorder']],
    [ORDER_STATUS.CANCELLED, ['reorder']],
    [ORDER_STATUS.SAFETY_FLAGGED, ['support']],
  ])('%s → %s', (status, expected) => {
    expect(getDetailActions(status)).toEqual(expected);
  });

  it('bekor qilish tugmasi FAQAT canCancel ruxsat bergan holatlarda chiqadi', () => {
    for (const status of ALL) {
      expect(getDetailActions(status).includes('cancel')).toBe(canCancel(status));
    }
  });

  it("qoʻngʻiroq tugmasi FAQAT telefon koʻrinadigan holatlarda chiqadi", () => {
    for (const status of ALL) {
      const hasCall = getDetailActions(status).includes('call');
      // "Usta yetib keldi" — bloklovchi ekran: telefon bor, lekin tugmalar boshqa.
      if (status === ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION) continue;
      expect(hasCall).toBe(isMasterPhoneVisible(status));
    }
  });

  it('chek tugmasi FAQAT chek mavjud holatlarda chiqadi', () => {
    for (const status of ALL) {
      expect(getDetailActions(status).includes('receipt')).toBe(hasReceipt(status));
    }
  });

  it('baholash tugmasi FAQAT canRate ruxsat bergan holatda chiqadi', () => {
    for (const status of ALL) {
      expect(getDetailActions(status).includes('rate')).toBe(canRate(status));
    }
  });

  it('har bir amal uchun o\'zbekcha yorliq bor', () => {
    for (const status of ALL) {
      for (const action of getDetailActions(status)) {
        expect(DETAIL_ACTION_LABELS[action]).toBeTruthy();
      }
    }
  });
});

describe('matchesHistoryFilter (24-ekran)', () => {
  it('"Barchasi" hamma holatni o\'tkazadi', () => {
    expect(ALL.every((status) => matchesHistoryFilter(status, 'all'))).toBe(true);
  });

  it('"Aktiv" faqat terminal bo\'lmagan holatlarni o\'tkazadi', () => {
    for (const status of ALL) {
      expect(matchesHistoryFilter(status, 'active')).toBe(!isTerminal(status));
    }
  });

  it('"Yakunlangan" faqat CLOSED', () => {
    expect(ALL.filter((s) => matchesHistoryFilter(s, 'done'))).toEqual([ORDER_STATUS.CLOSED]);
  });

  it('"Bekor qilingan" bekor qilingan va xavfsizlik tekshiruvidagilarni qamraydi', () => {
    expect(ALL.filter((s) => matchesHistoryFilter(s, 'cancelled'))).toEqual([
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.SAFETY_FLAGGED,
    ]);
  });

  it('har bir holat kamida bitta filtrga tushadi — yo\'qolib qolmaydi', () => {
    const narrow: HistoryFilter[] = ['active', 'done', 'cancelled'];
    for (const status of ALL) {
      expect(narrow.some((filter) => matchesHistoryFilter(status, filter))).toBe(true);
    }
  });
});

describe('needsSafetyNotice (23-ekran)', () => {
  it('faqat xavfsizlik tekshiruvidagi buyurtmada ogohlantirish chiqadi', () => {
    expect(ALL.filter(needsSafetyNotice)).toEqual([ORDER_STATUS.SAFETY_FLAGGED]);
  });
});

describe('paymentStateFor (toʻlov chekidagi holat)', () => {
  it('faqat yopilgan buyurtma "toʻlandi" deb belgilanadi', () => {
    expect(paymentStateFor(ORDER_STATUS.CLOSED)).toBe('paid');

    const paid = Object.values(ORDER_STATUS).filter(
      (status) => paymentStateFor(status) === 'paid',
    );
    expect(paid).toEqual([ORDER_STATUS.CLOSED]);
  });

  it('usta ishni tugatgach mijozdan tasdiq soʻraladi', () => {
    expect(paymentStateFor(ORDER_STATUS.COMPLETED_BY_MASTER)).toBe('confirm');
  });

  it('bekor qilingan buyurtmada toʻlov boʻlmaydi', () => {
    expect(paymentStateFor(ORDER_STATUS.CANCELLED)).toBe('none');
    expect(paymentStateFor(ORDER_STATUS.SAFETY_FLAGGED)).toBe('none');
  });

  it('qolgan holatlarda toʻlov kutiladi', () => {
    for (const status of [
      ORDER_STATUS.SEARCHING,
      ORDER_STATUS.SEARCHING_QUEUED,
      ORDER_STATUS.ASSIGNED,
      ORDER_STATUS.MASTER_EN_ROUTE,
      ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
      ORDER_STATUS.IN_PROGRESS,
    ]) {
      expect(paymentStateFor(status)).toBe('pending');
    }
  });
});
