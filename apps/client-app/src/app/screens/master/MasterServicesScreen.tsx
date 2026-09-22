import { Info } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, apiErrorMessage } from '@/api/client';
import {
  fetchMasterServices,
  saveMasterServices,
  type MasterService,
} from '@/api/masterServices';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatPrice } from '@/lib/formatters';
import {
  enabledIds,
  groupServices,
  hasChanges,
  newServices,
  saveBlocker,
  toggle,
} from '@/lib/masterServices';
import { useSessionReady } from '../../session-ready';
import { tapFeedback } from '../../native';
import { useToast } from '../../ToastHost';

type Remote =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; services: MasterService[] };

/**
 * «Mening xizmatlarim» — usta qaysi ishlarni qabul qilishini boshqaradi.
 *
 * Buyurtma FAQAT yoqilgan ishlar boʻyicha keladi, shuning uchun bu ekran
 * ustaning ish oqimini bevosita belgilaydi. Tanlov ekranda oʻzgaradi va
 * «Saqlash» bosilganda bir marta yuboriladi: har belgilashda soʻrov
 * ketsa, sekin tarmoqda belgilagichlar sakrab turardi.
 */
export function MasterServicesScreen() {
  const navigate = useNavigate();
  const showToast = useToast();
  const sessionReady = useSessionReady();

  const [remote, setRemote] = useState<Remote>({ state: 'loading' });
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(() => {
    setRemote({ state: 'loading' });
    fetchMasterServices()
      .then((services) => {
        setRemote({ state: 'ready', services });
        setSelected(enabledIds(services));
      })
      .catch((error: unknown) =>
        setRemote({
          state: 'error',
          message: error instanceof ApiError ? apiErrorMessage(error) : 'Roʻyxatni yuklab boʻlmadi',
        }),
      );
  }, []);

  useEffect(() => {
    if (sessionReady !== null) load();
  }, [sessionReady, load]);

  const services = remote.state === 'ready' ? remote.services : [];
  const blocker = saveBlocker(selected);
  const changed = remote.state === 'ready' && hasChanges(services, selected);
  const fresh = newServices(services);

  const save = async () => {
    if (blocker || isSaving) return;
    setIsSaving(true);
    try {
      const updated = await saveMasterServices(selected);
      setRemote({ state: 'ready', services: updated });
      setSelected(enabledIds(updated));
      void tapFeedback();
      showToast('Saqlandi', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? apiErrorMessage(error) : 'Saqlanmadi', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenShell
      header={
        <Header variant="inner" title="Mening xizmatlarim" onBack={() => navigate('/app/master/profile')} />
      }
      footer={
        remote.state === 'ready' ? (
          <StickyFooter>
            <div className="flex flex-col gap-8">
              <Button
                variant="primary"
                loading={isSaving}
                disabled={Boolean(blocker) || !changed}
                onClick={() => void save()}
              >
                Saqlash
              </Button>
              <p className="text-center text-caption text-text-secondary">
                {blocker ?? (changed ? 'Oʻzgarishlar saqlanmagan' : 'Hammasi saqlangan')}
              </p>
            </div>
          </StickyFooter>
        ) : undefined
      }
    >
      <p className="mt-4 text-body text-text-secondary">
        Buyurtma faqat yoqilgan ishlar boʻyicha keladi. Qila olmaydigan ishni oʻchirib qoʻying —
        istalgan vaqt qaytarib yoqishingiz mumkin.
      </p>

      {remote.state === 'loading' && (
        <p className="mt-16 text-body text-text-secondary">Yuklanmoqda…</p>
      )}

      {remote.state === 'error' && (
        <Banner variant="danger" icon={Info} className="mt-16">
          <span className="block">{remote.message}</span>
          <Button variant="secondary" size="small" fullWidth={false} className="mt-8" onClick={load}>
            Qayta urinish
          </Button>
        </Banner>
      )}

      {fresh.length > 0 && (
        <Banner variant="info" icon={Info} className="mt-16">
          {fresh.length} ta yangi xizmat qoʻshildi. Ular oʻchiq turibdi — qila olsangiz yoqing.
        </Banner>
      )}

      {remote.state === 'ready' &&
        groupServices(services).map((block) => (
          <section key={block.groupName} className="mt-24">
            <h2 className="px-4 text-overline uppercase text-text-secondary">{block.groupName}</h2>
            <Card className="mt-8 divide-y divide-border">
              {block.services.map((service) => (
                <label
                  key={service.categoryId}
                  className="flex cursor-pointer items-start gap-12 py-12 first:pt-0 last:pb-0"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(service.categoryId)}
                    onChange={() =>
                      setSelected((current) => toggle(current, service.categoryId))
                    }
                    className="mt-4 h-20 w-20 shrink-0 accent-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-8">
                      <span className="min-w-0 text-body-strong text-text-primary">
                        {service.name}
                      </span>
                      <span className="shrink-0 text-body-sm text-text-secondary">
                        {formatPrice(service.basePrice)}
                      </span>
                    </span>
                    {service.summary && (
                      <span className="mt-2 block text-caption text-text-secondary">
                        {service.summary}
                      </span>
                    )}
                    {service.isNew && (
                      <span className="mt-2 block text-caption text-primary">yangi</span>
                    )}
                  </span>
                </label>
              ))}
            </Card>
          </section>
        ))}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
