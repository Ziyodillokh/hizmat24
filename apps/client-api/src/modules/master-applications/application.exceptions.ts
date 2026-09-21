import { HttpStatus } from '@nestjs/common';
import type { MasterApplicationStatus } from '@prisma/client';
import { DomainException } from '@client/common/exceptions/domain.exception';

/** Ariza mazmuni qoidalarga mos emas — muammolar roʻyxati bilan qaytariladi. */
export class InvalidApplicationException extends DomainException {
  constructor(problems: readonly string[]) {
    super('APPLICATION_INVALID', 'Ariza toʻldirilishida kamchilik bor', HttpStatus.BAD_REQUEST, {
      problems,
    });
  }
}

export class ApplicationNotFoundException extends DomainException {
  constructor(applicationId: string) {
    super('APPLICATION_NOT_FOUND', 'Ariza topilmadi', HttpStatus.NOT_FOUND, { applicationId });
  }
}

/** Bir vaqtda faqat bitta koʻrib chiqilmagan ariza boʻladi. */
export class DuplicatePendingApplicationException extends DomainException {
  constructor() {
    super(
      'APPLICATION_ALREADY_PENDING',
      'Sizning arizangiz allaqachon koʻrib chiqilmoqda — javobni kuting',
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidApplicationTransitionException extends DomainException {
  constructor(from: MasterApplicationStatus, to: MasterApplicationStatus) {
    super(
      'APPLICATION_INVALID_TRANSITION',
      'Bu ariza allaqachon koʻrib chiqilgan',
      HttpStatus.CONFLICT,
      { from, to },
    );
  }
}

/** Soʻralgan yoki tanlangan xizmat katalogda yoʻq (yoki oʻchirilgan). */
export class UnknownServiceCategoryException extends DomainException {
  constructor(categoryIds: readonly string[]) {
    super(
      'UNKNOWN_SERVICE_CATEGORY',
      'Tanlangan xizmatlardan biri katalogda yoʻq yoki oʻchirilgan',
      HttpStatus.BAD_REQUEST,
      { categoryIds },
    );
  }
}

const MASTER_LINK_MESSAGES = {
  ALREADY_MASTER: 'Bu foydalanuvchi allaqachon usta sifatida roʻyxatdan oʻtgan',
  PHONE_TAKEN: 'Bu telefon raqami boshqa usta hisobiga biriktirilgan',
} as const;

export type MasterLinkConflictCode = keyof typeof MASTER_LINK_MESSAGES;

export class MasterLinkConflictException extends DomainException {
  constructor(code: MasterLinkConflictCode) {
    super(code, MASTER_LINK_MESSAGES[code], HttpStatus.CONFLICT);
  }
}
