import { useState } from 'react';
import { clsx } from 'clsx';
import { QRCodeSVG } from 'qrcode.react';
import { groupSecret, parseOtpauthUri } from '@/lib/otpauth';
import { QR_COLORS } from '@/tokens/theme';
import { Notice } from '@/components/ui';

/**
 * Birinchi kirish: TOTP sirini autentifikator ilovasiga qoʻshish.
 *
 * QR kod ASOSIY yoʻl: `scripts/create-admin.ts` admin hisobini ochgan
 * odamga "birinchi kirishda QR kod koʻrsatiladi" deb vaʼda qiladi, demak
 * u haqiqatan koʻrsatilishi shart. Ilgari bu yerda faqat matn kalit
 * turardi va vaʼda bajarilmasdi.
 *
 * Matn kalit ZAXIRA boʻlib qoladi — kamera ishlamasligi mumkin, panel
 * telefonning oʻzida ochilgan boʻlishi mumkin (u holda oʻz ekranidagi QR
 * ni skanerlab boʻlmaydi). Zaxira yopiq turadi: sir ekranda beixtiyor
 * ochiq qolmasligi kerak.
 */

/** Telefon kamerasi shundan kichik QR ni ishonchli oʻqimaydi. */
const QR_SIZE = 176;

export function TotpEnrollment({ uri }: { uri: string }) {
  const [isSecretVisible, setIsSecretVisible] = useState(false);
  const details = parseOtpauthUri(uri);

  if (!details) {
    // Buzuq havolada soxta QR chizilmaydi — skanerlanmaydigan kvadrat
    // odamni "men notoʻgʻri qilyapman" degan xulosaga olib borardi.
    return (
      <Notice>
        Server yuborgan ulanish havolasi oʻqilmadi. Hisobni qaytadan oching yoki administratorga
        murojaat qiling.
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-12 rounded-md bg-warning-surface p-16">
      <div>
        <p className="text-body-strong text-warning">Birinchi kirish — ikki bosqichli himoya</p>
        <p className="mt-4 text-caption text-warning">
          Google Authenticator yoki Aegis ilovasini oching va shu QR kodni skanerlang.
        </p>
      </div>

      {/*
        Oq maydon token orqali (`qr-surface`) va u ikkala temada ham oq:
        qorongʻi temada toʻq fondagi QR kodni kamera topa olmaydi.

        `p-20` tasodifiy emas — QR standarti kod atrofida kamida 4 modul
        boʻsh joy («quiet zone») talab qiladi. Modul soni hisob nomining
        uzunligiga qarab oʻzgaradi, shuning uchun bitta songa tayanib
        boʻlmaydi. Oʻlchandi (`qrcode.react`, level M, 176 px):
          106 belgi → 41 modul → 20 px = 4.66 modul  ← eng yomon holat
          117 belgi → 45 modul → 20 px = 5.11 modul  (admin@hizmat24.uz)
          135 belgi → 49 modul → 20 px = 5.57 modul
        Havola qisqarganda boʻsh joy MODULDA kamayadi, shuning uchun
        chegara eng qisqa havolada tekshiriladi: 4.66 > 4, yaʼni p-20
        hamma holatda yetarli. p-16 boʻlsa u 3.7 ga tushib, talabdan
        past boʻlardi.
      */}
      <div className="flex justify-center rounded-md bg-qr-surface p-20">
        <QRCodeSVG
          value={uri}
          size={QR_SIZE}
          // `M` daraja — logo qoʻyilmaydi, lekin ekrandan suratga olinishi
          // yoki chop etilishi mumkin; `L` bunday holatda tez buziladi.
          level="M"
          bgColor={QR_COLORS.surface}
          fgColor={QR_COLORS.ink}
          title={`Hizmat24 — ${details.account} uchun TOTP kaliti`}
        />
      </div>

      <SecretFallback
        secret={details.secret}
        uri={uri}
        isVisible={isSecretVisible}
        onToggle={() => setIsSecretVisible((visible) => !visible)}
      />
    </div>
  );
}

function SecretFallback({
  secret,
  uri,
  isVisible,
  onToggle,
}: {
  secret: string;
  uri: string;
  isVisible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isVisible}
        aria-controls="totp-secret"
        className="self-start text-caption-strong text-warning underline underline-offset-2"
      >
        {isVisible ? 'Kalitni yashirish' : 'Kamera ishlamayaptimi? Kalitni qoʻlda kiriting'}
      </button>

      {/*
        Blok DOM da HAR DOIM turadi va faqat yashiriladi: tugmadagi
        `aria-controls` yopiq holatda ham haqiqiy elementga ishora qilishi
        kerak, aks holda ekran oʻquvchi uchun bogʻlanish buziladi.

        `hidden` ATRIBUTI yolgʻiz yetmaydi: brauzerning `[hidden]` qoidasi
        muallif uslublaridan kuchsiz va Tailwindʻning `flex` klassi uni
        bosib yozadi — sir ekranda ochiq qolardi. Shuning uchun klass ham
        almashtiriladi; atribut esa semantika uchun qoladi.
      */}
      <div
        id="totp-secret"
        hidden={!isVisible}
        className={clsx('flex-col gap-8', isVisible ? 'flex' : 'hidden')}
      >
        <p className="text-caption text-warning">
          Ilovada «kalitni qoʻlda kiritish» ni tanlang va quyidagini koʻchiring:
        </p>
        <code className="select-all break-all rounded-sm bg-surface-elevated px-8 py-4 font-mono text-mono text-text-primary">
          {groupSecret(secret)}
        </code>
        {/*
          Havola `otpauth:` sxemasini ushlaydigan ilova BOR qurilmadagina
          ishlaydi — ish stoli brauzerida bosilganda hech narsa boʻlmaydi.
          Shart matnning oʻzida turadi, aks holda bu bajarilmaydigan vaʼda
          beradigan tugma boʻlib qolardi.
        */}
        <a href={uri} className="text-caption-strong text-warning underline underline-offset-2">
          Panel telefonda ochilgan boʻlsa: autentifikator ilovasida ochish
        </a>
      </div>
    </div>
  );
}
