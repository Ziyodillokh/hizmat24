export class CancelOrderCommand {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly reason: string,
  ) {}
}
