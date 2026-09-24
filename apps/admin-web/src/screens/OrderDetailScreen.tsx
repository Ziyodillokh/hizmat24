import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelAdminOrder,
  fetchAdminOrder,
  requeueOrder,
  type AdminOrderDetail,
} from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime, formatPrice } from '@/lib/format';
import {
  ACTOR_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  paymentLabel,
  reasonProblem,
} from '@/lib/operations';
import { Button, Card, Notice, PageTitle, Pill } from '@/components/ui';

/**
 * Buyurtma kartasi (A3).
 *
 * Eng qimmatli qismi — HOLATLAR TARIXI: kim, qachon va nega oʻzgartirgan.
 * «Nega bu buyurtma bekor boʻldi» degan savolga javob faqat shu yerdan
 * topiladi, chunki holat maydonining oʻzi oxirgi qiymatni koʻrsatadi.
 */
export function OrderDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const query = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => fetchAdminOrder(token as string, id as string),
    enabled: Boolean(token && id),
  });

  return (
    <>
      <Link to="/orders" className="text-body text-primary underline-offset-2 hover:underline">
        ← Buyurtmalar
      </Link>

      {query.isPending && <p className="mt-16 text-body text-text-secondary">Yuklanmoqda…</p>}

      {query.isError && (
        <Notice>
          {query.error instanceof ApiError ? query.error.message : 'Buyurtmani yuklab boʻlmadi'}
        </Notice>
      )}

      {query.data && <OrderCard order={query.data} />}
    </>
  );
}

