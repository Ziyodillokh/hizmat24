import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchCategories, mediaSrc, type AdminCategory } from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatPrice } from '@/lib/format';
import { priceLabel } from '@/lib/catalogForm';
import { Button, Card, Notice, PageTitle, Pill } from '@/components/ui';

/**
 * Katalog — A1 da faqat OʻQISH.
 *
 * Tahrirlash A6 da qoʻshiladi; hozir tugma qoʻyilmaydi. Ishlamaydigan
 * tugma — boʻsh vaʼda.
 */
export function CatalogScreen() {
  const { token } = useAuth();
  const query = useQuery({
    queryKey: ['admin', 'catalog'],
    queryFn: () => fetchCategories(token as string),
    enabled: Boolean(token),
  });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-16">
        <PageTitle
          title="Katalog"
          subtitle="Mijoz ilovasida koʻrinadigan xizmatlar: tavsif, narx, rasm va video"
        />
        <Link to="/catalog/new">
          <Button>Yangi xizmat</Button>
        </Link>
      </div>

      {query.isPending && <p className="text-body text-text-secondary">Yuklanmoqda…</p>}

      {query.isError && (
        <Notice>
          {query.error instanceof ApiError ? query.error.message : 'Roʻyxatni yuklab boʻlmadi'}
        </Notice>
      )}

      {query.data && <CategoryTable categories={query.data} />}
    </>
  );
}

function CategoryTable({ categories }: { categories: AdminCategory[] }) {
  const active = categories.filter((category) => category.isActive).length;

  return (
    <>
      <p className="mb-12 text-body text-text-secondary">
        {categories.length} ta yozuv · {active} tasi faol
      </p>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-body">
          <thead>
            <tr className="border-b border-border text-left text-caption-strong text-text-secondary">
              <th className="px-16 py-12">Xizmat</th>
              <th className="px-16 py-12">Guruh</th>
              <th className="px-16 py-12 text-right">Narx</th>
              <th className="px-16 py-12">Vaqt</th>
              <th className="px-16 py-12 text-right">Ustalar</th>
              <th className="px-16 py-12">Holat</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border last:border-0 hover:bg-neutral-surface">
                <td className="px-16 py-12">
                  <div className="flex items-center gap-12">
                    {/* Muqova — mijoz roʻyxatda aynan shuni koʻradi. */}
                    {category.media.find((item) => item.isCover) ? (
                      <img
                        src={mediaSrc(category.media.find((item) => item.isCover)!.url)}
                        alt=""
                        className="h-40 w-40 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-md bg-neutral-surface text-caption text-text-disabled">
                        rasm
                      </span>
                    )}
                    <div className="min-w-0">
                      <Link
                        to={`/catalog/${category.id}`}
                        className="text-body-strong text-primary underline-offset-2 hover:underline"
                      >
                        {category.name}
                      </Link>
                      {category.summary && (
                        <p className="text-caption text-text-secondary">{category.summary}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-16 py-12 text-text-secondary">{category.groupName ?? '—'}</td>
                <td className="px-16 py-12 text-right tabular-nums text-text-primary">
                  {priceLabel(formatPrice(category.basePrice), category.priceKind)}
                </td>
                <td className="px-16 py-12 text-text-secondary">
                  {category.durationMinutes === null ? '—' : `${category.durationMinutes} daq`}
                </td>
                <td className="px-16 py-12 text-right tabular-nums text-text-secondary">
                  {category.masterCount}
                </td>
                <td className="px-16 py-12">
                  {category.isActive ? (
                    <Pill tone="success">faol</Pill>
                  ) : (
                    <Pill>oʻchirilgan</Pill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
