import {
  ArrowUUpLeft,
  Camera,
  Gavel,
  Headset,
  LockSimple,
  NotePencil,
  Prohibit,
  SealCheck,
  ShieldWarning,
  Star,
  Umbrella,
  Warning,
} from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { supportStatusLine } from '@/lib/support';
import { useMinuteClock } from '@/lib/useMinuteClock';

/**
 * Kafolat va himoya.
 *
 * "Sugʻurta" soʻzi sahifa nomidan ATAYLAB olib tashlangan: shartnoma yoʻq va
 * nomda turgan soʻz sahifa ochilmasdan turib vaʼda berardi.
 *
 * Sahifaning vazifasi — bugun HAQIQATAN ishlaydigan himoyani bir joyga
 * yigʻish. Ular beshta ekranga sochilgan va foydalanuvchi ularni bir joyda
 * hech qachon koʻrmagan. Eng kuchli jumla escrow vaʼdasi emas: naqd
 * toʻlovda pul foydalanuvchining oʻzida qoladi.
 */
interface Protection {
  icon: IconGlyph;
  tone: string;
  title: string;
  body: string;
  /**
   * MAJBURIY maydon (`?` yoʻq).
   *
   * Chegarasi yozilmagan band — marketing. Tip tekshiruvi bu sahifaning
   * reklama varaqasiga aylanib ketishiga qarshi yagona texnik qorovul.
   */
  limit: string;
}

const PROTECTIONS: Protection[] = [
  {
    icon: Prohibit,
    tone: 'text-danger',
    title: 'Bepul bekor qilish',
    body: 'Usta yetib kelgunicha buyurtmani istalgan paytda bekor qilasiz: jarima yoʻq va hech qanday pul yechilmaydi — chunki yechiladigan pul yoʻq.',
    limit: 'Usta ishni boshlagach bekor qilish tugmasi umuman chizilmaydi. Bunda «Muammo haqida xabar» yoʻli qoladi.',
  },
  {
    icon: ShieldWarning,
    tone: 'text-danger',
    title: 'Eshik oldida ustani rad etish',
    body: 'Usta yetib kelganda ilova uning suratini, ismini, reytingi va sertifikatini koʻrsatadi. Kelgan odam mos kelmasa, «Yoʻq, bu boshqa odam» tugmasi buyurtmani darhol toʻxtatadi va ish boshlanmaydi.',
    limit: 'Bu amalni bekor qilib boʻlmaydi: buyurtma qayta jonlanmaydi.',
  },
  {
    icon: SealCheck,
    tone: 'text-success',
    title: 'Usta haqida ochiq maʼlumot',
    body: 'Davlat sertifikati belgisi, reyting va bajarilgan buyurtmalar soni ishni boshlashdan oldin koʻrsatiladi. Reyting faqat yakunlangan buyurtmalardan hisoblanadi.',
    limit: 'Passport va ID tekshiruvi ilovada koʻrsatilmaydi — buni tekshirilgan deb hisoblamang.',
  },
  {
    icon: Star,
    tone: 'text-warning',
    title: 'Baho va sabab tegi',
    body: 'Past baho qoʻyganingizda sabab tegi majburiy — usta nimani tuzatishi kerakligi yoziladi. Bahoni keyin oʻzgartirib boʻlmaydi.',
    limit: 'Bahoingiz hozircha shu qurilmada saqlanadi; umumiy reytingga backend ulangach taʼsir qiladi.',
  },
  {
    icon: NotePencil,
    tone: 'text-primary',
    title: 'Muammo haqida xabar',
    body: 'Buyurtma sahifasida murojaat matni tayyorlanadi: buyurtma raqami, sana, usta va summa avtomatik qoʻshiladi.',
    limit: 'Matnni qoʻllab-quvvatlashga siz yuborasiz — platformada murojaatni koʻrib chiqadigan tizim yoʻq.',
  },
];

