import { CheckCircle, Clock, Info, XCircle } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError, apiErrorMessage } from '@/api/client';
import {
  fetchMyApplication,
  submitApplication,
  type RemoteApplication,
} from '@/api/masterApplication';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { SelectableChip } from '@/components/SelectableChip';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatDateTime } from '@/lib/formatters';
import {
  submitBlocker,
  toApplicationView,
  toSubmitPayload,
  VIEW_TITLES,
  type ApplicationView,
} from '@/lib/masterApplication';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { useCatalog } from '../../catalog-store';
import { useMaster } from '../../master-store';
import { tapFeedback } from '../../native';
import { useApp } from '../../store';
import { useToast } from '../../ToastHost';
import { useSessionReady } from '../../session-ready';

/** Server bilan ulanish holati — yuklanish va xato ekranda ochiq aytiladi. */
type Remote =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; application: RemoteApplication | null };

/**
 * Usta arizasi — SERVER yoʻli.
 *
 * Mahalliy yoʻldan (matn tayyorlash + Telegram) farqli oʻlaroq bu yerda
 * ariza haqiqatan yuboriladi va uning taqdiri shu ekranda koʻrinadi:
 * koʻrib chiqilmoqda, tasdiqlandi yoki rad etildi — sababi bilan.
 *
 * Holat har ochilishda serverdan olinadi, qurilmada saqlanmaydi: moderator
 * qarori boshqa joyda beriladi va eski nusxa yolgʻon boʻlardi.
 */
export function MasterApplyServer() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const showToast = useToast();
  const { profile, isComplete } = useMaster();
  const { fullName } = useApp();
  const { categories } = useCatalog();
  const sessionReady = useSessionReady();

  const [remote, setRemote] = useState<Remote>({ state: 'loading' });
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Rad etilgandan keyin foydalanuvchi qayta yuborishni tanladi. */
  const [isResubmitting, setIsResubmitting] = useState(false);

  const load = useCallback(() => {
    setRemote({ state: 'loading' });
    fetchMyApplication()
      .then((application) => setRemote({ state: 'ready', application }))
      .catch((error: unknown) =>
        setRemote({
          state: 'error',
          message: error instanceof ApiError ? apiErrorMessage(error) : 'Holatni yuklab boʻlmadi',
        }),
      );
  }, []);

  // Sessiya tiklanguncha soʻrov yuborilmaydi: token hali yoʻq va 401
  // «sessiya tugadi» degan yolgʻon xabar berardi.
  useEffect(() => {
    if (sessionReady !== null) load();
  }, [sessionReady, load]);

  if (!isComplete) return <Navigate to="/app/master/setup" replace />;

  const input = { profile, fullName, requestedCategoryIds: selected };
  const blocker = submitBlocker(input);

  const submit = async () => {
    const payload = toSubmitPayload(input);
    if (!payload || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const application = await submitApplication(payload);
      void tapFeedback();
      showToast('Ariza yuborildi', 'success');
      setIsResubmitting(false);
      setRemote({ state: 'ready', application });
    } catch (error) {
      // 409 — ariza allaqachon bor (masalan, boshqa qurilmadan yuborilgan).
      // Bu xato emas, holat: serverdagi haqiqiy holatni koʻrsatamiz.
      if (error instanceof ApiError && error.status === 409) {
        load();
        return;
      }
      showToast(error instanceof ApiError ? apiErrorMessage(error) : 'Ariza yuborilmadi', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const view: ApplicationView =
    remote.state === 'ready' && !isResubmitting ? toApplicationView(remote.application) : { kind: 'form' };
  const showForm = remote.state === 'ready' && view.kind === 'form';

  return (
    <ScreenShell
      header={<Header variant="inner" title="Ariza" onBack={() => navigate('/app/master/profile')} />}
      footer={
        showForm ? (
          <StickyFooter>
            <div className="flex flex-col gap-12">
              <Button variant="primary" loading={isSubmitting} disabled={Boolean(blocker)} onClick={() => void submit()}>
                Arizani yuborish
              </Button>
              <p className="text-center text-caption text-text-secondary">
                {blocker ?? 'Ariza moderatorga tushadi. Javob shu ekranda koʻrinadi.'}
              </p>
            </div>
          </StickyFooter>
        ) : undefined
      }
    >
      <h1 className="mt-4 text-h1 text-text-primary">
        {remote.state === 'ready' ? VIEW_TITLES[view.kind] : 'Ariza'}
      </h1>

      {remote.state === 'loading' && (
        <p className="mt-8 text-body text-text-secondary">Holat tekshirilmoqda…</p>
      )}

      {remote.state === 'error' && (
        <Banner variant="danger" icon={Info} className="mt-16">
          <span className="block">{remote.message}</span>
          <Button variant="secondary" size="small" fullWidth={false} className="mt-8" onClick={load}>
            Qayta urinish
          </Button>
        </Banner>
      )}

      {showForm && (
        <>
          <p className="mt-8 text-body text-text-secondary">
            Profilingizdagi maʼlumotlar moderatorga yuboriladi. Sertifikat «oʻzim aytdim» deb
            belgilanadi — uni odam tekshiradi.
          </p>

          <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">Qaysi xizmatlarni bajarasiz?</h2>
          <div className="mt-8 flex flex-wrap gap-8">
            {categories.map((category) => (
              <SelectableChip
                key={category.id}
                selected={selected.includes(category.id)}
                onSelect={() =>
                  setSelected((current) =>
                    current.includes(category.id)
                      ? current.filter((id) => id !== category.id)
                      : [...current, category.id],
                  )
                }
              >
                {category.name}
              </SelectableChip>
            ))}
          </div>
        </>
      )}

      {remote.state === 'ready' && view.kind === 'pending' && (
        <Banner variant="info" icon={Clock} className="mt-16">
          Ariza {formatDateTime(new Date(view.sentAt), now)} da yuborilgan. Moderator koʻrib
          chiqqach, javob shu yerda koʻrinadi.
        </Banner>
      )}

      {remote.state === 'ready' && view.kind === 'approved' && (
        <Banner variant="info" icon={CheckCircle} className="mt-16">
          Siz endi platformada ustasiz
          {view.reviewedAt ? ` (${formatDateTime(new Date(view.reviewedAt), now)})` : ''}. Smenani
          ochib buyurtma qabul qilishingiz mumkin.
        </Banner>
      )}

      {remote.state === 'ready' && view.kind === 'rejected' && (
        <>
          <Banner variant="danger" icon={XCircle} className="mt-16">
            <span className="block text-body-strong">Sabab:</span>
            {view.reason}
          </Banner>
          <p className="mt-12 px-4 text-caption text-text-secondary">
            Sababni bartaraf etib, qaytadan ariza berishingiz mumkin.
          </p>
          <Button variant="secondary" className="mt-12" onClick={() => setIsResubmitting(true)}>
            Qaytadan ariza berish
          </Button>
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
