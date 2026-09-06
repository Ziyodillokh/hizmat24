import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { Icon } from '@/components/Icon';
import { PhoneFrame } from './PhoneFrame';
import { DeviceView } from './DeviceView';
import { getScreens, screenKey, screenTitle } from './registry';
import { useIsNarrowViewport } from './viewport';
import type { ThemeName } from '@/tokens/colors';

/**
 * Ekranni koʻrsatish.
 *
 * Keng oynada — Dark va Light yonma-yon, maketa ramkalarida (7-boʻlim).
 * Tor oynada (telefon) — toʻliq ekran qurilma rejimi: ramka telefon ekraniga
 * sigʻmaydi va gorizontal scroll paydo qilardi.
 */
export function ScreenPreview() {
  const { id } = useParams<{ id: string }>();
  const isNarrow = useIsNarrowViewport();
  const [theme, setTheme] = useState<ThemeName>('light');

  const entry = getScreens().find((screen) => screenKey(screen) === id);

  if (!entry) {
    return (
      <div className="px-24 py-40">
        <p className="text-body text-text-primary">Ekran topilmadi.</p>
        <Link to="/" className="mt-12 inline-block text-body text-primary">
          Roʻyxatga qaytish
        </Link>
      </div>
    );
  }

  const Screen = entry.component;

  if (isNarrow) {
    return (
      <div className="relative">
        <DeviceView theme={theme}>
          <Screen />
        </DeviceView>

        {/* Telefonda ham roʻyxatga qaytish va tema almashtirish kerak. */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-safe-bottom">
          <div className="pointer-events-auto m-12 flex items-center gap-4 rounded-full bg-surface-modal px-4 py-4 shadow-e3">
            <Link
              to="/"
              aria-label="Barcha ekranlar"
              className="flex h-touch w-touch items-center justify-center rounded-full text-text-primary"
            >
              <Icon icon={ArrowLeft} size={20} />
            </Link>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Temani almashtirish"
              className="flex h-touch w-touch items-center justify-center rounded-full text-text-primary"
            >
              <Icon icon={theme === 'dark' ? Sun : Moon} size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-24 py-32">
      <Link to="/" className="text-body text-primary">
        ← Barcha ekranlar
      </Link>
      <h1 className="mt-12 text-h2 text-text-primary">{screenTitle(entry)}</h1>

      <div className="mt-24 flex flex-wrap items-start gap-[120px]">
        <PhoneFrame theme="dark" label={`${screenTitle(entry)} · Dark`}>
          <Screen />
        </PhoneFrame>
        <PhoneFrame theme="light" label={`${screenTitle(entry)} · Light`}>
          <Screen />
        </PhoneFrame>
      </div>
    </div>
  );
}
