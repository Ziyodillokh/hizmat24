import type { ClientAddress } from '@shared/index';

export class CreateOrderCommand {
  constructor(
    readonly clientId: string,
    readonly categoryId: string,
    readonly description: string,
    readonly attachmentUrls: string[],
    readonly isUrgent: boolean,
    readonly clientAddress: ClientAddress,
    readonly idempotencyKey: string | null,
  ) {}
}
