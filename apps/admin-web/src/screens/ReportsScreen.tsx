import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchAdminStats,
  fetchAudit,
  fetchAuditCsv,
  type AdminStats,
  type AuditRow,
} from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime } from '@/lib/format';
import {
  assignSecondsLabel,
  auditActionLabel,
  AUDIT_ACTION_FILTERS,
  ACTOR_LABELS,
  ORDER_STATUS_LABELS,
} from '@/lib/operations';
import { Button, Card, Notice, PageTitle, Pill } from '@/components/ui';

/**
 * Hisobotlar va audit (A7).
 *
 * «Bugun nima boʻldi» degan savolga bitta ekranda javob. Raqamlar
 * keshsiz: eskirgan son bu ekranda eng yomon xato boʻlardi.
 *
 * Maʼlumot boʻlmagan davrda grafik oʻrniga ochiq matn yoziladi —
 * boʻsh diagramma «nol» degan yolgʻon maʼnoni berardi.
 */
export function ReportsScreen() {
  const { token } = useAuth();
  const [action, setAction] = useState<string>('');

  const stats = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => fetchAdminStats(token as string),
    enabled: Boolean(token),
    refetchInterval: 10_000,
  });

  /*
   * CSV oddiy havola bilan yuklanmaydi: soʻrovga `Authorization`
   * sarlavhasi kerak. Tokenni URL ga yozish mumkin edi, lekin u
   * brauzer tarixida va server jurnalida qolib ketardi.
   */
  const csv = useMutation({
    mutationFn: () => fetchAuditCsv(token as string, { action: action || undefined }),
    onSuccess: (text) => {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'audit.csv';
      link.click();
      URL.revokeObjectURL(url);
    },
  });

  const audit = useQuery({
    queryKey: ['admin', 'audit', action],
    queryFn: () => fetchAudit(token as string, { action: action || undefined, limit: 100 }),
    enabled: Boolean(token),
  });

  return (
    <>
      <PageTitle title="Hisobotlar" subtitle="Bugungi raqamlar, ochiq muammolar va audit izi" />

      {stats.isError && (
        <Notice>
          {stats.error instanceof ApiError ? stats.error.message : 'Raqamlarni yuklab boʻlmadi'}
        </Notice>
      )}

      {stats.data && <StatsBlock stats={stats.data} />}

      {csv.isError && (
        <div className="mt-16">
          <Notice>
            {csv.error instanceof ApiError ? csv.error.message : 'CSV yuklab boʻlmadi'}
          </Notice>
        </div>
      )}

      <div className="mt-24 flex flex-wrap items-center justify-between gap-12">
        <h2 className="text-h3 text-text-primary">Audit izi</h2>
        <Button variant="ghost" disabled={csv.isPending} onClick={() => csv.mutate()}>
          {csv.isPending ? 'Tayyorlanmoqda…' : 'CSV yuklab olish'}
        </Button>
      </div>
      <p className="mt-4 text-caption text-text-secondary">
        Bu yozuvlar oʻchirilmaydi — baza darajasida taqiqlangan.
      </p>

      <div className="mt-12 flex flex-wrap gap-8">
        <Button variant={action === '' ? 'primary' : 'ghost'} onClick={() => setAction('')}>
          Hammasi
        </Button>
        {AUDIT_ACTION_FILTERS.map((key) => (
          <Button
            key={key}
            variant={action === key ? 'primary' : 'ghost'}
            onClick={() => setAction(key)}
          >
            {auditActionLabel(key)}
          </Button>
        ))}
      </div>

      {audit.isPending && <p className="mt-16 text-body text-text-secondary">Yuklanmoqda…</p>}

      {/* Panelning boshqa roʻyxatlarida bor, bu yerda unutilgan edi. */}
      {audit.isError && (
        <div className="mt-16">
          <Notice>
            {audit.error instanceof ApiError ? audit.error.message : 'Jurnalni yuklab boʻlmadi'}
          </Notice>
        </div>
      )}

      {audit.data && <AuditTable rows={audit.data.items} total={audit.data.total} />}
    </>
  );
}

