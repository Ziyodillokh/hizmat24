import { blockProblem, cancelRatePercent, maskPhone } from './people-rules';

describe('maskPhone', () => {
  /*
   * Mask tanib olish uchun yetarli, lekin yozib olish uchun emas:
   * toʻliq yashirilgan raqam qoʻllab-quvvatlash ishini imkonsiz
   * qilardi.
   */
  it('boshi va oxiri ochiq qoladi', () => {
    expect(maskPhone('+998901234567')).toBe('+998 90 *** ** 67');
  });

  it('formatidan qatʼi nazar bir xil ishlaydi', () => {
    expect(maskPhone('998 90 123 45 67')).toBe(maskPhone('+998901234567'));
  });

  it('juda qisqa qiymatda hech narsa ochilmaydi', () => {
    expect(maskPhone('12345')).toBe('***');
    expect(maskPhone('')).toBe('***');
  });

  it('maskada toʻliq raqam qolmaydi', () => {
    const masked = maskPhone('+998901234567');

    expect(masked).not.toContain('1234');
    expect(masked).not.toContain('345');
  });
});

describe('blockProblem', () => {
  it('holat oʻzgarayotgan boʻlsa muammo yoʻq', () => {
    expect(blockProblem(false, true)).toBeNull();
    expect(blockProblem(true, false)).toBeNull();
  });

  /*
   * Bir xil holatga qayta oʻtkazish audit logni maʼnosiz yozuvlar
   * bilan toʻldirardi va «kim qachon blokladi» degan savolni
   * chalkashtirardi.
   */
  it('holat oʻzgarmasa aniq sabab bilan toʻsiladi', () => {
    expect(blockProblem(true, true)).toContain('bloklangan');
    expect(blockProblem(false, false)).toContain('faol');
  });
});

describe('cancelRatePercent', () => {
  it('ulush usta TEGGAN ishlardan hisoblanadi', () => {
    expect(cancelRatePercent({ completedOrdersCount: 9, cancelledByMasterCount: 1 })).toBe(10);
    expect(cancelRatePercent({ completedOrdersCount: 1, cancelledByMasterCount: 1 })).toBe(50);
  });

  /*
   * Ish boʻlmasa `null`: nol foiz «hech qachon bekor qilmagan» degan
   * maʼnoni berardi, holbuki usta umuman ishlamagan.
   */
  it('ishi yoʻq ustada foiz hisoblanmaydi', () => {
    expect(cancelRatePercent({ completedOrdersCount: 0, cancelledByMasterCount: 0 })).toBeNull();
  });

  it('faqat bekor qilgan ustada 100 foiz', () => {
    expect(cancelRatePercent({ completedOrdersCount: 0, cancelledByMasterCount: 3 })).toBe(100);
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    for (const text of [blockProblem(true, true), blockProblem(false, false)]) {
      expect(text ?? '').not.toMatch(/[a-zA-Z]'[a-zA-Z]/);
    }
  });
});
