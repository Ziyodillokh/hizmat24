import { Link } from 'react-router-dom';
import { getScreens, screenKey, screenTitle } from './registry';

/**
 * Preview navigatori — dev qobigʻi, mahsulotning qismi EMAS.
 * Ekranlar bosqichlar boʻyicha guruhlanadi (13-boʻlim).
 */
const STAGE_TITLES: Record<number, string> = {
  1: "Bosqich 1 — Dizayn tizimi va asosiy ekranlar",
  2: 'Bosqich 2 — Kirish va manzil oqimi',
  3: "Bosqich 3 — Buyurtma holatlari",
  4: 'Bosqich 4 — Tablar va tafsilot',
  5: "Bosqich 5 — Holatlar, modallar, ruxsatlar",
};

export function PreviewIndex() {
  const screens = getScreens();
  const stages = [...new Set(screens.map((s) => s.stage))].sort();

  return (
    <div className="mx-auto max-w-[900px] px-20 py-32 pb-safe-bottom sm:px-24 sm:py-40">
      <h1 className="text-h1 text-text-primary">Hizmat24 — mijoz ilovasi</h1>
      <p className="mt-8 text-body text-text-secondary">
        {screens.length} ta ekran. Har biri Dark va Light temada.
      </p>

      <div className="mt-12 flex gap-12">
        <Link
          to="/app"
          className="inline-flex h-[36px] items-center rounded-xs bg-primary px-16 text-button-sm text-on-primary"
        >
          Ilovani ochish
        </Link>
        <Link
          to="/components"
          className="inline-flex h-[36px] items-center rounded-xs border border-border px-16 text-button-sm text-text-primary"
        >
          Komponentlar
        </Link>
      </div>

      {stages.map((stage) => (
        <section key={stage} className="mt-32">
          <h2 className="text-h3 text-text-primary">{STAGE_TITLES[stage]}</h2>
          <ul className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {screens
              .filter((s) => s.stage === stage)
              .map((entry) => (
                <li key={screenKey(entry)}>
                  <Link
                    to={`/s/${screenKey(entry)}`}
                    className="block rounded-sm border border-border bg-surface-elevated px-16 py-12 text-body text-text-primary"
                  >
                    {screenTitle(entry)}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
