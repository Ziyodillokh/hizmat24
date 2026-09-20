import { AdminRole } from '@prisma/client';
import { ADMIN_SECTIONS, canAccess, sectionsFor } from './admin-permissions';

describe('admin ruxsatlari', () => {
  it('SUPERADMIN barcha boʻlimlarni koʻradi', () => {
    expect(sectionsFor(AdminRole.SUPERADMIN)).toEqual([...ADMIN_SECTIONS]);
  });

  it('OPERATOR katalogga kira olmaydi (A1 qabul sharti)', () => {
    expect(canAccess(AdminRole.OPERATOR, 'catalog')).toBe(false);
    expect(sectionsFor(AdminRole.OPERATOR)).not.toContain('catalog');
  });

  it('OPERATOR usta arizalarini koʻrmaydi — bu moderator ishi', () => {
    expect(canAccess(AdminRole.OPERATOR, 'applications')).toBe(false);
  });

  it('MODERATOR faqat panel boshi va arizalarni koʻradi', () => {
    expect(sectionsFor(AdminRole.MODERATOR)).toEqual(['dashboard', 'applications']);
  });

  it('adminlarni boshqarish faqat SUPERADMIN da', () => {
    expect(sectionsFor(AdminRole.OPERATOR)).not.toContain('admins');
    expect(sectionsFor(AdminRole.MODERATOR)).not.toContain('admins');
  });

  it('har bir rol kamida bitta boʻlimni koʻradi — kirgan odam boʻsh ekranga tushmaydi', () => {
    for (const role of Object.values(AdminRole)) {
      expect(sectionsFor(role).length).toBeGreaterThan(0);
    }
  });

  it('har bir boʻlimga kamida bitta rol kira oladi — yetim boʻlim qolmaydi', () => {
    for (const section of ADMIN_SECTIONS) {
      expect(Object.values(AdminRole).some((role) => canAccess(role, section))).toBe(true);
    }
  });
});
