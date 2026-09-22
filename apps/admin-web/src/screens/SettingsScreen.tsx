import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchServiceAreas, updateServiceArea, type ServiceArea } from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import {
  areaSummaryLine,
  cityProblem,
  hasChanges,
  latProblem,
  lngProblem,
  radiusProblem,
  saveBlocker,
  toFormState,
  toInput,
  type AreaFormState,
} from '@/lib/serviceAreaForm';
import { Button, Card, Field, Notice, PageTitle, Pill } from '@/components/ui';

/**
 * Sozlamalar — platforma QAYERDA ishlaydi.
 *
 * Chegara kodda emas, shu yerda: ikkinchi shahar qoʻshilganda dastur
 * qayta yigʻilmasligi kerak. Doira (markaz + radius) ataylab tanlandi —
 * koʻpburchakni chizadigan xarita hali yoʻq, doirani esa ikkita son
 * bilan oʻzgartirib boʻladi.
 */
export function SettingsScreen() {
  const { token } = useAuth();
  const query = useQuery({
    queryKey: ['admin', 'service-areas'],
    queryFn: () => fetchServiceAreas(token as string),
    enabled: Boolean(token),
  });

  return (
    <>
      <PageTitle
        title="Sozlamalar"
        subtitle="Platforma qaysi shaharda va qanday chegarada buyurtma qabul qiladi"
      />

      {query.isPending && <p className="text-body text-text-secondary">Yuklanmoqda…</p>}

      {query.isError && (
        <Notice>
          {query.error instanceof ApiError ? query.error.message : 'Sozlamalarni yuklab boʻlmadi'}
        </Notice>
      )}

      {query.data?.length === 0 && (
        <Notice>
          Faol hudud yoʻq — hozir hech qayerdan buyurtma qabul qilinmaydi. Hudud qoʻshish
          keyingi bosqichda paneldan qilinadi.
        </Notice>
      )}

      <div className="flex flex-col gap-16">
        {query.data?.map((area) => <AreaCard key={area.id} area={area} />)}
      </div>
    </>
  );
}

function AreaCard({ area }: { area: ServiceArea }) {
  const { token } = useAuth();
  const client = useQueryClient();
  const [form, setForm] = useState<AreaFormState>(() => toFormState(area));
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () => updateServiceArea(token as string, area.id, toInput(form, area)),
    onSuccess: (updated) => {
      setForm(toFormState(updated));
      setSaved(true);
      void client.invalidateQueries({ queryKey: ['admin', 'service-areas'] });
    },
  });

  const patch = (next: Partial<AreaFormState>) => {
    setSaved(false);
    setForm((current) => ({ ...current, ...next }));
  };

  const blocker = saveBlocker(form);
  const changed = hasChanges(form, area);

  return (
    <Card className="p-20">
      <div className="flex flex-wrap items-start justify-between gap-12">
        <div>
          <h2 className="text-h3 text-text-primary">{area.cityName}</h2>
          <p className="mt-4 text-caption text-text-secondary">{areaSummaryLine(area)}</p>
        </div>
        {area.isActive ? <Pill tone="success">faol</Pill> : <Pill>oʻchirilgan</Pill>}
      </div>

      <div className="mt-16 grid gap-16 md:grid-cols-2">
        <Field
          label="Shahar nomi"
          value={form.cityName}
          onChange={(event) => patch({ cityName: event.target.value })}
          error={cityProblem(form.cityName) ?? undefined}
          hint="Koordinatasiz manzil shu nom boʻyicha tekshiriladi"
        />
        <Field
          label="Radius (km)"
          inputMode="decimal"
          value={form.radiusKm}
          onChange={(event) => patch({ radiusKm: event.target.value })}
          error={radiusProblem(form.radiusKm) ?? undefined}
          hint="Markazdan shuncha masofadagi manzillar qabul qilinadi"
        />
        <Field
          label="Markaz — kenglik"
          inputMode="decimal"
          value={form.centerLat}
          onChange={(event) => patch({ centerLat: event.target.value })}
          error={latProblem(form.centerLat) ?? undefined}
        />
        <Field
          label="Markaz — uzunlik"
          inputMode="decimal"
          value={form.centerLng}
          onChange={(event) => patch({ centerLng: event.target.value })}
          error={lngProblem(form.centerLng) ?? undefined}
        />
      </div>

      {mutation.isError && (
        <div className="mt-16">
          <Notice>
            {mutation.error instanceof ApiError ? mutation.error.message : 'Saqlab boʻlmadi'}
          </Notice>
        </div>
      )}

      <div className="mt-16 flex items-center gap-12">
        <Button
          disabled={Boolean(blocker) || !changed || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
        </Button>
        <p className="text-caption text-text-secondary">
          {blocker ??
            (changed
              ? 'Oʻzgarish darhol kuchga kiradi — yangi buyurtmalar shu chegara boʻyicha tekshiriladi.'
              : saved
                ? 'Saqlandi.'
                : 'Oʻzgarish yoʻq.')}
        </p>
      </div>
    </Card>
  );
}
