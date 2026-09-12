import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildAddress,
  findDuplicate,
  isAddressListFull,
  isSameAddress,
  sortAddresses,
  type AddressFormInput,
  type SavedAddress,
} from '@/lib/savedAddress';
import type { OrderAddress } from '@/mocks/types';
import { clearAddresses, loadAddresses, saveAddresses } from './address-persistence';
import { useApp } from './store';

/**
 * Saqlangan manzillar holati.
 *
 * `AppProvider` ga tiqilmaydi: u buyurtma taymerlariga toʻla va manzil
 * yozuvi butun buyurtma daraxtini qayta hisoblashga majbur qilardi. Chat va
 * murojaat provideri bilan bir xil asos.
 */
interface AddressContextValue {
  /** Oxirgi ishlatilgani birinchi — buyurtma oqimida kerakli tartib. */
  addresses: SavedAddress[];
  /** Yangi qoʻshish tugmasi shunga qarab chiziladi. */
  isFull: boolean;
  findAddress: (id: string) => SavedAddress | undefined;
  /** Takror manzilni tekshiradi; `exceptId` — tahrirlashda oʻz yozuvi. */
  findDuplicateAddress: (input: AddressFormInput, exceptId?: string) => SavedAddress | undefined;
  /** Yaratadi va `id` ni qaytaradi. Roʻyxat toʻlgan boʻlsa `null`. */
  addAddress: (input: AddressFormInput) => string | null;
  updateAddress: (id: string, input: AddressFormInput) => void;
  removeAddress: (id: string) => void;
  /**
   * Buyurtma berilganda chaqiriladi.
   *
   * `id` emas, MANZILNING OʻZI uzatiladi: qoralamada saqlangan yozuvning
   * kaliti yoʻq va uni oqim boʻylab olib yurish uchun ortiqcha maydon
   * kerak boʻlardi. Mos yozuv topilmasa hech narsa qilinmaydi — qoʻldan
   * yozilgan manzil roʻyxatga oʻzicha qoʻshilmaydi.
   */
  noteAddressUsed: (address: OrderAddress) => void;
}

const AddressContext = createContext<AddressContextValue | null>(null);

export function useAddresses(): AddressContextValue {
  const value = useContext(AddressContext);
  if (!value) throw new Error('useAddresses faqat AddressProvider ichida ishlatiladi');
  return value;
}

// Tasodif ishlatilmaydi: bir xil sessiyada ketma-ket yaratilgan ikki yozuv
// ham albatta har xil kalit oladi.
let addressCounter = 0;

export function AddressProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useApp();
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => loadAddresses() ?? []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAddresses();
      return;
    }
    saveAddresses(addresses);
  }, [addresses, isAuthenticated]);

  // Maxfiylik talabi, qulaylik emas: uy manzili — shaxsiy maʼlumot va
  // keyingi foydalanuvchi uni koʻrmasligi kerak.
  useEffect(() => {
    if (!isAuthenticated) setAddresses([]);
  }, [isAuthenticated]);

  const addAddress = useCallback((input: AddressFormInput): string | null => {
    addressCounter += 1;
    const id = `adr-${Date.now().toString(36)}-${addressCounter}`;
    const record: SavedAddress = {
      id,
      kind: input.kind,
      name: input.name.trim(),
      address: buildAddress(input),
      createdAt: new Date(),
      lastUsedAt: null,
    };

    let created = false;
    setAddresses((prev) => {
      // Chegara SETTER ichida tekshiriladi: ekran ham tekshiradi, lekin
      // yagona kafolat shu yerda.
      if (isAddressListFull(prev)) return prev;
      created = true;
      return [record, ...prev];
    });

    return created ? id : null;
  }, []);

  const updateAddress = useCallback((id: string, input: AddressFormInput) => {
    setAddresses((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              kind: input.kind,
              name: input.name.trim(),
              address: buildAddress(input),
            }
          : item,
      ),
    );
  }, []);

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const noteAddressUsed = useCallback((address: OrderAddress) => {
    setAddresses((prev) => {
      const match = prev.find((item) => isSameAddress(item.address, address));
      if (!match) return prev;

      const usedAt = new Date();
      return prev.map((item) => (item.id === match.id ? { ...item, lastUsedAt: usedAt } : item));
    });
  }, []);

  const value = useMemo<AddressContextValue>(() => {
    const sorted = sortAddresses(addresses);
    return {
      addresses: sorted,
      isFull: isAddressListFull(addresses),
      findAddress: (id) => addresses.find((item) => item.id === id),
      findDuplicateAddress: (input, exceptId) =>
        findDuplicate(addresses, buildAddress(input), exceptId),
      addAddress,
      updateAddress,
      removeAddress,
      noteAddressUsed,
    };
  }, [addresses, addAddress, updateAddress, removeAddress, noteAddressUsed]);

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}