/** Hali ishlamaydigan vositalar. `onSelect` berilmaydi — qatorlar bosilmaydi. */
const NOT_YET: MenuSection = {
  title: 'Hali ishlamaydi',
  items: [
    { icon: LockSimple, label: 'Kafolatli toʻlov', hint: 'Tez orada' },
    { icon: ArrowUUpLeft, label: 'Pulni qaytarish', hint: 'Yoʻq' },
    { icon: Umbrella, label: 'Mulk sugʻurtasi', hint: 'Yoʻq' },
    { icon: Gavel, label: 'Nizo hakami', hint: 'Yoʻq' },
    { icon: Camera, label: 'Dalil fotosi', hint: 'Yoʻq' },
  ],
};

export function GuaranteeScreen() {
  const navigate = useNavigate();
  const now = useMinuteClock();

  return (
    <ScreenShell
      header={<Header variant="inner" title="Kafolat va himoya" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="secondary" onClick={() => navigate('/app/support')}>
            Qoʻllab-quvvatlash xizmati
          </Button>
        </StickyFooter>
      }
    >
      <h1 className="mt-4 text-h1 text-text-primary">Pulingiz sizda qoladi</h1>
      <p className="mt-8 text-body text-text-secondary">
        Hozir buyurtma faqat naqd toʻlanadi: pul ilova orqali oʻtmaydi va platformada
        saqlanmaydi. Ishni koʻrmaguningizcha toʻlamang — bu bugungi eng kuchli himoyangiz.
      </p>

      {/*
        Sahifaning eng qimmatli jumlasi: "pul sizda qoladi" daʼvosi faqat ish
        tugamaguncha toʻgʻri va sahifa buni oʻzi aytadi.
      */}
      <Banner variant="warning" icon={Warning} className="mt-16">
        Pul ustaga berilgandan keyin uni qaytarishga platformaning imkoni yoʻq — na naqdda, na
        boshqa yoʻl bilan. Shuning uchun ishni qabul qilishdan va toʻlashdan oldin tekshiring.
      </Banner>

      <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">
        Bugun nima ishlaydi
      </h2>

      {PROTECTIONS.map((item) => (
        <div
          key={item.title}
          className="mt-12 rounded-lg border border-border bg-surface-elevated px-16 py-12"
        >
          <div className="flex items-start gap-12">
            <Icon icon={item.icon} size={20} className={cn('mt-2 shrink-0', item.tone)} />
            <div className="min-w-0 flex-1">
              <p className="text-title text-text-primary">{item.title}</p>
              <p className="mt-2 text-body-sm text-text-secondary">{item.body}</p>
            </div>
          </div>
          <p className="mt-12 border-t border-border pt-12 text-body-sm text-text-secondary">
            {item.limit}
          </p>
        </div>
      ))}

      <div className="mt-12 rounded-lg border border-border bg-surface-elevated px-16 py-12">
        <div className="flex items-start gap-12">
          <Icon icon={Headset} size={20} className="mt-2 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-title text-text-primary">Odam bilan gaplashish</p>
            <p className="mt-2 text-body-sm text-text-secondary">
              Telefon va Telegram — ilovadan tashqariga chiqadigan haqiqiy ikki kanal. Javob
              beradigan odam bor.
            </p>
          </div>
        </div>
        <p className="mt-12 border-t border-border pt-12 text-body-sm text-text-secondary">
          {supportStatusLine(now)}. Ilova ichida operator chati yoʻq — AI yordamchi ham
          murojaatni qabul qilmaydi, u faqat tayyor javob beradi.
        </p>
      </div>

      <MenuGroup section={NOT_YET} />

      {/* Sugʻurta uchun "tez orada" ATAYLAB yozilmaydi: shartnoma yoʻq va
          muddat bizning nazoratimizda emas. */}
      <p className="mt-12 px-4 text-body-sm text-text-secondary">
        Kafolatli toʻlov Click va Payme ulangach ishga tushadi. Pulni qaytarish, mulk
        sugʻurtasi, nizo hakami va dalil fotosi uchun muddat aytilmaydi: sugʻurta shartnomasi
        yoʻq, usta ilovasi ulanmagan va bu muddatlar bizning nazoratimizda emas.
      </p>

      <Button variant="ghost" className="mt-20" onClick={() => navigate('/app/disputes')}>
        Murojaatlarim
      </Button>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
