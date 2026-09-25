import type { ApiPaymentMethod, ClientAddress } from '@shared/index';

export class CreateOrderCommand {
  constructor(
    readonly clientId: string,
    readonly categoryId: string,
    /** Mijozning izohi — boʻsh boʻlishi mumkin (alohida qadam yoʻq). */
    readonly description: string,
    /** Nechta xuddi shu ish. Kamida 1. */
    readonly quantity: number,
    readonly attachmentUrls: string[],
    readonly isUrgent: boolean,
    readonly clientAddress: ClientAddress,
    readonly idempotencyKey: string | null,
    readonly paymentMethod: ApiPaymentMethod,
    /** `null` — "imkon qadar tez". */
    readonly scheduledAt: Date | null,
    /** Mijoz soʻragan usta — SOʻROV, kafolat emas. */
    readonly preferredMasterId: string | null,
  ) {}
}
