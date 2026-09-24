import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchSafetyAlerts,
  resolveSafetyAlert,
  setMasterBlocked,
  type SafetyAlert,
  type SafetyResolution,
} from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime } from '@/lib/format';
import {
  ALERT_STATUS_LABELS,
  NOTE_MAX,
  NOTE_MIN,
  reasonProblem,
  SAFETY_RESOLUTION_LABELS,
  SAFETY_RESOLUTIONS,
} from '@/lib/operations';
import { Button, Card, Notice, PageTitle, Pill } from '@/components/ui';

/** Signal eng shoshilinch narsa — roʻyxat oʻzi yangilanadi. */
const LIVE_REFRESH_MS = 3_000;

/**
 * Xavfsizlik signallari (A4).
 *
 * Mijoz eshik oldida «Bu men chaqirgan usta emas» deganda buyurtma
 * toʻxtaydi va signal shu yerga tushadi. Buyurtma holati bu yerdan
 * OʻZGARTIRILMAYDI: hodisa tarixda oʻz holicha qoladi, operator faqat
 * xulosa yozadi va kerak boʻlsa ustani bloklaydi.
 *
 * Bloklash AVTOMATIK emas — hatto tasdiqlangan hodisada ham operator
 * tugmani alohida bosadi.
 */
export function SafetyScreen() {
  const { token } = useAuth();

  const query = useQuery({
    queryKey: ['admin', 'safety'],
    queryFn: () => fetchSafetyAlerts(token as string),
    enabled: Boolean(token),
    refetchInterval: LIVE_REFRESH_MS,
  });

  const openCount = query.data?.openCount ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-16">
        <PageTitle
          title="Xavfsizlik signallari"
          subtitle="«Bu men chaqirgan usta emas» — mijoz ishni eshik oldida toʻxtatgan holatlar"
        />
        {openCount > 0 && <Pill tone="danger">{openCount} ta ochiq signal</Pill>}
      </div>

      {query.isPending && <p className="text-body text-text-secondary">Yuklanmoqda…</p>}

      {query.isError && (
        <Notice>
          {query.error instanceof ApiError ? query.error.message : 'Signallarni yuklab boʻlmadi'}
        </Notice>
      )}

      {query.data?.items.length === 0 && (
        <Notice tone="success">Ochiq signal yoʻq — hammasi koʻrib chiqilgan.</Notice>
      )}

      <div className="flex flex-col gap-16">
        {query.data?.items.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
      </div>
    </>
  );
}

