import { HttpException, HttpStatus } from '@nestjs/common';
import type { OrderStatus } from '@prisma/client';

export class DomainException extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    readonly details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}

/** Order agregatida ruxsat etilmagan holat o'tishi (9.4). */
export class InvalidStateTransitionException extends DomainException {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(
      'INVALID_STATE_TRANSITION',
      `Buyurtma holatini "${from}" dan "${to}" ga o'tkazish mumkin emas`,
      HttpStatus.CONFLICT,
      { from, to },
    );
  }
}

export class OrderNotFoundException extends DomainException {
  constructor(orderId: string) {
    super('ORDER_NOT_FOUND', 'Buyurtma topilmadi', HttpStatus.NOT_FOUND, { orderId });
  }
}

export class ForbiddenResourceException extends DomainException {
  constructor(message = "Bu resursga ruxsatingiz yo'q") {
    super('FORBIDDEN_RESOURCE', message, HttpStatus.FORBIDDEN);
  }
}

export class ConflictException extends DomainException {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, HttpStatus.CONFLICT, details);
  }
}
