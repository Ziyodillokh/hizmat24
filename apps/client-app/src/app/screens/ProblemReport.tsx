import { ClipboardText, Info, Siren, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SelectableChip } from '@/components/SelectableChip';
import { SummaryRow } from '@/components/SummaryRow';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import {
  canSubmitDispute,
  DISPUTE_GOAL_LABELS,
  DISPUTE_GOALS,
  DISPUTE_NOTE_MAX,
  DISPUTE_NOTE_MIN,
  DISPUTE_REASONS,
  disputeHint,
  SAFETY_REASON,
  type DisputeGoal,
} from '@/lib/dispute';
import { formatDateTime, formatPhone, formatPrice, orEmpty } from '@/lib/formatters';
import { canOpenDispute } from '@/lib/orderStateMachine';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS } from '@/lib/wallet';
import { useDisputes } from '../dispute-store';
import { tapFeedback } from '../native';
import { useApp } from '../store';
import { useToast } from '../ToastHost';

/**
 * Muammo haqida xabar.
 *
 * BU NIZO OCHISH EMAS. Platformada murojaatni koʻrib chiqadigan tizim yoʻq
 * va sahifa buni birinchi jumlada aytadi.
 *
 * Bajariladigan ish boshqa va u haqiqiy: murojaat matnini buyurtma
 * maʼlumoti bilan tayyorlash. Bugun foydalanuvchi qoʻllab-quvvatlashga
 * yozmoqchi boʻlsa, buyurtma raqamini, sanani, usta ismini va summani qoʻlda
 * qidirib topishi kerak — koʻpchilik shu yerda voz kechadi.
 */
