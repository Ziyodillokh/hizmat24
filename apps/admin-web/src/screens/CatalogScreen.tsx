import { useQuery } from '@tanstack/react-query';
import { fetchCategories, type AdminCategory } from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatPrice } from '@/lib/format';
import { Card, Notice, PageTitle, Pill } from '@/components/ui';

const COMPLEXITY_LABELS: Record<AdminCategory['complexityLevel'], string> = {
  SIMPLE: 'Oddiy',
  MEDIUM: 'Oʻrtacha',
  COMPLEX: 'Murakkab',
};

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
      <PageTitle
        title="Katalog"
        subtitle="Xizmatlar va ularning boshlangʻich narxlari. Tahrirlash A6 bosqichida qoʻshiladi."
      />

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
              <th className="px-16 py-12">Murakkablik</th>
              <th className="px-16 py-12 text-right">Ustalar</th>
              <th className="px-16 py-12">Holat</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border last:border-0">
                <td className="px-16 py-12">
                  <p className="text-body-strong text-text-primary">{category.name}</p>
                  {category.description && (
                    <p className="text-caption text-text-secondary">{category.description}</p>
                  )}
                </td>
                <td className="px-16 py-12 text-text-secondary">{category.groupName ?? '—'}</td>
                <td className="px-16 py-12 text-right tabular-nums text-text-primary">
                  {formatPrice(category.basePrice)}
                </td>
                <td className="px-16 py-12 text-text-secondary">
                  {COMPLEXITY_LABELS[category.complexityLevel]}
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
