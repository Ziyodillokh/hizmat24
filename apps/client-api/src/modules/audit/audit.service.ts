import { Injectable } from '@nestjs/common';
import { ActorType, AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '@client/infra/prisma/prisma.service';

export interface AuditEntry {
  action: AuditAction;
  orderId?: string | null;
  actorType: ActorType;
  actorId?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

type TxClient = Prisma.TransactionClient;

/**
 * Append-only audit log (6.4, 9.7).
 * UPDATE/DELETE DB trigger orqali bloklangan — bu yerda faqat `create` bor.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry, tx?: TxClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        action: entry.action,
        orderId: entry.orderId ?? null,
        actorType: entry.actorType,
        actorId: entry.actorId ?? null,
        fromStatus: entry.fromStatus ?? null,
        toStatus: entry.toStatus ?? null,
        metadata: entry.metadata ?? Prisma.JsonNull,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  }
}
