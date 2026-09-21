import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchApplications, type ApplicationListItem } from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime } from '@/lib/format';
import { STATUS_FILTERS, STATUS_LABELS, STATUS_TONES, type StatusFilter } from '@/lib/applications';
import { Button, Card, Field, Notice, PageTitle, Pill } from '@/components/ui';

/**
 * Usta arizalari — roʻyxat.
 *
 * Standart filtr «Kutilmoqda»: moderatorning ishi aynan shu, qolganlari
 * tarix. Qidiruv serverda bajariladi (ism yoki telefon) — roʻyxat
 * sahifalangan, brauzerda faqat koʻringan sahifani filtrlash aldardi.
 */
export function ApplicationsScreen() {
  const { token } = useAuth();
  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'applications', status, search, page],
    queryFn: () =>
      fetchApplications(token as string, {
        status: status === 'ALL' ? undefined : status,
        search,
        page,
      }),
    enabled: Boolean(token),
    placeholderData: (previous) => previous,
  });

  const selectStatus = (next: StatusFilter) => {
    setStatus(next);
    setPage(1);
  };

  return (
    <>
      <PageTitle title="Usta arizalari" subtitle="Yangi ustalarni tekshirish va tasdiqlash" />

      <div className="mb-16 flex flex-wrap items-end gap-12">
        <div className="flex gap-4" role="tablist" aria-label="Holat boʻyicha filtr">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.key}
              role="tab"
              aria-selected={status === filter.key}
              variant={status === filter.key ? 'primary' : 'secondary'}
              onClick={() => selectStatus(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <form
          className="min-w-[240px] flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(String(new FormData(event.currentTarget).get('search') ?? ''));
            setPage(1);
          }}
        >
          <Field label="Qidiruv" name="search" placeholder="Ism yoki telefon" defaultValue={search} />
        </form>
      </div>

      {query.isError && (
        <Notice>
          {query.error instanceof ApiError ? query.error.message : 'Roʻyxatni yuklab boʻlmadi'}
        </Notice>
      )}

      {query.isPending && <p className="text-body text-text-secondary">Yuklanmoqda…</p>}

      {query.data && (
        <ApplicationsTable
          items={query.data.items}
          total={query.data.meta.total}
          page={query.data.meta.page}
          totalPages={query.data.meta.totalPages}
          isFetching={query.isFetching}
          onPage={setPage}
        />
      )}
    </>
  );
}

function ApplicationsTable({
  items,
  total,
  page,
  totalPages,
  isFetching,
  onPage,
}: {
  items: ApplicationListItem[];
  total: number;
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPage: (page: number) => void;
}) {
  if (items.length === 0) {
    // Bu HAQIQIY boʻsh holat — server javob berdi va roʻyxat boʻsh.
    // Xato holati yuqorida alohida koʻrsatiladi.
    return (
      <Card className="p-24">
        <p className="text-body-strong text-text-primary">Ariza topilmadi</p>
        <p className="mt-4 text-body text-text-secondary">
          Tanlangan holat va qidiruv boʻyicha hech narsa yoʻq.
        </p>
      </Card>
    );
  }

  return (
    <>
      <p className="mb-12 text-body text-text-secondary">
        {total} ta ariza{isFetching ? ' · yangilanmoqda…' : ''}
      </p>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-body">
          <thead>
            <tr className="border-b border-border text-left text-caption-strong text-text-secondary">
              <th className="px-16 py-12">Ariza beruvchi</th>
              <th className="px-16 py-12">Kasb</th>
              <th className="px-16 py-12">Sertifikat</th>
              <th className="px-16 py-12">Holat</th>
              <th className="px-16 py-12">Yuborilgan</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-neutral-surface">
                <td className="px-16 py-12">
                  <Link
                    to={`/applications/${item.id}`}
                    className="text-body-strong text-primary underline-offset-2 hover:underline"
                  >
                    {item.fullName}
                  </Link>
                  <p className="text-caption text-text-secondary">{item.phoneNumber}</p>
                </td>
                <td className="px-16 py-12 text-text-secondary">{item.profession}</td>
                <td className="px-16 py-12">
                  {/* Daʼvo — tasdiq emas. Yashil belgi chizilmaydi (QOIDA 2). */}
                  {item.claimsCertificate ? (
                    <Pill tone="neutral">daʼvo qiladi · tekshirilmagan</Pill>
                  ) : (
                    <span className="text-caption text-text-secondary">yoʻq</span>
                  )}
                </td>
                <td className="px-16 py-12">
                  <Pill tone={STATUS_TONES[item.status]}>{STATUS_LABELS[item.status]}</Pill>
                </td>
                <td className="px-16 py-12 text-text-secondary">{formatDateTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {totalPages > 1 && (
        <div className="mt-12 flex items-center gap-12">
          <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Oldingi
          </Button>
          <span className="text-caption text-text-secondary">
            {page} / {totalPages}
          </span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
            Keyingi
          </Button>
        </div>
      )}
    </>
  );
}
