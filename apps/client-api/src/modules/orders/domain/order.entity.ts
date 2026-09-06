import { CancelledBy, OrderStatus } from '@prisma/client';
import { HttpStatus } from '@nestjs/common';
import {
  DomainException,
  ForbiddenResourceException,
} from '@client/common/exceptions/domain.exception';
import { assertTransition } from './order-state-machine';
import {
  CLIENT_CANCELLABLE_STATUSES,
  MASTER_PHONE_VISIBLE_STATUSES,
  TERMINAL_STATUSES,
} from './order-status.enum';

export interface OrderProps {
  id: string;
  clientId: string;
  masterId: string | null;
  categoryId: string;
  status: OrderStatus;
  isUrgent: boolean;
  price: number;
  queuePosition: number | null;
  assignmentAttempts: number;
  masterAckedAt: Date | null;
  createdAt: Date;
}

/**
 * Order agregati. Holat o'tishlari FAQAT shu yerda tekshiriladi —
 * controller yoki service qatlamida `if (status === ...)` orqali tekshiruv yozilmaydi (9.3).
 */
export class OrderEntity {
  private constructor(private props: OrderProps) {}

  static fromPersistence(props: OrderProps): OrderEntity {
    return new OrderEntity({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get masterId(): string | null {
    return this.props.masterId;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get isUrgent(): boolean {
    return this.props.isUrgent;
  }

  get assignmentAttempts(): number {
    return this.props.assignmentAttempts;
  }

  get isTerminal(): boolean {
    return TERMINAL_STATUSES.includes(this.props.status);
  }

  /** Usta telefon raqami ayni damda mijozga ko'rinishi kerakmi (6.2). */
  get isMasterPhoneVisible(): boolean {
    return MASTER_PHONE_VISIBLE_STATUSES.includes(this.props.status);
  }

  /**
   * Resurs egaligini tekshirish (6.1) — autentifikatsiya emas, avtorizatsiya.
   * Boshqa mijozning buyurtmasi 403 bilan rad etiladi.
   */
  assertOwnedBy(userId: string): void {
    if (this.props.clientId !== userId) {
      throw new ForbiddenResourceException('Bu buyurtma sizga tegishli emas');
    }
  }

  /**
   * Yangi holatga o'tish. Grafda ruxsat etilmagan bo'lsa —
   * `InvalidStateTransitionException`.
   */
  transitionTo(next: OrderStatus): OrderEntity {
    assertTransition(this.props.status, next);
    return new OrderEntity({ ...this.props, status: next });
  }

  /** Mijoz tomonidan bekor qilish (3.6, 5.5). */
  cancelByClient(): OrderEntity {
    if (!CLIENT_CANCELLABLE_STATUSES.includes(this.props.status)) {
      throw new DomainException(
        'CANCEL_NOT_ALLOWED',
        "Ish boshlangandan keyin buyurtmani ilova orqali bekor qilib bo'lmaydi — " +
          "iltimos, qo'llab-quvvatlash xizmatiga murojaat qiling",
        HttpStatus.FORBIDDEN,
        { status: this.props.status },
      );
    }

    return this.transitionTo(OrderStatus.CANCELLED);
  }

  cancelledByValue(): CancelledBy {
    return CancelledBy.CLIENT;
  }

  /** Usta tasdiqlandi → ish rasman boshlanadi (3.7). */
  confirmMaster(): OrderEntity {
    return this.transitionTo(OrderStatus.IN_PROGRESS);
  }

  /**
   * "Bu men chaqirgan usta emas" — ish HECH QANDAY holatda in_progress'ga o'tmaydi (3.7).
   * SAFETY_FLAGGED terminal holat, undan chiqish yo'li yo'q.
   */
  flagSafety(): OrderEntity {
    return this.transitionTo(OrderStatus.SAFETY_FLAGGED);
  }

  /** Ustaga tayinlash urinishi. */
  assignTo(masterId: string): OrderEntity {
    const assigned = this.transitionTo(OrderStatus.ASSIGNED);
    return new OrderEntity({
      ...assigned.props,
      masterId,
      queuePosition: null,
      assignmentAttempts: this.props.assignmentAttempts + 1,
      masterAckedAt: null,
    });
  }

  /** Navbatga qo'yish. */
  enqueue(position: number): OrderEntity {
    const queued = this.transitionTo(OrderStatus.SEARCHING_QUEUED);
    return new OrderEntity({ ...queued.props, masterId: null, queuePosition: position });
  }

  /** Usta 3 daqiqada javob bermadi → qidiruvni qaytadan boshlash (3.4). */
  releaseForReassignment(): OrderEntity {
    const searching = this.transitionTo(OrderStatus.SEARCHING);
    return new OrderEntity({ ...searching.props, masterId: null, masterAckedAt: null });
  }

  toSnapshot(): OrderProps {
    return { ...this.props };
  }
}
