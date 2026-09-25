import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAdminUser, type AdminUserDetail } from '@/api/adminPeople';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime, formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/operations';
import { USER_STATUS_LABELS, userStatusTone } from '@/lib/people';
import { Card, Notice, PageTitle, Pill } from '@/components/ui';

/**
 * Mijozning kartasi.
 *
 * Qoʻllab-quvvatlash ishi uchun: «bu odam kim, nechta buyurtma bergan,
 * oxirgisi qanday tugagan». Telefon raqami bu yerda ham maskalangan —
 * toʻliq koʻrish roʻyxatdagi alohida amal va u auditga yoziladi.
 */
export function UserDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const query = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => fetchAdminUser(token as string, id as string),
    enabled: Boolean(token && id),
  });

  return (
    <>
      <Link to="/users" className="text-body text-primary underline-offset-2 hover:underline">
        ← Odamlar
      </Link>

      {query.isPending && <p className="mt-16 text-body text-text-secondary">Yuklanmoqda…</p>}

      {query.isError && (
        <Notice>
          {query.error instanceof ApiError
            ? query.error.message
            : 'Foydalanuvchini yuklab boʻlmadi'}
        </Notice>
      )}

      {query.data && <UserCard user={query.data} />}
    </>
  );
}

function UserCard({ user }: { user: AdminUserDetail }) {
  const spent = user.orders.reduce((sum, order) => sum + order.price, 0);

  return (
    <>
      <div className="mt-12">
        <PageTitle
          title={user.fullName ?? 'Ismsiz foydalanuvchi'}
          subtitle={`Roʻyxatdan oʻtgan: ${formatDateTime(user.createdAt)}`}
        />
      </div>

      <div className="mt-16 flex flex-wrap gap-8">
        <Pill tone={userStatusTone(user.status)}>
          {USER_STATUS_LABELS[user.status] ?? user.status}
        </Pill>
        {user.isMaster && <Pill tone="success">Usta hisobi ham bor</Pill>}
      </div>

      <Card className="mt-16 p-20">
        <dl className="grid grid-cols-[auto_1fr] gap-x-16 gap-y-8 text-body">
          <dt className="text-text-secondary">Telefon</dt>
          <dd className="tabular-nums text-text-primary">{user.phoneMasked}</dd>

          <dt className="text-text-secondary">Buyurtmalar</dt>
          <dd className="text-text-primary">{user.ordersCount} ta</dd>

          {/*
            Summa faqat SHU roʻyxatdagi buyurtmalardan — bu «umumiy
            sarflangan pul» EMAS. Shuning uchun yorligʻi ham shunday:
            noaniq raqamni aniqdek koʻrsatish chalgʻitardi.
          */}
          <dt className="text-text-secondary">Oxirgi buyurtmalar summasi</dt>
          <dd className="tabular-nums text-text-primary">{formatPrice(spent)}</dd>
        </dl>
      </Card>

      <section className="mt-24">
        <h2 className="text-h3 text-text-primary">Oxirgi buyurtmalar</h2>

        {user.orders.length === 0 ? (
          <Notice tone="neutral">Hali buyurtma bermagan.</Notice>
        ) : (
          <Card className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-body">
              <thead>
                <tr className="border-b border-border text-left text-caption-strong text-text-secondary">
                  <th className="px-16 py-12">Buyurtma</th>
                  <th className="px-16 py-12">Holat</th>
                  <th className="px-16 py-12 text-right">Summa</th>
                  <th className="px-16 py-12">Sana</th>
                </tr>
              </thead>
              <tbody>
                {user.orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-16 py-12">
                      <Link
                        to={`/orders/${order.id}`}
                        className="tabular-nums text-primary underline-offset-2 hover:underline"
                      >
                        {order.shortId}
                      </Link>
                    </td>
                    <td className="px-16 py-12 text-text-primary">
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </td>
                    <td className="px-16 py-12 text-right tabular-nums text-text-primary">
                      {formatPrice(order.price)}
                    </td>
                    <td className="px-16 py-12 text-text-secondary">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </>
  );
}
