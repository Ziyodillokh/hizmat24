import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMasterDetail, type AdminMasterDetail } from '@/api/adminPeople';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime, formatPrice } from '@/lib/format';
import { EXPERIENCE_LABELS } from '@/lib/applications';
import { MASTER_STATUS_LABELS, ORDER_STATUS_LABELS, percentLabel } from '@/lib/operations';
import { isDefaultWorkHours, shiftLabel, workHoursLabel } from '@/lib/people';
import { Card, Notice, PageTitle, Pill } from '@/components/ui';

/**
 * Ustaning toʻliq kartasi.
 *
 * Eng muhim qoidasi: platforma TASDIQLAGAN maʼlumot ustaning OʻZI
 * AYTGANIDAN ajratib koʻrsatiladi. «Sertifikatim bor» degan daʼvo
 * tasdiq kabi oʻqilsa, panelga qaragan odam notoʻgʻri qaror qabul
 * qilardi.
 */
export function MasterDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();

  const query = useQuery({
    queryKey: ['admin', 'master', id],
    queryFn: () => fetchMasterDetail(token as string, id as string),
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
          {query.error instanceof ApiError ? query.error.message : 'Ustani yuklab boʻlmadi'}
        </Notice>
      )}

      {query.data && <MasterCard master={query.data} />}
    </>
  );
}

/**
 * Holat yorligʻi; notanish qiymatda XOM satr koʻrsatiladi.
 *
 * Server kelajakda yangi holat qoʻshsa, panel «undefined» emas, oʻsha
 * holatning oʻzini koʻrsatsin — admin hech boʻlmasa nima boʻlganini
 * oʻqiy oladi.
 */
const orderStatusLabel = (status: string): string =>
  (ORDER_STATUS_LABELS as Record<string, string>)[status] ?? status;

