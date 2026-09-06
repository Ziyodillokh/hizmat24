export class ConfirmMasterCommand {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly confirmed: boolean,
    readonly note: string | null,
    readonly ipAddress: string | null,
    readonly userAgent: string | null,
  ) {}
}
