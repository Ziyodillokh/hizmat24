import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveApplication,
  fetchAssignableCategories,
  rejectApplication,
  type ApplicationDetail,
} from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import {
  categorySelectionProblem,
  rejectionReasonProblem,
  REJECTION_REASON_MAX,
  toggleId,
} from '@/lib/applications';
import { Button, Notice } from '@/components/ui';

const errorText = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback;

/**
 * Tasdiqlash — xizmatlarni tanlab.
 *
 * Boshlangʻich tanlov — usta oʻzi soʻragan xizmatlar (ular faol
 * roʻyxatda bor boʻlsa). Moderator ularni oʻzgartira oladi: usta
 * «hammasini bilaman» deb belgilagan boʻlishi mumkin.
 */
export function ApproveForm({
  application,
  onDone,
}: {
  application: ApplicationDetail;
  onDone: () => void;
}) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const categories = useQuery({
    queryKey: ['admin', 'applications', 'categories'],
    queryFn: () => fetchAssignableCategories(token as string),
    enabled: Boolean(token),
  });
  const [selected, setSelected] = useState<string[]>(application.requestedCategoryIds);

  // Faol roʻyxatda qolmagan soʻrovlar hisobga olinmaydi — server ularni
  // baribir rad etardi (UNKNOWN_SERVICE_CATEGORY).
  const activeIds = new Set((categories.data ?? []).map((category) => category.id));
  const effectiveSelection = selected.filter((id) => activeIds.has(id));

  const mutation = useMutation({
    /*
     * Serverga FILTRLANGAN roʻyxat yuboriladi.
     *
     * Ilgari xom `selected` ketardi: ariza yuborilgandan keyin
     * oʻchirilgan xizmat unda qolib, server butun tasdiqlashni rad
     * etardi. Oʻsha identifikatorni UI dan olib tashlab ham boʻlmasdi —
     * u roʻyxatda koʻrinmaydi. Natijada ariza ABADIY tasdiqlanmasdi.
     */
    mutationFn: () => approveApplication(token as string, application.id, effectiveSelection),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] });
      onDone();
    },
  });
  const problem = categories.data ? categorySelectionProblem(effectiveSelection.length) : null;

  return (
    <div className="flex flex-col gap-12">
      <p className="text-body-strong text-text-primary">Qaysi xizmatlarni bajaradi?</p>

      {categories.isError && (
        <Notice>{errorText(categories.error, 'Xizmatlar roʻyxatini yuklab boʻlmadi')}</Notice>
      )}
      {categories.isPending && <p className="text-caption text-text-secondary">Yuklanmoqda…</p>}

      {categories.data && (
        <ul className="grid gap-4 md:grid-cols-2">
          {categories.data.map((category) => {
            const checked = selected.includes(category.id);
            const requested = application.requestedCategoryIds.includes(category.id);
            return (
              <li key={category.id}>
                <label className="flex cursor-pointer items-start gap-8 rounded-md border border-border px-12 py-8 hover:border-border-strong">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setSelected((current) => toggleId(current, category.id))}
                    className="mt-4"
                  />
                  <span className="min-w-0">
                    <span className="block text-body text-text-primary">{category.name}</span>
                    <span className="block text-caption text-text-secondary">
                      {category.groupName ?? 'Guruhsiz'}
                      {requested ? ' · usta soʻragan' : ''}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {problem && <p className="text-caption text-danger">{problem}</p>}
      {mutation.isError && <Notice>{errorText(mutation.error, 'Tasdiqlab boʻlmadi')}</Notice>}

      <div className="flex gap-8">
        <Button
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={Boolean(problem) || !categories.data}
        >
          Tasdiqlash
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={mutation.isPending}>
          Bekor qilish
        </Button>
      </div>
    </div>
  );
}

/** Rad etish — sabab majburiy, u usta ilovasida SOʻZMA-SOʻZ koʻrinadi. */
export function RejectForm({
  application,
  onDone,
}: {
  application: ApplicationDetail;
  onDone: () => void;
}) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const mutation = useMutation({
    mutationFn: () => rejectApplication(token as string, application.id, reason.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'applications'] });
      onDone();
    },
  });

  const problem = rejectionReasonProblem(reason);

  return (
    <div className="flex flex-col gap-12">
      <label className="flex flex-col gap-4">
        <span className="text-caption-strong text-text-secondary">Rad etish sababi</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          onBlur={() => setTouched(true)}
          rows={4}
          maxLength={REJECTION_REASON_MAX}
          placeholder="Masalan: tajriba darajasi tasdiqlanmadi, hujjatlar yetarli emas"
          className="rounded-md border border-border bg-surface-elevated px-12 py-8 text-body text-text-primary placeholder:text-text-disabled"
        />
        {/*
          Xato matni MASLAHAT QATORINING OʻRNIDA chiqadi, alohida qator
          sifatida emas. Aks holda maydondan chiqilganda yangi qator paydo
          boʻlib tugmalarni pastga surar va shu lahzada bosilgan «Bekor
          qilish» boʻsh joyga tushardi — brauzer mousedown va mouseup har
          xil elementga tushsa bosishni hisobga olmaydi.
        */}
        <span className={touched && problem ? 'text-caption text-danger' : 'text-caption text-text-secondary'}>
          {touched && problem
            ? problem
            : 'Bu matn usta ilovasida aynan shunday koʻrinadi — odamga nima qilish kerakligini ayting.'}
        </span>
      </label>

      {mutation.isError && <Notice>{errorText(mutation.error, 'Rad etib boʻlmadi')}</Notice>}

      <div className="flex gap-8">
        <Button
          variant="danger"
          onClick={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={Boolean(problem)}
        >
          Rad etish
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={mutation.isPending}>
          Bekor qilish
        </Button>
      </div>
    </div>
  );
}
