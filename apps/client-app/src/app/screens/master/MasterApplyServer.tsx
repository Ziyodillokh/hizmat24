import { CheckCircle, Clock, Info, XCircle } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiErrorMessage } from '@/api/client';
import {
  fetchMyApplication,
  submitApplication,
  type RemoteApplication,
} from '@/api/masterApplication';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { SelectableChip } from '@/components/SelectableChip';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatDateTime } from '@/lib/formatters';
import {
  submitBlocker,
  toApplicationView,
  toSubmitPayload,
  VIEW_TITLES,
  type ApplicationView,
} from '@/lib/masterApplication';
import { ABOUT_MAX, aboutHint } from '@/lib/masterProfile';
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
 * Usta arizasi — SERVER yoʻli, BITTA ekran.
 *
 * Avval bu ekranga kirish uchun besh qadamli profil toʻldirilishi kerak
 * edi. Endi ariza ikkita javobdan iborat: KIM va NIMA QILA OLADI. Kasb
 * soʻralmaydi (hamma usta santexnik), tajriba va sertifikat soʻralmaydi
 * (ularni hech kim tekshirmasdi), tuman va ish vaqti soʻralmaydi (ish
 * hozircha faqat Namangan shahrida, vaqtni esa smena tugmasi aytadi).
 *
 * Xizmatlar HAMMASI yoqilgan holda ochiladi: usta odatda koʻpini qiladi va
 * qila olmaydiganini oʻchirish tanlashdan tezroq. Keyin buni «Mening
 * xizmatlarim» da istalgan vaqt oʻzgartiradi.
 *
 * Holat har ochilishda serverdan olinadi, qurilmada saqlanmaydi: moderator
 * qarori boshqa joyda beriladi va eski nusxa yolgʻon boʻlardi.
 */
export function MasterApplyServer() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const showToast = useToast();
  const { profile, updateProfile } = useMaster();
  const { fullName, setFullName } = useApp();
  const { categories } = useCatalog();
  const sessionReady = useSessionReady();

  const [remote, setRemote] = useState<Remote>({ state: 'loading' });
  /**
   * `null` — foydalanuvchi hali xizmatlarga tegmagan: shunda HAMMASI
   * yoqilgan deb hisoblanadi. Boʻsh massivdan farqi bor — boʻsh massiv
   * «hammasini oʻchirdim» degani va tugmani yopadi.
   */
  const [selected, setSelected] = useState<string[] | null>(null);
  /*
   * Ism AYNAN shu yerda turadi, storeʼda emas: `setFullName` qiymatni
   * trim qiladi, yaʼni har bosilgan boʻshliq darhol yoʻqolardi va
   * «Ali Karimov» ni yozib boʻlmasdi. Storeʼga yuborishdan oldin
   * yoziladi.
   */
  const [name, setName] = useState(fullName ?? '');
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

  const chosen = selected ?? categories.map((category) => category.id);
  const input = { profile, fullName: name, requestedCategoryIds: chosen };
  const blocker = submitBlocker(input);

  const submit = async () => {
    const payload = toSubmitPayload(input);
    if (!payload || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const application = await submitApplication(payload);
      // Ism arizada qabul qilindi — endi ilovaning qolgan qismi ham
      // ustani shu nom bilan chaqiradi.
      setFullName(payload.fullName);
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
            Ikki savol — shu. Javobingizni moderator koʻrib chiqadi.
          </p>

          <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">Ismingiz</h2>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ism va familiya"
            autoComplete="name"
            className="mt-8"
          />

          <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">
            Qaysi ishlarni bajarasiz?
          </h2>
          <p className="mt-4 px-4 text-caption text-text-secondary">
            Hammasi yoqilgan. Qila olmaydiganingizni bosib oʻchiring — buyurtma faqat yoqilganlari
            boʻyicha tushadi.
          </p>
          <div className="mt-8 flex flex-wrap gap-8">
            {categories.map((category) => (
              <SelectableChip
                key={category.id}
                selected={chosen.includes(category.id)}
                onSelect={() =>
                  setSelected(
                    chosen.includes(category.id)
                      ? chosen.filter((id) => id !== category.id)
                      : [...chosen, category.id],
                  )
                }
              >
                {category.name}
              </SelectableChip>
            ))}
          </div>

          <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">
            Oʻzingiz haqingizda — ixtiyoriy
          </h2>
          <Textarea
            value={profile.about}
            onChange={(event) => updateProfile({ about: event.target.value })}
            maxLength={ABOUT_MAX}
            placeholder="Masalan: 8 yildan beri santexnika bilan shugʻullanaman…"
            error={aboutHint(profile.about) ?? undefined}
            className="mt-8"
          />
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
