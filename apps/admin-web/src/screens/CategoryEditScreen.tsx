import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  fetchAdminGroups,
  fetchCategory,
  setCategoryActive,
  updateCategory,
  type AdminCategory,
} from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { formatPrice } from '@/lib/format';
import {
  EMPTY_FORM,
  priceLabel,
  PRICE_KIND_LABELS,
  toCategoryInput,
  toFormState,
  validateForm,
  type CategoryFormState,
} from '@/lib/catalogForm';
import { ListEditor } from '@/components/ListEditor';
import { MediaManager } from '@/components/MediaManager';
import { Button, Card, Field, Notice, PageTitle, Pill } from '@/components/ui';

/** Yangi xizmat uchun manzilda `new` turadi — hali id yoʻq. */
const isNewRoute = (id: string) => id === 'new';

export function CategoryEditScreen() {
  const { id = 'new' } = useParams<{ id: string }>();
  const { token } = useAuth();
  const isNew = isNewRoute(id);

  const category = useQuery({
    queryKey: ['admin', 'catalog', id],
    queryFn: () => fetchCategory(token as string, id),
    enabled: Boolean(token) && !isNew,
  });

  if (isNew) return <CategoryForm initial={EMPTY_FORM} />;
  if (category.isPending) return <p className="text-body text-text-secondary">Yuklanmoqda…</p>;
  if (category.isError) {
    return (
      <Notice>
        {category.error instanceof ApiError ? category.error.message : 'Xizmatni yuklab boʻlmadi'}
      </Notice>
    );
  }

  return <CategoryForm initial={toFormState(category.data)} category={category.data} />;
}

