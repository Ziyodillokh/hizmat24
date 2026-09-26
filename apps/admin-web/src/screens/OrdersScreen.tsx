import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminOrders, fetchEscalatedOrders, type AdminOrderRow } from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime, formatPrice } from '@/lib/format';
import {
  ORDER_FILTERS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  rowTone,
  type OrderStatusFilter,
  searchParam,
  searchProblem,
} from '@/lib/operations';
import { Button, Card, Field, Notice, PageTitle, Pill } from '@/components/ui';

/** Eskalatsiya va ochiq signallar tez oʻzgaradi — hisoblagich oʻzi yangilanadi. */
const LIVE_REFRESH_MS = 5_000;

/**
 * Buyurtmalar monitoringi (A3).
 *
 * Operator butun oqimni koʻradi. Tepada eskalatsiya navbati: usta
 * topilmagan buyurtmalar alohida turadi, chunki kun boshida aynan
 * ular bilan ishlanadi.
 *
 * Jonli yangilanish WS emas, TAKRORIY SOʻROV bilan: panelda alohida WS
 * kanali yoʻq va uni faqat hisoblagich uchun qurish ortiqcha edi. Soʻrov
 * — bitta `COUNT`, u ham 5 soniyada bir marta.
 */
/** Server ham shu chegarani ishlatadi (`admin-orders.service.ts`). */
const PAGE_SIZE = 50;

