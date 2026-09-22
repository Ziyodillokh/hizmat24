import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { AddressPartFields } from '@/components/AddressPartFields';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { SelectableChip } from '@/components/SelectableChip';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import {
  ADDRESS_KIND_LABELS,
  ADDRESS_KINDS,
  ADDRESS_LABEL_MAX,
  ADDRESS_NAME_MAX,
  addressSaveHint,
  canSaveAddress,
  EMPTY_ADDRESS_FORM,
  toAddressForm,
  type AddressFormInput,
} from '@/lib/savedAddress';
import { cityBadge, streetProblem, withCity, withoutCity } from '@/lib/serviceArea';
import { ADDRESS_KIND_ICONS } from './AddressBook';
import { useServiceCity } from '../service-area-store';
import { useAddresses } from '../address-store';
import { tapFeedback } from '../native';
import { useToast } from '../ToastHost';

/**
 * Manzil qoʻshish va tahrirlash.
 *
 * Bitta ekran ikkala ish uchun: maydonlar, tekshiruvlar va matnlar aynan
 * bir xil boʻlardi, ikkita fayl esa ularni vaqt oʻtib bir-biridan
 * uzoqlashtirardi.
 */
export function AddressFormScreen() {
  const navigate = useNavigate();
  const { addressId } = useParams<{ addressId: string }>();
  const { findAddress, addAddress, updateAddress, removeAddress, findDuplicateAddress, isFull } =
    useAddresses();
  const showToast = useToast();
  const city = useServiceCity();

  const existing = addressId ? findAddress(addressId) : undefined;
  const isEditing = Boolean(addressId);

  const [form, setForm] = useState<AddressFormInput>(() =>
    existing ? toAddressForm(existing) : EMPTY_ADDRESS_FORM,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Marshrutdagi `id` mavjud boʻlmasligi mumkin: yozuv boshqa oynada
  // oʻchirilgan yoki havola eskirgan.
  if (isEditing && !existing) return <Navigate to="/app/addresses" replace />;
  // Roʻyxat toʻlganda qoʻshish ekranini ochib qoʻyish maʼnosiz — tugma
  // hech qachon faollashmasdi.
  if (!isEditing && isFull) return <Navigate to="/app/addresses" replace />;

  const duplicate = findDuplicateAddress(form, existing?.id);
  const hint = addressSaveHint(form, duplicate);
  const street = withoutCity(form.label, city);
  const streetError = street.trim().length > 0 ? streetProblem(street) : null;
  const canSave = canSaveAddress(form) && streetProblem(street) === null && !duplicate;

  const patch = (next: Partial<AddressFormInput>) => setForm((prev) => ({ ...prev, ...next }));

  const submit = () => {
    if (!canSave) return;

    if (existing) {
      updateAddress(existing.id, form);
      void tapFeedback();
      showToast('Manzil saqlandi', 'success');
    } else {
      const id = addAddress(form);
      if (!id) {
        // Jimgina muvaffaqiyatsizlik qolmaydi: sabab aytiladi.
        showToast('Manzil qoʻshilmadi — roʻyxat toʻlgan', 'danger');
        return;
      }
      void tapFeedback();
      showToast('Manzil saqlandi', 'success');
    }

    navigate('/app/addresses', { replace: true });
  };

  return (
    <ScreenShell
      header={
        <Header
          variant="inner"
          title={isEditing ? 'Manzilni tahrirlash' : 'Yangi manzil'}
          onBack={() => navigate(-1)}
        />
      }
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            <Button variant="primary" disabled={!canSave} onClick={submit}>
              Saqlash
            </Button>
            {hint ? (
              <p className="text-center text-body-sm text-text-secondary">{hint}</p>
            ) : (
              <p className="text-center text-caption text-text-secondary">
                Manzil shu qurilmada saqlanadi va buyurtma berishda taklif qilinadi.
              </p>
            )}
          </div>
        </StickyFooter>
      }
    >
      <h2 className="mt-4 text-h3 text-text-primary">Bu qanday manzil?</h2>
      <div className="mt-12 flex flex-wrap gap-8">
        {ADDRESS_KINDS.map((kind) => (
          <SelectableChip
            key={kind}
            selected={form.kind === kind}
            onSelect={() => patch({ kind })}
          >
            <Icon icon={ADDRESS_KIND_ICONS[kind]} size={16} className="mr-4" aria-hidden />
            {ADDRESS_KIND_LABELS[kind]}
          </SelectableChip>
        ))}
      </div>

      <h2 className="mt-24 text-h3 text-text-primary">Nom</h2>
      <p className="mt-4 text-caption text-text-secondary">
        Ixtiyoriy — kiritmasangiz tur nomi ishlatiladi
      </p>
      <Input
        value={form.name}
        onChange={(event) => patch({ name: event.target.value })}
        placeholder={`Masalan: ${ADDRESS_KIND_LABELS[form.kind]}`}
        maxLength={ADDRESS_NAME_MAX}
        className="mt-12"
      />

      <h2 className="mt-24 text-h3 text-text-primary">Manzil</h2>
      <p className="mt-4 text-caption text-text-secondary">
        Koʻcha, uy va mahalla — usta shu matnni oʻqiydi
      </p>
      {/* Shahar tanlanmaydi: platforma hozir faqat shu yerda ishlaydi. */}
      <p className="mt-12 rounded-md bg-surface-sunken px-16 py-12 text-body-strong text-text-primary">
        {cityBadge(city)}
      </p>
      <Input
        value={street}
        onChange={(event) => patch({ label: withCity(event.target.value, city) })}
        placeholder="Uychi koʻchasi 12, 4-uy"
        maxLength={ADDRESS_LABEL_MAX}
        error={streetError ?? undefined}
        className="mt-12"
      />

      <h2 className="mt-24 text-h3 text-text-primary">Kirish tafsilotlari</h2>
      <p className="mt-4 text-caption text-text-secondary">
        Ixtiyoriy — usta eshikni tezroq topishi uchun
      </p>
      <AddressPartFields
        values={{ entrance: form.entrance, floor: form.floor, apartment: form.apartment }}
        onChange={(key, value) => patch({ [key]: value })}
        className="mt-12"
      />

      {existing && (
        <>
          <Button variant="ghost" className="mt-24" onClick={() => setDeleteOpen(true)}>
            Manzilni oʻchirish
          </Button>
          <p className="mt-8 px-4 text-caption text-text-secondary">
            Oʻchirilgan manzil berilgan buyurtmalardan yoʻqolmaydi — ular manzil nusxasini
            oʻzida saqlaydi.
          </p>
        </>
      )}

      {/* Ikkala tugma bir xil oʻlchamda — "yoʻq" ni kichraytirish taqiqlanadi. */}
      <Modal
        open={deleteOpen}
        title="Manzilni oʻchirasizmi?"
        onClose={() => setDeleteOpen(false)}
      >
        <div className="mt-20 flex flex-col gap-12">
          <p className="text-center text-body-sm text-text-secondary">
            Manzil qurilmadan oʻchadi va uni tiklab boʻlmaydi.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (!existing) return;
              removeAddress(existing.id);
              showToast('Manzil oʻchirildi');
              navigate('/app/addresses', { replace: true });
            }}
          >
            Ha, oʻchirish
          </Button>
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Yoʻq
          </Button>
        </div>
      </Modal>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