function OrderCard({ order }: { order: AdminOrderDetail }) {
  const { token } = useAuth();
  const client = useQueryClient();
  const [reason, setReason] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);

  const invalidate = () => {
    void client.invalidateQueries({ queryKey: ['admin', 'order', order.id] });
    void client.invalidateQueries({ queryKey: ['admin', 'orders'] });
  };

  const requeue = useMutation({
    mutationFn: () => requeueOrder(token as string, order.id),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: () => cancelAdminOrder(token as string, order.id, reason.trim()),
    onSuccess: () => {
      setCancelOpen(false);
      setReason('');
      invalidate();
    },
  });

  const reasonError = reason.length > 0 ? reasonProblem(reason) : null;
  const busy = requeue.isPending || cancel.isPending;

  return (
    <>
      <div className="mt-12 flex flex-wrap items-start justify-between gap-16">
        <PageTitle title={order.shortId} subtitle={order.categoryName ?? 'Xizmat koʻrsatilmagan'} />
        <div className="flex items-center gap-8">
          {order.isEscalated && <Pill tone="warning">usta topilmadi</Pill>}
          <Pill tone={ORDER_STATUS_TONES[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Pill>
        </div>
      </div>

      <div className="grid gap-16 md:grid-cols-2">
        <Card className="p-20">
          <h2 className="text-h3 text-text-primary">Buyurtma</h2>
          <dl className="mt-12 grid grid-cols-[auto_1fr] gap-x-16 gap-y-8 text-body">
            <dt className="text-text-secondary">Manzil</dt>
            <dd className="text-text-primary">{order.addressLabel ?? 'koʻrsatilmagan'}</dd>
            <dt className="text-text-secondary">Summa</dt>
            <dd className="text-text-primary">{formatPrice(order.price)}</dd>
            <dt className="text-text-secondary">Toʻlov</dt>
            <dd className="text-text-primary">{paymentLabel(order.paymentMethod)}</dd>
            <dt className="text-text-secondary">Berilgan</dt>
            <dd className="text-text-primary">{formatDateTime(order.createdAt)}</dd>
            {order.scheduledAt && (
              <>
                <dt className="text-text-secondary">Rejalashtirilgan</dt>
                <dd className="text-text-primary">{formatDateTime(order.scheduledAt)}</dd>
              </>
            )}
          </dl>
          <p className="mt-16 whitespace-pre-line text-body text-text-primary">
            {order.description}
          </p>
          {order.workNote && (
            <p className="mt-12 text-body-sm text-text-secondary">
              Ustaning izohi: {order.workNote}
            </p>
          )}
          {order.cancelReason && (
            <p className="mt-12 text-body-sm text-danger">Bekor sababi: {order.cancelReason}</p>
          )}
        </Card>

        <Card className="p-20">
          <h2 className="text-h3 text-text-primary">Tomonlar</h2>
          <dl className="mt-12 grid grid-cols-[auto_1fr] gap-x-16 gap-y-8 text-body">
            <dt className="text-text-secondary">Mijoz</dt>
            <dd className="text-text-primary">{order.clientName ?? '—'}</dd>
            <dt className="text-text-secondary">Telefon</dt>
            <dd className="text-text-primary">{order.clientPhone}</dd>
            <dt className="text-text-secondary">Usta</dt>
            <dd className="text-text-primary">{order.masterName ?? 'tayinlanmagan'}</dd>
            <dt className="text-text-secondary">Usta telefoni</dt>
            <dd className="text-text-primary">{order.masterPhone ?? '—'}</dd>
            <dt className="text-text-secondary">Qidiruv urinishlari</dt>
            <dd className="text-text-primary">{order.assignmentAttempts}</dd>
          </dl>
        </Card>
      </div>

      <Card className="mt-16 p-20">
        <h2 className="text-h3 text-text-primary">Nima boʻldi</h2>
        <p className="mt-4 text-caption text-text-secondary">
          Har bir oʻzgarish: kim qildi va nega. Bu yozuvlar oʻchirilmaydi.
        </p>
        {order.timeline.length === 0 ? (
          <p className="mt-12 text-body text-text-secondary">Hali oʻzgarish boʻlmagan.</p>
        ) : (
          <ol className="mt-12 flex flex-col gap-12">
            {order.timeline.map((entry, index) => (
              <li key={`${entry.createdAt}-${index}`} className="border-l-2 border-border pl-12">
                <p className="text-body text-text-primary">
                  {entry.fromStatus ? `${ORDER_STATUS_LABELS[entry.fromStatus]} → ` : ''}
                  {ORDER_STATUS_LABELS[entry.toStatus]}
                </p>
                <p className="text-caption text-text-secondary">
                  {ACTOR_LABELS[entry.actorType] ?? entry.actorType} ·{' '}
                  {formatDateTime(entry.createdAt)}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {(requeue.isError || cancel.isError) && (
        <div className="mt-16">
          <Notice>
            {(requeue.error ?? cancel.error) instanceof ApiError
              ? ((requeue.error ?? cancel.error) as ApiError).message
              : 'Amal bajarilmadi'}
          </Notice>
        </div>
      )}

      {/*
        Amallar SERVER ruxsatiga qarab chiziladi. Ishlamaydigan tugma
        qoʻyish taqiqlanadi: u bosilganda soʻrov rad etilardi va operator
        nega ekanini taxmin qilib oʻtirardi.
      */}
      <Card className="mt-16 p-20">
        <h2 className="text-h3 text-text-primary">Operator amallari</h2>
        <p className="mt-4 text-caption text-text-secondary">
          Amallar auditga yoziladi va mijoz ilovasida darhol koʻrinadi.
        </p>

        {!order.canRequeue && !order.canCancel ? (
          <p className="mt-16 text-body text-text-secondary">
            {order.cancelBlockedReason ?? 'Bu buyurtmaga aralashish mumkin emas.'}
          </p>
        ) : (
          <div className="mt-16 flex flex-wrap gap-12">
            {order.canRequeue && (
              <Button disabled={busy} onClick={() => requeue.mutate()}>
                {requeue.isPending ? 'Yuborilmoqda…' : 'Qayta qidiruvga qoʻyish'}
              </Button>
            )}
            {order.canCancel && (
              <Button variant="ghost" disabled={busy} onClick={() => setCancelOpen((open) => !open)}>
                Bekor qilish
              </Button>
            )}
          </div>
        )}

        {order.canRequeue === false && order.canCancel && order.requeueBlockedReason && (
          <p className="mt-8 text-caption text-text-secondary">{order.requeueBlockedReason}</p>
        )}

        {cancelOpen && order.canCancel && (
          <div className="mt-16">
            <label className="text-caption-strong text-text-secondary" htmlFor="cancel-reason">
              Bekor qilish sababi — mijoz buni soʻzma-soʻz koʻradi
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="mt-4 w-full rounded-md border border-border bg-surface-elevated px-12 py-8 text-body text-text-primary"
            />
            {reasonError && <p className="mt-4 text-caption text-danger">{reasonError}</p>}
            <Button
              className="mt-12"
              disabled={busy || reasonProblem(reason) !== null}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending ? 'Bekor qilinmoqda…' : 'Buyurtmani bekor qilish'}
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
