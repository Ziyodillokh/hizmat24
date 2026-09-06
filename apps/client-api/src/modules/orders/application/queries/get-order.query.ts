export class GetOrderQuery {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
  ) {}
}

export class GetOrderEtaQuery {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
  ) {}
}

export class GetOrderReceiptQuery {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
  ) {}
}

export class ListOrderHistoryQuery {
  constructor(
    readonly clientId: string,
    readonly page: number,
    readonly limit: number,
  ) {}
}