export function OrdersScreen() {
  const { token } = useAuth();
  const [filter, setFilter] = useState<OrderStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  /*
   * Filtr yoki qidiruv oʻzgarganda sahifa birinchiga qaytadi: aks holda
   * 5-sahifada turib filtrni almashtirsangiz, bitta sahifalik natijada
   * boʻsh jadval koʻrinardi.
   */
  const applyFilter = (next: OrderStatusFilter) => {
    setFilter(next);
    setPage(1);
  };

  const applySearch = (next: string) => {
    setSearch(next);
    setPage(1);
  };

  const orders = useQuery({
    queryKey: ['admin', 'orders', filter, search, page],
    queryFn: () =>
      fetchAdminOrders(token as string, {
        status: filter === 'ALL' ? undefined : filter,
        search: searchParam(search),
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    enabled: Boolean(token),
    refetchInterval: LIVE_REFRESH_MS,
  });

  const escalated = useQuery({
    queryKey: ['admin', 'orders', 'escalated'],
    queryFn: () => fetchEscalatedOrders(token as string),
    enabled: Boolean(token),
    refetchInterval: LIVE_REFRESH_MS,
  });

  const escalatedCount = orders.data?.escalatedCount ?? 0;
  // Qisqa matn serverga UMUMAN yuborilmaydi — u 400 qaytarardi va
  // soʻrov har 5 soniyada takrorlanib turardi.
  const searchHint = searchProblem(search);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-16">
        <PageTitle
          title="Buyurtmalar"
          subtitle="Jonli oqim: usta topilmagan va tiqilib qolgan buyurtmalar shu yerda"
        />
        {escalatedCount > 0 && <Pill tone="warning">{escalatedCount} ta usta topilmadi</Pill>}
      </div>

      {escalated.data && escalated.data.length > 0 && (
        <Card className="mb-16 p-20">
          <h2 className="text-h3 text-text-primary">Usta topilmagan buyurtmalar</h2>
          <p className="mt-4 text-caption text-text-secondary">
            Qidiruv urinishlari tugadi. «Qayta qidiruv» tugmasi buyurtma kartasida.
          </p>
          <ul className="mt-12 flex flex-col gap-8">
            {escalated.data.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-8">
                <Link
                  to={`/orders/${order.id}`}
                  className="text-body-strong text-primary underline-offset-2 hover:underline"
                >
                  {order.shortId}
                </Link>
                <span className="text-caption text-text-secondary">
                  {order.categoryName ?? '—'} · {order.addressLabel ?? 'manzil yoʻq'} ·{' '}
                  {order.assignmentAttempts} urinish
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-16 flex flex-wrap items-end gap-12">
        <div className="flex flex-wrap gap-8">
          {ORDER_FILTERS.map((item) => (
            <Button
              key={item.key}
              variant={filter === item.key ? 'primary' : 'ghost'}
              onClick={() => applyFilter(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="min-w-[240px] flex-1">
          <Field
            label="Qidiruv"
            value={search}
            onChange={(event) => applySearch(event.target.value)}
            placeholder="HZ-104901 yoki +998901234567"
            hint={searchHint ?? 'Buyurtma raqami yoki mijoz telefoni'}
          />
        </div>
      </div>

      {orders.isPending && <p className="text-body text-text-secondary">Yuklanmoqda…</p>}

      {orders.isError && (
        <Notice>
          {orders.error instanceof ApiError ? orders.error.message : 'Roʻyxatni yuklab boʻlmadi'}
        </Notice>
      )}

      {orders.data && (
        <OrdersTable
          page={orders.data.items}
          total={orders.data.total}
          pageNumber={page}
          onPage={setPage}
        />
      )}
    </>
  );
}

function OrdersTable({
  page,
  total,
  pageNumber,
  onPage,
}: {
  page: AdminOrderRow[];
  total: number;
  pageNumber: number;
  onPage: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  /*
   * Boʻsh sahifa va boʻsh natija — IKKI XIL holat. Ikkinchi sahifada
   * turib roʻyxat qisqarsa, «topilmadi» degan xabar notoʻgʻri boʻlardi:
   * yozuvlar bor, faqat bu sahifada emas.
   */
  if (page.length === 0 && pageNumber > 1) {
    return (
      <Notice tone="neutral">
        Bu sahifada yozuv qolmadi.{' '}
        <button type="button" onClick={() => onPage(1)} className="underline">
          Birinchi sahifaga qaytish
        </button>
      </Notice>
    );
  }

  if (page.length === 0) {
    return <Notice tone="neutral">Bu filtr boʻyicha buyurtma topilmadi.</Notice>;
  }

  return (
    <>
      <p className="mb-12 text-body text-text-secondary">
        {total} ta yozuv
        {totalPages > 1 && ` — ${pageNumber} / ${totalPages}-sahifa`}
      </p>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-body">
          <thead>
            <tr className="border-b border-border text-left text-caption-strong text-text-secondary">
              <th className="px-16 py-12">Buyurtma</th>
              <th className="px-16 py-12">Holat</th>
              <th className="px-16 py-12">Mijoz</th>
              <th className="px-16 py-12">Usta</th>
              <th className="px-16 py-12 text-right">Summa</th>
              <th className="px-16 py-12">Berilgan</th>
            </tr>
          </thead>
          <tbody>
            {page.map((order) => {
              const tone = rowTone(order);
              return (
                <tr
                  key={order.id}
                  className={`border-b border-border last:border-0 hover:bg-neutral-surface ${
                    tone === 'danger'
                      ? 'bg-danger-surface'
                      : tone === 'warning'
                        ? 'bg-warning-surface'
                        : ''
                  }`}
                >
                  <td className="px-16 py-12">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-body-strong text-primary underline-offset-2 hover:underline"
                    >
                      {order.shortId}
                    </Link>
                    <p className="text-caption text-text-secondary">
                      {order.categoryName ?? '—'}
                      {order.isUrgent ? ' · shoshilinch' : ''}
                    </p>
                  </td>
                  <td className="px-16 py-12">
                    <Pill tone={ORDER_STATUS_TONES[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Pill>
                    {order.isEscalated && (
                      <p className="mt-4 text-caption text-text-secondary">
                        {order.assignmentAttempts} urinish
                      </p>
                    )}
                  </td>
                  <td className="px-16 py-12 text-text-secondary">
                    {order.clientName ?? '—'}
                    <p className="text-caption">{order.clientPhone}</p>
                  </td>
                  <td className="px-16 py-12 text-text-secondary">{order.masterName ?? '—'}</td>
                  <td className="px-16 py-12 text-right tabular-nums text-text-primary">
                    {formatPrice(order.price)}
                  </td>
                  <td className="px-16 py-12 text-caption text-text-secondary">
                    {formatDateTime(order.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="mt-12 flex items-center gap-12">
          <Button variant="secondary" disabled={pageNumber <= 1} onClick={() => onPage(pageNumber - 1)}>
            Oldingi
          </Button>
          <span className="text-caption text-text-secondary">
            {pageNumber} / {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={pageNumber >= totalPages}
            onClick={() => onPage(pageNumber + 1)}
          >
            Keyingi
          </Button>
        </div>
      )}
    </>
  );
}
