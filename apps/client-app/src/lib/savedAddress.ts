import type { OrderAddress } from '@/mocks/types';

/**
 * Saqlangan manzillar.
 *
 * Bugun buyurtma berishda manzil HAR SAFAR qoʻldan yoziladi — va yozilmaydi
 * ham: forma qattiq yozilgan "Toshkent, Chilonzor 9-kvartal, 42-uy" bilan
 * toʻldirilgan holda ochilardi. Bu ilovadagi eng koʻp takrorlanadigan ish va
 * eng arzon yolgʻon edi.
 *
 * MUHIM CHEGARA: bu yerda koordinata YOʻQ va boʻlmaydi. `OrderAddress` faqat
 * matn saqlaydi, ilovada xarita kutubxonasi ham, geolokatsiya plagini ham
 * oʻrnatilmagan. Shuning uchun saqlangan manzil masofa, ETA yoki "eng yaqin
 * usta" uchun ishlatilmaydi — u faqat yozishni tejaydi.
 */
export type AddressKind = 'home' | 'work' | 'other';

export const ADDRESS_KINDS: readonly AddressKind[] = ['home', 'work', 'other'];

export const ADDRESS_KIND_LABELS: Record<AddressKind, string> = {
  home: 'Uy',
  work: 'Ish',
  other: 'Boshqa',
};

export interface SavedAddress {
  /** Ichki kalit. EKRANDA HECH QACHON CHIZILMAYDI. */
  id: string;
  kind: AddressKind;
  /**
   * Foydalanuvchi qoʻygan nom. Boʻsh boʻlishi normal holat — bunda tur
   * yorligʻi ("Uy") sarlavha boʻladi, shuning uchun nom majburiy emas.
   */
  name: string;
  address: OrderAddress;
  createdAt: Date;
  /** Oxirgi marta buyurtmada ishlatilgan payt; ishlatilmagan boʻlsa `null`. */
  lastUsedAt: Date | null;
}

/**
 * Saqlanadigan manzillar soni.
 *
 * Chegara borligi uchun emas, oqilona boʻlgani uchun: oʻn beshta manzilli
 * roʻyxatda kerakli manzilni qidirish uni qoʻldan yozishdan sekinroq
 * boʻlardi va butun maʼno yoʻqolardi.
 */
export const ADDRESS_LIMIT = 10;

/** `AddressStep` dagi mavjud qoida bilan bir xil. */
export const ADDRESS_LABEL_MIN = 5;
export const ADDRESS_LABEL_MAX = 300;
export const ADDRESS_NAME_MAX = 40;

/** Roʻyxatdagi sarlavha: nom boʻlmasa tur yorligʻi. */
export const addressTitle = (saved: SavedAddress): string =>
  saved.name.trim() || ADDRESS_KIND_LABELS[saved.kind];

/** Taqqoslash uchun bir xil shaklga keltiradi — registr va boʻshliq hisobga olinmaydi. */
const normalizePart = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Ikki manzil AYNAN bir xilmi. */
export function isSameAddress(a: OrderAddress, b: OrderAddress): boolean {
  return (
    normalizePart(a.label) === normalizePart(b.label) &&
    normalizePart(a.entrance) === normalizePart(b.entrance) &&
    normalizePart(a.floor) === normalizePart(b.floor) &&
    normalizePart(a.apartment) === normalizePart(b.apartment)
  );
}

/**
 * Roʻyxatda shu manzil allaqachon bormi.
 *
 * `exceptId` — tahrirlashda oʻz yozuvini "takror" deb hisoblamaslik uchun.
 */
export function findDuplicate(
  list: readonly SavedAddress[],
  address: OrderAddress,
  exceptId?: string,
): SavedAddress | undefined {
  return list.find((item) => item.id !== exceptId && isSameAddress(item.address, address));
}

/**
 * Roʻyxat tartibi: oxirgi ishlatilgani birinchi.
 *
 * Alifbo tartibi emas: buyurtma berishda kerakli manzil deyarli har doim
 * oxirgi ishlatilgani boʻladi. Hech qachon ishlatilmaganlar yaratilish
 * tartibida, eng yangisi yuqorida.
 *
 * Kirish massivi OʻZGARTIRILMAYDI.
 */
export function sortAddresses(list: readonly SavedAddress[]): SavedAddress[] {
  return [...list].sort((a, b) => {
    if (a.lastUsedAt && b.lastUsedAt) return b.lastUsedAt.getTime() - a.lastUsedAt.getTime();
    if (a.lastUsedAt) return -1;
    if (b.lastUsedAt) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

export interface AddressFormInput {
  kind: AddressKind;
  name: string;
  label: string;
  entrance: string;
  floor: string;
  apartment: string;
}

export const EMPTY_ADDRESS_FORM: AddressFormInput = {
  kind: 'home',
  name: '',
  label: '',
  entrance: '',
  floor: '',
  apartment: '',
};

/**
 * Formadan `OrderAddress` yasaydi.
 *
 * Boʻsh maydon `undefined` boʻladi, boʻsh satr EMAS: `addressDetailsLine`
 * boʻsh satrni ham "bor" deb hisoblab "· ·" chizardi.
 */
export function buildAddress(input: AddressFormInput): OrderAddress {
  return {
    label: input.label.trim(),
    entrance: input.entrance.trim() || undefined,
    floor: input.floor.trim() || undefined,
    apartment: input.apartment.trim() || undefined,
  };
}

/** Saqlangan manzildan formani tiklaydi — tahrirlash uchun. */
export function toAddressForm(saved: SavedAddress): AddressFormInput {
  return {
    kind: saved.kind,
    name: saved.name,
    label: saved.address.label,
    entrance: saved.address.entrance ?? '',
    floor: saved.address.floor ?? '',
    apartment: saved.address.apartment ?? '',
  };
}

export const canSaveAddress = (input: AddressFormInput): boolean =>
  input.label.trim().length >= ADDRESS_LABEL_MIN;

/**
 * Tugma nega ishlamayotgani. `null` — hammasi joyida.
 *
 * `disputeHint` va `submitHint` bilan bir xil naqsh: sabab tugmaning ostida
 * yoziladi, foydalanuvchi taxmin qilib oʻtirmaydi.
 */
export function addressSaveHint(
  input: AddressFormInput,
  duplicate?: SavedAddress,
): string | null {
  const label = input.label.trim();
  if (label.length === 0) return 'Manzilni kiriting';
  if (label.length < ADDRESS_LABEL_MIN) return `Manzil kamida ${ADDRESS_LABEL_MIN} belgi boʻlishi kerak`;
  if (duplicate) return `Bu manzil allaqachon saqlangan: ${addressTitle(duplicate)}`;
  return null;
}

/** Roʻyxat toʻlganmi — yangi qoʻshish tugmasi shunga qarab chiziladi. */
export const isAddressListFull = (list: readonly SavedAddress[]): boolean =>
  list.length >= ADDRESS_LIMIT;
