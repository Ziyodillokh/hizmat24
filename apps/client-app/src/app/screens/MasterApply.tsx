import { Info } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import {
  ChannelLog,
  CopyMessageButton,
  PreparedMessageText,
  SupportPhoneBlock,
  TelegramFooter,
} from '@/components/PreparedMessage';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatDateTime } from '@/lib/formatters';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { useMaster } from '../master-store';
import { tapFeedback } from '../native';
import { useToast } from '../ToastHost';

/**
 * Usta boʻlish uchun ariza.
 *
 * BU ARIZA YUBORISH EMAS. Arizani koʻrib chiqadigan tizim yoʻq va sahifa
 * buni birinchi jumlada aytadi. Ilova matnni TAYYORLAYDI — profil, ism va
 * telefon bilan — foydalanuvchi uni qoʻllab-quvvatlashga oʻzi yuboradi.
 * Murojaat (5-bosqich) bilan bir xil naqsh va bir xil komponentlar.
 */
export function MasterApplyScreen() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { isComplete, application, prepareApplication, markApplicationChannelOpened } =
    useMaster();
  const showToast = useToast();
  const [copied, setCopied] = useState(false);

  if (!isComplete) return <Navigate to="/app/master/setup" replace />;

  const prepare = () => {
    if (!prepareApplication()) {
      showToast('Ariza tayyorlanmadi — profil toʻliq emas', 'danger');
      return;
    }
    void tapFeedback();
    showToast('Ariza matni tayyorlandi');
  };

  const handleCopied = (ok: boolean) => {
    setCopied(ok);
    if (ok) {
      void tapFeedback();
      showToast('Matn nusxalandi', 'success');
    } else {
      showToast('Nusxalab boʻlmadi — matnni qoʻlda belgilab oling', 'danger');
    }
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Ariza" onBack={() => navigate('/app/master')} />}
      footer={
        application ? (
          <TelegramFooter copied={copied} onOpen={markApplicationChannelOpened} />
        ) : (
          <StickyFooter>
            <div className="flex flex-col gap-12">
              {/* Yorliq AMALNI aytadi, natijani emas. */}
              <Button variant="primary" onClick={prepare}>
                Matnni tayyorlash
              </Button>
              <p className="text-center text-caption text-text-secondary">
                Matn tayyorlanadi va shu qurilmada saqlanadi. Yuborishni oʻzingiz bajarasiz.
              </p>
            </div>
          </StickyFooter>
        )
      }
    >
      <h1 className="mt-4 text-h1 text-text-primary">Usta boʻlish uchun ariza</h1>
      <p className="mt-8 text-body text-text-secondary">
        Platformada arizani koʻrib chiqadigan tizim hali yoʻq. Ilova profilingizdan tekshiruv
        uchun toʻliq matn yigʻadi — uni qoʻllab-quvvatlash xizmatiga siz yuborasiz, javobni odam
        beradi.
      </p>

      {!application ? (
        <Banner variant="info" icon={Info} className="mt-16">
          Matnga soha, tajriba, sertifikat haqidagi javobingiz, tumanlar, ish vaqti, ismingiz va
          telefon raqamingiz qoʻshiladi. Sertifikat «oʻzim aytdim» deb belgilanadi — tekshiruvni
          odam qiladi.
        </Banner>
      ) : (
        <>
          <Banner variant="info" icon={Info} className="mt-16">
            Bu matn hech qayerga yuborilmagan. Uni nusxalab, quyidagi kanallardan biriga oʻzingiz
            yuborasiz.
          </Banner>

          <div className="mt-24 flex items-baseline justify-between gap-12 px-4">
            <h2 className="text-overline uppercase text-text-secondary">Ariza matni</h2>
            <span className="shrink-0 text-caption text-text-secondary">
              {formatDateTime(application.createdAt, now)}
            </span>
          </div>
          <PreparedMessageText message={application.message} className="mt-8" />
          <CopyMessageButton
            message={application.message}
            onCopied={handleCopied}
            className="mt-12"
          />

          {/* Profil oʻzgargan boʻlsa matn eskirgan — qayta tayyorlash ochiq. */}
          <button
            type="button"
            onClick={prepare}
            className="mt-12 block px-4 text-caption text-primary-pressed"
          >
            Profil oʻzgardimi? Matnni qayta tayyorlash
          </button>

          <SupportPhoneBlock
            now={now}
            onOpen={() => markApplicationChannelOpened('phone')}
            className="mt-24"
          />

          <ChannelLog events={application.openedChannels} now={now} className="mt-24" />

          <p className="mt-16 px-4 text-caption text-text-secondary">
            Ariza faqat shu qurilmada saqlanadi. Tekshiruv natijasi ilovaga kelmaydi —
            qoʻllab-quvvatlash sizga javob beradi.
          </p>
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