function StatsBlock({ stats }: { stats: AdminStats }) {
  const problems = stats.openProblems;
  const hasProblems =
    problems.escalatedOrders + problems.openSafetyAlerts + problems.pendingApplications > 0;

  return (
    <>
      <div className="grid gap-16 md:grid-cols-3">
        <Card className="p-20">
          <p className="text-caption-strong text-text-secondary">Bugungi buyurtmalar</p>
          <p className="mt-4 text-h1 text-text-primary">{stats.ordersTotal}</p>
          <p className="mt-8 text-caption text-text-secondary">
            Oʻrtacha tayinlash: {assignSecondsLabel(stats.avgAssignSeconds)}
          </p>
        </Card>
        <Card className="p-20">
          <p className="text-caption-strong text-text-secondary">Ustalar</p>
          <p className="mt-4 text-h1 text-text-primary">{stats.mastersOnShift}</p>
          <p className="mt-8 text-caption text-text-secondary">
            smenada · jami faol: {stats.mastersActive}
          </p>
        </Card>
        <Card className="p-20">
          <p className="text-caption-strong text-text-secondary">Ochiq muammolar</p>
          {hasProblems ? (
            <ul className="mt-8 flex flex-col gap-4 text-body text-text-primary">
              {problems.escalatedOrders > 0 && <li>{problems.escalatedOrders} ta usta topilmadi</li>}
              {problems.openSafetyAlerts > 0 && (
                <li>{problems.openSafetyAlerts} ta xavfsizlik signali</li>
              )}
              {problems.pendingApplications > 0 && (
                <li>{problems.pendingApplications} ta ariza kutmoqda</li>
              )}
            </ul>
          ) : (
            <p className="mt-8 text-body text-text-secondary">Ochiq muammo yoʻq.</p>
          )}
        </Card>
      </div>

      <div className="mt-16 grid gap-16 md:grid-cols-3">
        <CountCard
          title="Holat boʻyicha"
          rows={stats.byStatus.map((row) => ({
            name: ORDER_STATUS_LABELS[row.status] ?? row.status,
            count: row.count,
          }))}
        />
        <CountCard title="Xizmat boʻyicha" rows={stats.byCategory} />
        <CountCard title="Bekor qilish sabablari" rows={stats.cancelReasons} />
      </div>
    </>
  );
}

function CountCard({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  return (
    <Card className="p-20">
      <p className="text-caption-strong text-text-secondary">{title}</p>
      {rows.length === 0 ? (
        // Boʻsh diagramma «nol» degan yolgʻon maʼnoni berardi.
        <p className="mt-8 text-body text-text-secondary">Bu davrda maʼlumot yoʻq.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.map((row) => (
            <li key={row.name} className="flex justify-between gap-12 text-body">
              <span className="text-text-secondary">{row.name}</span>
              <span className="tabular-nums text-text-primary">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function AuditTable({ rows, total }: { rows: AuditRow[]; total: number }) {
  if (rows.length === 0) {
    return <Notice tone="neutral">Bu filtr boʻyicha yozuv yoʻq.</Notice>;
  }

  return (
    <>
      <p className="mb-12 mt-12 text-body text-text-secondary">{total} ta yozuv</p>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-body">
          <thead>
            <tr className="border-b border-border text-left text-caption-strong text-text-secondary">
              <th className="px-16 py-12">Vaqt</th>
              <th className="px-16 py-12">Amal</th>
              <th className="px-16 py-12">Kim</th>
              <th className="px-16 py-12">Tafsilot</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-16 py-12 text-caption text-text-secondary">
                  {formatDateTime(row.createdAt)}
                </td>
                <td className="px-16 py-12 text-text-primary">{auditActionLabel(row.action)}</td>
                <td className="px-16 py-12">
                  <Pill>{ACTOR_LABELS[row.actorType] ?? row.actorType}</Pill>
                </td>
                <td className="max-w-[420px] break-words px-16 py-12 text-caption text-text-secondary">
                  {row.metadata ? JSON.stringify(row.metadata) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
