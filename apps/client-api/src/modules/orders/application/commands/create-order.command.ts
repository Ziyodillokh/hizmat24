import type { ApiPaymentMethod, ClientAddress } from '@shared/index';

export class CreateOrderCommand {
  constructor(
    readonly clientId: string,
    readonly categoryId: string,
    readonly description: string,
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
