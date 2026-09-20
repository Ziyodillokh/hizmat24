import {
  isSessionAlive,
  secondsUntilIdleLogout,
  shouldTouch,
  TOUCH_INTERVAL_MS,
  type SessionState,
} from './admin-session';

const NOW = new Date('2026-09-22T10:00:00.000Z');
const TTL = 30 * 60 * 1000;
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);
const session = (overrides: Partial<SessionState> = {}): SessionState => ({
  lastSeenAt: NOW,
  revokedAt: null,
  ...overrides,
});

describe('admin sessiyasining umri', () => {
  it('yangi sessiya tirik', () => {
    expect(isSessionAlive(session(), NOW, TTL)).toBe(true);
  });

  it('29 daqiqa jimlikdan keyin hali tirik', () => {
    expect(isSessionAlive(session(), at(29 * 60 * 1000), TTL)).toBe(true);
  });

  it('30 daqiqa jimlikdan keyin oʻladi', () => {
    expect(isSessionAlive(session(), at(TTL), TTL)).toBe(false);
  });

  it('bekor qilingan sessiya vaqtidan qatʼi nazar oʻlik', () => {
    expect(isSessionAlive(session({ revokedAt: NOW }), NOW, TTL)).toBe(false);
  });

  it(`${TOUCH_INTERVAL_MS / 1000} soniyadan kam oʻtgan boʻlsa bazaga yozmaydi`, () => {
    expect(shouldTouch(NOW, at(TOUCH_INTERVAL_MS - 1))).toBe(false);
  });

  it('bir daqiqa oʻtgach yozadi', () => {
    expect(shouldTouch(NOW, at(TOUCH_INTERVAL_MS))).toBe(true);
  });

  it('avtomatik chiqishgacha qolgan soniyani beradi', () => {
    expect(secondsUntilIdleLogout(session(), at(25 * 60 * 1000), TTL)).toBe(5 * 60);
  });

  it('muddat oʻtgan boʻlsa manfiy emas, nol qaytaradi', () => {
    expect(secondsUntilIdleLogout(session(), at(TTL + 5000), TTL)).toBe(0);
  });
});