function CategoryForm({
  initial,
  category,
}: {
  initial: CategoryFormState;
  category?: AdminCategory;
}) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);

  const patch = (next: Partial<CategoryFormState>) => setForm((current) => ({ ...current, ...next }));

  const groups = useQuery({
    queryKey: ['admin', 'catalog', 'groups'],
    queryFn: () => fetchAdminGroups(token as string),
    enabled: Boolean(token),
  });

  const save = useMutation({
    mutationFn: () => {
      const input = toCategoryInput(form);
      if (!input) throw new ApiError('server', 'Shaklda xato bor');
      return category
        ? updateCategory(token as string, category.id, input)
        : createCategory(token as string, input);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin', 'catalog', saved.id], saved);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] });
      if (!category) navigate(`/catalog/${saved.id}`, { replace: true });
    },
  });

  const toggleActive = useMutation({
    mutationFn: () => setCategoryActive(token as string, category!.id, !category!.isActive),
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin', 'catalog', saved.id], saved);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] });
    },
  });

  const problems = validateForm(form);

  return (
    <>
      <Link to="/catalog" className="text-caption-strong text-primary underline-offset-2 hover:underline">
        ← Katalog
      </Link>

      <div className="mt-12 flex flex-wrap items-start justify-between gap-16">
        <PageTitle
          title={category ? category.name : 'Yangi xizmat'}
          subtitle={
            category
              ? `${priceLabel(formatPrice(category.basePrice), category.priceKind)} · ${category.masterCount} ta usta yoqib qoʻygan`
              : 'Mijoz ilovasida shu karta koʻrinadi'
          }
        />
        {category && (
          <div className="flex items-center gap-12">
            <Pill tone={category.isActive ? 'success' : 'neutral'}>
              {category.isActive ? 'faol' : 'oʻchirilgan'}
            </Pill>
            <Button
              variant="secondary"
              loading={toggleActive.isPending}
              onClick={() => toggleActive.mutate()}
            >
              {category.isActive ? 'Oʻchirish' : 'Yoqish'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-16 lg:grid-cols-2">
        <Card className="flex flex-col gap-16 p-20">
          <Field
            label="Nomi"
            value={form.name}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Masalan: Kran taʼmirlash"
          />
          <Field
            label="Qisqa izoh"
            hint="Roʻyxatdagi kartada bir qator boʻlib koʻrinadi"
            value={form.summary}
            onChange={(event) => patch({ summary: event.target.value })}
            placeholder="Oqayotgan kranni almashtiramiz"
          />

          <label className="flex flex-col gap-4">
            <span className="text-caption-strong text-text-secondary">Batafsil tavsif</span>
            <textarea
              value={form.details}
              onChange={(event) => patch({ details: event.target.value })}
              rows={6}
              placeholder="Ish qanday bajariladi, nimalarga eʼtibor beramiz…"
              className="rounded-md border border-border bg-surface-elevated px-12 py-8 text-body text-text-primary placeholder:text-text-disabled"
            />
          </label>

          <div className="grid gap-12 sm:grid-cols-2">
            <Field
              label="Narx (soʻm)"
              value={form.basePrice}
              inputMode="numeric"
              onChange={(event) => patch({ basePrice: event.target.value })}
              placeholder="120000"
            />
            <label className="flex flex-col gap-4">
              <span className="text-caption-strong text-text-secondary">Narx turi</span>
              <select
                value={form.priceKind}
                onChange={(event) => patch({ priceKind: event.target.value as CategoryFormState['priceKind'] })}
                className="h-40 rounded-md border border-border bg-surface-elevated px-12 text-body text-text-primary"
              >
                {Object.entries(PRICE_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-12 sm:grid-cols-2">
            <Field
              label="Taxminiy vaqt (daqiqa)"
              hint="Boʻsh qoldirsangiz vaqt koʻrsatilmaydi"
              value={form.durationMinutes}
              inputMode="numeric"
              onChange={(event) => patch({ durationMinutes: event.target.value })}
              placeholder="60"
            />
            <label className="flex flex-col gap-4">
              <span className="text-caption-strong text-text-secondary">Guruh</span>
              <select
                value={form.groupId}
                onChange={(event) => patch({ groupId: event.target.value })}
                className="h-40 rounded-md border border-border bg-surface-elevated px-12 text-body text-text-primary"
              >
                <option value="">Guruhsiz</option>
                {(groups.data ?? []).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card className="flex flex-col gap-20 p-20">
          <ListEditor
            label="Narx ichiga kiradi"
            hint="Mijoz aynan shu roʻyxatni koʻradi"
            items={form.includes}
            onChange={(includes) => patch({ includes })}
            placeholder="Usta chiqishi va ishchi kuchi"
          />
          <ListEditor
            label="Narx ichiga kirmaydi"
            hint="Kutilmagan qoʻshimcha toʻlovning oldini oladi"
            items={form.excludes}
            onChange={(excludes) => patch({ excludes })}
            placeholder="Yangi kran narxi"
          />
        </Card>
      </div>

      {touched && problems.length > 0 && (
        <div className="mt-16">
          <Notice>
            <ul className="flex flex-col gap-4">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </Notice>
        </div>
      )}

      {save.isError && (
        <div className="mt-16">
          <Notice>
            {save.error instanceof ApiError ? save.error.message : 'Saqlab boʻlmadi'}
          </Notice>
        </div>
      )}

      <div className="mt-16 flex items-center gap-12">
        <Button
          loading={save.isPending}
          onClick={() => {
            setTouched(true);
            if (problems.length === 0) save.mutate();
          }}
        >
          Saqlash
        </Button>
        {save.isSuccess && !save.isPending && (
          <span className="text-caption-strong text-success">Saqlandi</span>
        )}
      </div>

      {/*
        Media faqat SAQLANGAN xizmatga qoʻshiladi: fayl serverda
        kategoriyaga biriktiriladi, kategoriya esa hali yaratilmagan
        boʻlsa biriktirib boʻlmaydi.
      */}
      {category && (
        <Card className="mt-24 p-20">
          <MediaManager category={category} />
        </Card>
      )}
    </>
  );
}