export function ProblemReportScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder, phoneNumber } = useApp();
  const { createDispute } = useDisputes();
  const showToast = useToast();
  const now = useMinuteClock();

  const [reason, setReason] = useState<string | null>(null);
  const [goal, setGoal] = useState<DisputeGoal | null>(null);
  const [note, setNote] = useState('');

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;
  if (!canOpenDispute(order.status)) return <Navigate to={`/app/order/${order.id}`} replace />;

  const hint = disputeHint(reason, goal, note);
  const canSubmit = canSubmitDispute(reason, goal, note);

  const submit = () => {
    if (!canSubmit || reason === null || goal === null) return;

    const id = createDispute({ order, phoneNumber, reason, goal, note });
    void tapFeedback();
    showToast('Matn tayyorlandi');
    // `replace`: orqaga bosganda toʻldirilgan forma emas, buyurtma ochiladi
    // va ikkinchi nusxa yozuv yaratilmaydi.
    navigate(`/app/disputes/${id}`, { replace: true });
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Muammo haqida xabar" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {/* Tugma yorligʻi AMALNI aytadi, natijani emas. */}
            <Button variant="primary" disabled={!canSubmit} onClick={submit}>
              Matnni tayyorlash
            </Button>
            {hint ? (
              <p className="text-center text-body-sm text-text-secondary">{hint}</p>
            ) : (
              <p className="text-center text-caption text-text-secondary">
                Matn tayyorlanadi va shu qurilmada saqlanadi. Yuborishni keyingi ekranda
                oʻzingiz bajarasiz.
              </p>
            )}
          </div>
        </StickyFooter>
      }
    >
      <h1 className="mt-4 text-h1 text-text-primary">Muammo haqida xabar berish</h1>
      <p className="mt-8 text-body text-text-secondary">
        Platformada murojaatni koʻrib chiqadigan tizim hali yoʻq. Bu sahifa xabaringizni
        toʻliq matn qilib tayyorlaydi — buyurtma raqami, sana, usta va summa bilan. Matnni
        qoʻllab-quvvatlash xizmatiga siz yuborasiz, javobni odam beradi.
      </p>

      <div
        className={cn(
          'mt-16 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <SummaryRow label="Buyurtma raqami" value={order.shortId} mono />
        <SummaryRow label="Xizmat" value={order.categoryName} />
        <SummaryRow label="Usta" value={orEmpty(order.master?.fullName)} />
        <SummaryRow
          label={order.completedAt ? 'Yakunlangan sana' : 'Buyurtma sanasi'}
          value={formatDateTime(order.completedAt ?? order.createdAt, now)}
        />
        <SummaryRow label="Toʻlov usuli" value={METHOD_LABELS[order.paymentMethod]} />

        <div className="border-t border-dashed border-border pt-16" />
        <div className="flex items-baseline justify-between gap-16">
          <span className="text-body-lg text-text-secondary">Jami</span>
          <span className="tabular text-display text-text-primary">
            {formatPrice(order.invoice.total)}
          </span>
        </div>
      </div>

      <p className="mt-8 px-4 text-caption text-text-secondary">
        Bu maʼlumot murojaat matniga avtomatik qoʻshiladi — qoʻlda koʻchirish shart emas.
      </p>

      <h2 className="mt-24 text-h3 text-text-primary">Nima boʻldi?</h2>
      <p className="mt-4 text-caption text-text-secondary">Bittasini tanlang</p>
      <div className="mt-12 flex flex-wrap gap-8">
        {DISPUTE_REASONS.map((item) => (
          <SelectableChip key={item} selected={reason === item} onSelect={() => setReason(item)}>
            {item}
          </SelectableChip>
        ))}
      </div>

      {/*
        Demodagi "Admin darhol koʻrib chiqadi" vaʼdasining YAGONA haqiqiy
        ekvivalenti — va u rostakam ishlaydi.
      */}
      {reason === SAFETY_REASON && (
        <a
          href="tel:102"
          className="mt-12 flex min-h-touch items-center gap-12 rounded-sm border-l-4 border-danger bg-danger-surface p-16"
        >
          <Icon icon={Siren} size={20} className="shrink-0 text-danger" />
          <span className="min-w-0 flex-1">
            <span className="block text-title text-text-primary">
              Tahdid boʻlsa — 102 ga qoʻngʻiroq qiling
            </span>
            <span className="mt-2 block text-body-sm text-text-secondary">
              Ilova buni sizning oʻrningizda qila olmaydi va militsiyaga xabar yubormaydi.
            </span>
          </span>
        </a>
      )}

      <h2 className="mt-24 text-h3 text-text-primary">Nimani kutyapsiz?</h2>
      <p className="mt-4 text-caption text-text-secondary">
        Bu qoʻllab-quvvatlash xizmatiga nimadan boshlashni aytadi
      </p>
      <div className="mt-12 flex flex-wrap gap-8">
        {DISPUTE_GOALS.map((item) => (
          <SelectableChip key={item} selected={goal === item} onSelect={() => setGoal(item)}>
            {DISPUTE_GOAL_LABELS[item]}
          </SelectableChip>
        ))}
      </div>

      {/*
        Chegara umumiy banner sifatida emas, foydalanuvchi AYNAN shu
        kutilmani bildirgan daqiqada koʻrsatiladi.
      */}
      {goal === 'refund' && (
        <Banner variant="warning" icon={Warning} className="mt-12">
          Naqd toʻlovda pul ilova orqali oʻtmaydi — platforma uni qaytara olmaydi.
          Qoʻllab-quvvatlash xizmati usta bilan vositachilik qilishi mumkin, lekin pul
          qaytishiga kafolat bermaydi.
        </Banner>
      )}
      {goal === 'fix' && (
        <Banner variant="info" icon={Info} className="mt-12">
          Platforma ustani qaytishga majburlay olmaydi. Ish kafolatini usta bilan yoki
          qoʻllab-quvvatlash xizmati orqali kelishasiz.
        </Banner>
      )}

      <h2 className="mt-24 text-h3 text-text-primary">Nima boʻlganini yozing</h2>
      <p className="mt-4 text-caption text-text-secondary">
        Sana, vaqt va nima notoʻgʻri ketgani — matn shu holicha yuboriladi
      </p>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={DISPUTE_NOTE_MAX}
        placeholder="Masalan: usta ketgach kran yana oqa boshladi"
        error={
          note.trim().length > 0 && note.trim().length < DISPUTE_NOTE_MIN
            ? `Kamida ${DISPUTE_NOTE_MIN} belgi`
            : undefined
        }
        className="mt-12"
      />

      {/* Yashirincha maʼlumot joʻnatilmaydi: telefon raqami matnga tushishi
          tugma bosilishidan OLDIN aytiladi va raqamning OʻZI koʻrsatiladi. */}
      <Card className="mt-20 flex flex-col gap-12">
        <div className="flex items-start gap-12">
          <Icon icon={ClipboardText} size={20} className="mt-2 shrink-0 text-text-secondary" />
          <div className="min-w-0 flex-1">
            <p className="text-title text-text-primary">Matnga nima qoʻshiladi</p>
            <p className="mt-2 text-body-sm text-text-secondary">
              Buyurtma raqami, xizmat nomi, sana, usta ismi, summa, toʻlov usuli va manzil.
            </p>
          </div>
        </div>
        {phoneNumber.trim() && (
          <p className="border-t border-border pt-12 text-body-sm text-text-secondary">
            Telefon raqamingiz ham qoʻshiladi: {formatPhone(phoneNumber)} — qoʻllab-quvvatlash
            siz bilan bogʻlana olishi uchun.
          </p>
        )}
      </Card>

      {/* `span`, `button` EMAS: bajaradigan amali yoʻq. */}
      <span className="ml-4 mt-16 inline-flex h-[32px] items-center rounded-full border border-dashed border-border-strong px-12 text-caption text-text-secondary">
        Demo · murojaat platformaga tushmaydi, uni siz yuborasiz
      </span>

      {/* Formada uchta majburiy maydon bor; bu darvoza faqat shuning uchun
          halolki, yonida hech narsa talab qilmaydigan ishlaydigan yoʻl bor. */}
      <button
        type="button"
        onClick={() => navigate(`/app/support?order=${order.id}`)}
        className="mt-16 block px-4 text-caption text-primary-pressed"
      >
        Formani toʻldirmasdan qoʻllab-quvvatlashga bogʻlanish
      </button>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
