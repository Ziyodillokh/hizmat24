import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminMasters,
  fetchAdminUsers,
  revealPhone,
  setMasterBlocked,
  setUserBlocked,
  type AdminMasterRow,
  type AdminUserRow,
} from '@/api/adminPeople';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatDateTime } from '@/lib/format';
import {
  MASTER_STATUS_LABELS,
  percentLabel,
  reasonProblem,
  USER_STATUS_LABELS,
} from '@/lib/operations';
import { Button, Card, Field, Notice, PageTitle, Pill } from '@/components/ui';

type Tab = 'users' | 'masters';

/**
 * Foydalanuvchilar va ustalar (A5).
 *
 * Telefon raqami roʻyxatda MASKALANGAN turadi. Toʻliq raqamni ochish —
 * alohida tugma va u auditga yoziladi: panelga kirgan odam minglab
 * raqamni jimgina koʻchirib ololmasligi kerak.
 */
export function UsersScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');

  const users = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => fetchAdminUsers(token as string, search.trim() || undefined),
    enabled: Boolean(token) && tab === 'users',
  });

  const masters = useQuery({
    queryKey: ['admin', 'masters', search],
    queryFn: () => fetchAdminMasters(token as string, search.trim() || undefined),
    enabled: Boolean(token) && tab === 'masters',
  });

  const active = tab === 'users' ? users : masters;

  return (
    <>
      <PageTitle
        title="Foydalanuvchilar"
        subtitle="Qoʻllab-quvvatlash ishi: kim, nima qilgan, kimni bloklash kerak"
      />

      <div className="mb-16 flex flex-wrap items-end gap-12">
        <div className="flex gap-8">
          <Button variant={tab === 'users' ? 'primary' : 'ghost'} onClick={() => setTab('users')}>
            Mijozlar
          </Button>
          <Button
            variant={tab === 'masters' ? 'primary' : 'ghost'}
            onClick={() => setTab('masters')}
          >
            Ustalar
          </Button>
        </div>
        <div className="min-w-[240px] flex-1">
          <Field
            label="Qidiruv"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="+99890 yoki ism"
            hint="Telefon raqami yoki ism boʻyicha"
          />
        </div>
      </div>

      {active.isPending && <p className="text-body text-text-secondary">Yuklanmoqda…</p>}

      {active.isError && (
        <Notice>
          {active.error instanceof ApiError ? active.error.message : 'Roʻyxatni yuklab boʻlmadi'}
        </Notice>
      )}

      {tab === 'users' && users.data && (
        <div className="flex flex-col gap-12">
          {users.data.length === 0 && <Notice tone="neutral">Hech kim topilmadi.</Notice>}
          {users.data.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {tab === 'masters' && masters.data && (
        <div className="flex flex-col gap-12">
          {masters.data.length === 0 && <Notice tone="neutral">Usta topilmadi.</Notice>}
          {masters.data.map((master) => (
            <MasterCard key={master.id} master={master} />
          ))}
        </div>
      )}
    </>
  );
}

/** Raqamni ochish tugmasi — har bosilishi auditga tushadi. */
function PhoneCell({ kind, id, masked }: { kind: 'users' | 'masters'; id: string; masked: string }) {
  const { token } = useAuth();
  const [full, setFull] = useState<string | null>(null);

  const reveal = useMutation({
    mutationFn: () => revealPhone(token as string, kind, id),
    onSuccess: (result) => setFull(result.phoneNumber),
  });

  if (full) return <span className="text-text-primary">{full}</span>;

  return (
    <span className="flex flex-wrap items-center gap-8">
      <span className="tabular-nums text-text-primary">{masked}</span>
      <button
        type="button"
        onClick={() => reveal.mutate()}
        disabled={reveal.isPending}
        className="text-caption text-primary underline-offset-2 hover:underline"
      >
        {reveal.isPending ? 'ochilmoqda…' : 'toʻliq koʻrsatish'}
      </button>
      {/*
        Xato JIMGINA yutilmasin: tugma bosilib hech narsa oʻzgarmasa,
        admin raqam ochilmaganini emas, tugma ishlamayotganini oʻylardi.
      */}
      {reveal.isError && (
        <span className="text-caption text-danger">
          {reveal.error instanceof ApiError ? reveal.error.message : 'Raqamni ochib boʻlmadi'}
        </span>
      )}
    </span>
  );
}

/** Bloklash/blokdan chiqarish — sabab majburiy. */
function BlockBox({
  isBlocked,
  onSubmit,
  isPending,
  error,
}: {
  isBlocked: boolean;
  onSubmit: (reason: string) => void;
  isPending: boolean;
  error: unknown;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const problem = reasonProblem(reason);

  return (
    <div className="mt-12 border-t border-border pt-12">
      <Button variant="ghost" onClick={() => setOpen((value) => !value)}>
        {isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
      </Button>

      {open && (
        <div className="mt-12">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            placeholder={isBlocked ? 'Blokdan chiqarish sababi' : 'Bloklash sababi'}
            className="w-full rounded-md border border-border bg-surface-elevated px-12 py-8 text-body text-text-primary"
          />
          {reason.length > 0 && problem && (
            <p className="mt-4 text-caption text-danger">{problem}</p>
          )}
          {error instanceof ApiError && (
            <p className="mt-4 text-caption text-danger">{error.message}</p>
          )}
          <Button
            className="mt-8"
            disabled={problem !== null || isPending}
            onClick={() => onSubmit(reason.trim())}
          >
            {isPending ? 'Yuborilmoqda…' : 'Tasdiqlash'}
          </Button>
        </div>
      )}
    </div>
  );
}

function UserCard({ user }: { user: AdminUserRow }) {
  const { token } = useAuth();
  const client = useQueryClient();
  const blocked = user.status === 'BLOCKED';

  const mutation = useMutation({
    mutationFn: (reason: string) => setUserBlocked(token as string, user.id, !blocked, reason),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <Card className="p-20">
      <div className="flex flex-wrap items-start justify-between gap-12">
        <div>
          {/* Ism — tafsilotga yoʻl. Telefon qatori havola ICHIDA emas:
              raqamni ochish alohida amal va bosish niyati aralashib ketardi. */}
          <Link
            to={`/users/${user.id}`}
            className="text-h3 text-primary underline-offset-2 hover:underline"
          >
            {user.fullName ?? 'Ism kiritilmagan'}
          </Link>
          <div className="mt-4 text-body">
            <PhoneCell kind="users" id={user.id} masked={user.phoneMasked} />
          </div>
        </div>
        <div className="flex items-center gap-8">
          {user.isMaster && <Pill>usta</Pill>}
          <Pill tone={blocked ? 'danger' : 'success'}>{USER_STATUS_LABELS[user.status]}</Pill>
        </div>
      </div>

      <p className="mt-12 text-caption text-text-secondary">
        {user.ordersCount} ta buyurtma · roʻyxatdan oʻtgan: {formatDateTime(user.createdAt)}
      </p>

      <BlockBox
        isBlocked={blocked}
        isPending={mutation.isPending}
        error={mutation.error}
        onSubmit={(reason) => mutation.mutate(reason)}
      />
    </Card>
  );
}

function MasterCard({ master }: { master: AdminMasterRow }) {
  const { token } = useAuth();
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: (reason: string) =>
      setMasterBlocked(token as string, master.id, master.isActive, reason),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['admin', 'masters'] }),
  });

  return (
    <Card className="p-20">
      <div className="flex flex-wrap items-start justify-between gap-12">
        <div>
          {/* Ism — tafsilotga yoʻl. Telefon qatori alohida amal, shuning
              uchun havola ichida EMAS: bosish niyati aralashib ketardi. */}
          <Link
            to={`/users/masters/${master.id}`}
            className="text-h3 text-primary underline-offset-2 hover:underline"
          >
            {master.fullName}
          </Link>
          <div className="mt-4 text-body">
            <PhoneCell kind="masters" id={master.id} masked={master.phoneMasked} />
          </div>
        </div>
        <div className="flex items-center gap-8">
          <Pill>{MASTER_STATUS_LABELS[master.status]}</Pill>
          <Pill tone={master.isActive ? 'success' : 'danger'}>
            {master.isActive ? 'Faol' : 'Bloklangan'}
          </Pill>
        </div>
      </div>

      <dl className="mt-12 grid grid-cols-[auto_1fr] gap-x-16 gap-y-4 text-body">
        <dt className="text-text-secondary">Baho</dt>
        <dd className="text-text-primary">
          {master.ratingCount === 0 ? 'hali baho yoʻq' : `${master.ratingAvg} · ${master.ratingCount} ta baho`}
        </dd>
        <dt className="text-text-secondary">Bajargan ishlar</dt>
        <dd className="text-text-primary">{master.completedOrdersCount}</dd>
        <dt className="text-text-secondary">Bekor qilgan</dt>
        <dd className="text-text-primary">
          {master.cancelledByMasterCount} ta · {percentLabel(master.cancelRatePercent)}
        </dd>
        <dt className="text-text-secondary">Yoqilgan xizmatlar</dt>
        <dd className="text-text-primary">{master.enabledCategories}</dd>
        <dt className="text-text-secondary">Smena</dt>
        <dd className="text-text-primary">{master.isOnShift ? 'ochiq' : 'yopiq'}</dd>
      </dl>

      <BlockBox
        isBlocked={!master.isActive}
        isPending={mutation.isPending}
        error={mutation.error}
        onSubmit={(reason) => mutation.mutate(reason)}
      />
    </Card>
  );
}
