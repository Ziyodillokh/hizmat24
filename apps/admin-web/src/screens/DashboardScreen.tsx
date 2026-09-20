import { useAuth } from '@/app/AuthProvider';
import { menuFor } from '@/lib/sections';
import { Card, PageTitle, Pill } from '@/components/ui';

/**
 * Boshqaruv sahifasi — A1 da ataylab QISQA.
 *
 * Bu yerda raqamlar (bugungi buyurtmalar, kutayotgan arizalar) boʻlishi
 * kerak, lekin ular A3 va A2 bosqichlarida paydo boʻladi. Hozir soxta
 * grafik chizib qoʻyish — panelga ishonchni yoʻqotishning eng tez yoʻli.
 * Shuning uchun sahifa faqat HAQIQIY narsani koʻrsatadi: kim kirgan va
 * unga qaysi boʻlimlar ochiq.
 */
export function DashboardScreen() {
  const { admin } = useAuth();
  if (!admin) return null;

  const menu = menuFor(admin.sections);
  const ready = menu.filter((section) => section.stage === null);
  const upcoming = menu.filter((section) => section.stage !== null);

  return (
    <>
      <PageTitle
        title={`Salom, ${admin.fullName}`}
        subtitle="Sizning rolingizga ochiq boʻlimlar"
      />

      <div className="grid gap-16 md:grid-cols-2">
        {ready.map((section) => (
          <Card key={section.key} className="p-20">
            <div className="flex items-start justify-between gap-12">
              <h2 className="text-h3 text-text-primary">{section.title}</h2>
              <Pill tone="success">ishlaydi</Pill>
            </div>
            <p className="mt-8 text-body text-text-secondary">{section.summary}</p>
          </Card>
        ))}
      </div>

      {upcoming.length > 0 && (
        <section className="mt-32">
          <h2 className="text-h3 text-text-primary">Tayyorlanmoqda</h2>
          <p className="mt-4 text-body text-text-secondary">
            Bu boʻlimlar rolingizga ochiq, lekin hali yozilmagan.
          </p>

          <ul className="mt-12 flex flex-col gap-8">
            {upcoming.map((section) => (
              <li
                key={section.key}
                className="flex items-center justify-between gap-12 rounded-md border border-dashed border-border px-16 py-12"
              >
                <div className="min-w-0">
                  <p className="text-body-strong text-text-primary">{section.title}</p>
                  <p className="text-caption text-text-secondary">{section.summary}</p>
                </div>
                <Pill>{section.stage} bosqichi</Pill>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