function AlertCard({ alert }: { alert: SafetyAlert }) {
  const { token } = useAuth();
  const client = useQueryClient();
  const [resolution, setResolution] = useState<SafetyResolution | null>(null);
  const [note, setNote] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const invalidate = () => void client.invalidateQueries({ queryKey: ['admin', 'safety'] });

  const resolve = useMutation({
    mutationFn: () =>
      resolveSafetyAlert(token as string, alert.id, resolution as SafetyResolution, note.trim()),
    onSuccess: () => {
      setNote('');
      setResolution(null);
      invalidate();
    },
  });

  const block = useMutation({
    mutationFn: () =>
      setMasterBlocked(token as string, alert.masterId as string, true, blockReason.trim()),
    onSuccess: () => {
      setBlockReason('');
      invalidate();
    },
  });

  const isOpen = alert.status !== 'RESOLVED';
  const noteError = note.length > 0 ? reasonProblem(note, NOTE_MIN, NOTE_MAX) : null;

  return (
    <Card className="p-20">
      <div className="flex flex-wrap items-start justify-between gap-12">
        <div>
          <h2 className="text-h3 text-text-primary">
            <Link
              to={`/orders/${alert.orderId}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              {alert.orderShortId}
            </Link>
          </h2>
          <p className="mt-4 text-caption text-text-secondary">
            {formatDateTime(alert.createdAt)}
          </p>
        </div>
        <Pill tone={isOpen ? 'danger' : 'neutral'}>{ALERT_STATUS_LABELS[alert.status]}</Pill>
      </div>

      <dl className="mt-16 grid grid-cols-[auto_1fr] gap-x-16 gap-y-8 text-body">
        <dt className="text-text-secondary">Mijoz</dt>
        <dd className="text-text-primary">
          {alert.clientName ?? '—'} · {alert.clientPhone}
        </dd>
        <dt className="text-text-secondary">Usta</dt>
        <dd className="text-text-primary">
          {alert.masterName ?? 'tayinlanmagan'}
          {alert.masterPhone ? ` · ${alert.masterPhone}` : ''}
          {alert.masterIsActive === false ? ' · bloklangan' : ''}
        </dd>
      </dl>

      {alert.clientNote && (
        <p className="mt-12 whitespace-pre-line text-body text-text-primary">
          Mijozning izohi: {alert.clientNote}
        </p>
      )}

      {alert.resolution && (
        <div className="mt-16 rounded-md bg-neutral-surface px-16 py-12">
          <p className="text-body-strong text-text-primary">
            Xulosa: {SAFETY_RESOLUTION_LABELS[alert.resolution]}
          </p>
          {alert.resolutionNote && (
            <p className="mt-4 text-body-sm text-text-secondary">{alert.resolutionNote}</p>
          )}
        </div>
      )}

      {(resolve.isError || block.isError) && (
        <div className="mt-16">
          <Notice>
            {(resolve.error ?? block.error) instanceof ApiError
              ? ((resolve.error ?? block.error) as ApiError).message
              : 'Amal bajarilmadi'}
          </Notice>
        </div>
      )}

      {isOpen && (
        <div className="mt-16 border-t border-border pt-16">
          <p className="text-caption-strong text-text-secondary">Xulosa</p>
          <div className="mt-8 flex flex-wrap gap-8">
            {SAFETY_RESOLUTIONS.map((item) => (
              <Button
                key={item.key}
                variant={resolution === item.key ? 'primary' : 'ghost'}
                onClick={() => setResolution(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {resolution && (
            <p className="mt-8 text-caption text-text-secondary">
              {SAFETY_RESOLUTIONS.find((item) => item.key === resolution)?.hint}
            </p>
          )}

          <label className="mt-12 block text-caption-strong text-text-secondary" htmlFor={`note-${alert.id}`}>
            Nima aniqladingiz
          </label>
          <textarea
            id={`note-${alert.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="mt-4 w-full rounded-md border border-border bg-surface-elevated px-12 py-8 text-body text-text-primary"
          />
          {noteError && <p className="mt-4 text-caption text-danger">{noteError}</p>}

          <Button
            className="mt-12"
            disabled={
              resolution === null ||
              reasonProblem(note, NOTE_MIN, NOTE_MAX) !== null ||
              resolve.isPending
            }
            onClick={() => resolve.mutate()}
          >
            {resolve.isPending ? 'Yopilmoqda…' : 'Signalni yopish'}
          </Button>
        </div>
      )}

      {/*
        Bloklash ALOHIDA qaror: signal yopilgani ustani avtomatik
        bloklamaydi (biznes-qoida 5.4). Tugma faqat tasdiqlangan
        hodisada va faqat faol ustada koʻrinadi.
      */}
      {alert.suggestsBlock && alert.masterId && alert.masterIsActive && (
        <div className="mt-16 border-t border-border pt-16">
          <p className="text-body-strong text-text-primary">Ustani bloklaysizmi?</p>
          <p className="mt-4 text-caption text-text-secondary">
            Bloklangan usta yangi taklif olmaydi. Boshlagan ishi va tarixi tegilmaydi.
          </p>
          <textarea
            value={blockReason}
            onChange={(event) => setBlockReason(event.target.value)}
            rows={2}
            placeholder="Bloklash sababi"
            className="mt-8 w-full rounded-md border border-border bg-surface-elevated px-12 py-8 text-body text-text-primary"
          />
          <Button
            className="mt-12"
            disabled={reasonProblem(blockReason) !== null || block.isPending}
            onClick={() => block.mutate()}
          >
            {block.isPending ? 'Bloklanmoqda…' : 'Ustani bloklash'}
          </Button>
        </div>
      )}
    </Card>
  );
}
