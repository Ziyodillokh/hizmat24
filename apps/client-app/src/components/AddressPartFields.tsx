import { Input } from './Input';

/**
 * Podez · Qavat · Xonadon uchligi.
 *
 * Yorliq KOʻRINADI, placeholderʼda emas. Ikki sabab:
 *
 * 1. Ilgari yorliq placeholderʼda edi: maydon toʻldirilgach u yoʻqolardi va
 *    foydalanuvchi "3" nimani bildirishini bilmasdi. `aria-label` esa faqat
 *    ekran oʻqiydigan dasturga aytardi.
 * 2. "Xonadon" soʻzi 360px ekranda oʻz maydoniga zoʻrgʻa sigʻardi —
 *    `text-caption` yorliq sifatida esa bemalol joylashadi.
 *
 * Ikkala manzil ekrani bir xil uchlikni chizadi, shuning uchun u BITTA
 * joyda yashaydi.
 */
export const ADDRESS_PART_MAX_LENGTH = 20;

/*
 * Placeholder ATAYLAB yoʻq. "2" yoki "34" kabi namuna raqami toʻldirilgan
 * qiymatga oʻxshaydi va foydalanuvchi maydonni toʻldirilgan deb oʻylab
 * tashlab ketardi. Yorliq nima soʻralayotganini allaqachon aytadi.
 */
const FIELDS = [
  { key: 'entrance', label: 'Podez' },
  { key: 'floor', label: 'Qavat' },
  { key: 'apartment', label: 'Xonadon' },
] as const;

export type AddressPartKey = (typeof FIELDS)[number]['key'];

export interface AddressPartFieldsProps {
  values: Record<AddressPartKey, string>;
  onChange: (key: AddressPartKey, value: string) => void;
  className?: string;
}

export function AddressPartFields({ values, onChange, className }: AddressPartFieldsProps) {
  return (
    <div className={className}>
      <div className="flex gap-12">
        {FIELDS.map((field) => (
          <div key={field.key} className="min-w-0 flex-1">
            <p className="mb-4 px-4 text-caption text-text-secondary">{field.label}</p>
            <Input
              value={values[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
              maxLength={ADDRESS_PART_MAX_LENGTH}
              aria-label={field.label}
              inputMode="numeric"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