function MasterCard({ master }: { master: AdminMasterDetail }) {
  return (
    <>
      <div className="mt-12">
        <PageTitle
          title={master.fullName}
          subtitle={`Roʻyxatdan oʻtgan: ${formatDateTime(master.createdAt)}`}
        />
      </div>

      <div className="mt-16 flex flex-wrap gap-8">
        <Pill tone={master.isActive ? 'success' : 'danger'}>
          {master.isActive ? 'Faol' : 'Bloklangan'}
        </Pill>
        <Pill tone={master.isOnShift ? 'success' : 'neutral'}>{shiftLabel(master.isOnShift)}</Pill>
        <Pill>{MASTER_STATUS_LABELS[master.status] ?? master.status}</Pill>
        <Pill>{EXPERIENCE_LABELS[master.experienceLevel] ?? master.experienceLevel}</Pill>
        {master.hasGovCertificate && <Pill tone="success">Sertifikat tasdiqlangan</Pill>}
        {master.userId === null && <Pill tone="warning">Ilova hisobi ulanmagan</Pill>}
      </div>

      <Card className="mt-16 p-20">
        <dl className="grid grid-cols-[auto_1fr] gap-x-16 gap-y-8 text-body">
          <dt className="text-text-secondary">Telefon</dt>
          <dd className="tabular-nums text-text-primary">{master.phoneMasked}</dd>

          <dt className="text-text-secondary">Reyting</dt>
          <dd className="text-text-primary">
            {master.ratingCount === 0
              ? 'Hali baho yoʻq'
              : `${master.ratingAvg.toFixed(2)} · ${master.ratingCount} ta baho`}
          </dd>

          <dt className="text-text-secondary">Bajarilgan ish</dt>
          <dd className="text-text-primary">{master.completedOrdersCount} ta</dd>

          <dt className="text-text-secondary">Usta bekor qilgan</dt>
          <dd className="text-text-primary">
            {master.cancelledByMasterCount} ta · {percentLabel(master.cancelRatePercent)}
          </dd>

          <dt className="text-text-secondary">Yoqilgan xizmatlar</dt>
          <dd className="text-text-primary">
            {master.categories.length === 0 ? 'Hech qaysi' : master.categories.join(', ')}
          </dd>
        </dl>
      </Card>

      {/*
        Ustaning OʻZI aytgani — tasdiqlangan koʻrsatkichlardan ALOHIDA
        kartada. Bir kartada tursa, «oʻzim haqimda» matni reyting bilan
        bir xil ishonch darajasida oʻqilardi.
      */}
      <section className="mt-24">
        <h2 className="text-h3 text-text-primary">Arizadagi maʼlumotlar</h2>
        <p className="mt-4 text-caption text-text-secondary">
          Bu maʼlumotlar TASDIQLANMAGAN — ularni usta arizasida oʻzi yozgan.
          Usta ularni keyin oʻzgartira olmaydi.
        </p>

        {master.profile === null ? (
          <Notice tone="neutral">Profil hali toʻldirilmagan.</Notice>
        ) : (
          <Card className="mt-12 p-20">
            <dl className="grid grid-cols-[auto_1fr] gap-x-16 gap-y-8 text-body">
              <dt className="text-text-secondary">Ish vaqti</dt>
              <dd className="text-text-primary">
                {workHoursLabel(master.profile.workFrom, master.profile.workTo)}
                {/*
                  Arizada vaqt soʻralmagan boʻlishi mumkin — unda
                  platformaning standarti saqlanadi. Buni aytmasak,
                  standart qiymat ustaning gapi kabi oʻqilardi.
                */}
                {isDefaultWorkHours(master.profile.workFrom, master.profile.workTo) && (
                  <span className="text-text-secondary"> · platforma standarti</span>
                )}
              </dd>

              <dt className="text-text-secondary">Tumanlar</dt>
              <dd className="text-text-primary">
                {master.profile.districts.length === 0
                  ? 'Koʻrsatilmagan'
                  : master.profile.districts.join(', ')}
              </dd>

              <dt className="text-text-secondary">Sertifikat daʼvosi</dt>
              <dd className="text-text-primary">
                {master.profile.claimsCertificate ? 'Bor deb aytgan' : 'Yoʻq'}
                {master.profile.claimsCertificate && !master.hasGovCertificate && (
                  <span className="text-warning"> · hali tasdiqlanmagan</span>
                )}
              </dd>
            </dl>

            {master.profile.about.trim().length > 0 && (
              <p className="mt-16 whitespace-pre-line text-body text-text-primary">
                {master.profile.about}
              </p>
            )}
          </Card>
        )}
      </section>

      <section className="mt-24">
        <h2 className="text-h3 text-text-primary">Oxirgi ishlar</h2>
        {master.orders.length === 0 ? (
          <Notice tone="neutral">Hali ish yoʻq.</Notice>
        ) : (
          <Card className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-body">
              <thead>
                <tr className="border-b border-border text-left text-caption-strong text-text-secondary">
                  <th className="px-16 py-12">Buyurtma</th>
                  <th className="px-16 py-12">Xizmat</th>
                  <th className="px-16 py-12">Holat</th>
                  <th className="px-16 py-12 text-right">Summa</th>
                  <th className="px-16 py-12">Sana</th>
                </tr>
              </thead>
              <tbody>
                {master.orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-16 py-12">
                      <Link
                        to={`/orders/${order.id}`}
                        className="tabular-nums text-primary underline-offset-2 hover:underline"
                      >
                        {order.shortId}
                      </Link>
                    </td>
                    <td className="px-16 py-12 text-text-primary">{order.categoryName ?? '—'}</td>
                    <td className="px-16 py-12 text-text-primary">
                      {orderStatusLabel(order.status)}
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

      <section className="mt-24">
        <h2 className="text-h3 text-text-primary">Mijozlar bahosi</h2>
        {master.reviews.length === 0 ? (
          <Notice tone="neutral">Hali baho yoʻq.</Notice>
        ) : (
          <div className="mt-12 flex flex-col gap-12">
            {master.reviews.map((review) => (
              <Card key={review.orderShortId} className="p-16">
                <div className="flex flex-wrap items-center gap-8">
                  <Pill tone={review.stars >= 4 ? 'success' : 'warning'}>{review.stars} ★</Pill>
                  <span className="tabular-nums text-caption text-text-secondary">
                    {review.orderShortId}
                  </span>
                  <span className="text-caption text-text-secondary">
                    {formatDateTime(review.createdAt)}
                  </span>
                </div>

                {review.tags.length > 0 && (
                  <p className="mt-8 text-caption text-text-secondary">{review.tags.join(' · ')}</p>
                )}

                {/* Mijozning gapi — oʻzgartirilmaydi va qisqartirilmaydi. */}
                {review.comment && (
                  <p className="mt-8 whitespace-pre-line text-body text-text-primary">
                    {review.comment}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
