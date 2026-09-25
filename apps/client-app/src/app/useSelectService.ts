import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './store';

/**
 * Xizmat tanlash: qoralamaga kategoriya va miqdor yoziladi, soʻng manzil
 * qadamiga oʻtiladi.
 *
 * Bosh sahifa kartasi = guruh sahifasi qatori = "Barcha xizmatlar" qatori.
 * Uch ekran bir xil ikki qatorni takrorlardi; bittasi oʻzgarsa qolganlari
 * jimgina orqada qolardi.
 *
 * Miqdor berilmasa 1 — roʻyxatdan toʻgʻridan-toʻgʻri boshlangan buyurtma
 * uchun shu toʻgʻri, sonni tanlash faqat xizmat sahifasida bor.
 */
export function useSelectService(): (categoryId: string, quantity?: number) => void {
  const navigate = useNavigate();
  const { setDraftCategory, setDraftQuantity } = useApp();

  return useCallback(
    (categoryId: string, quantity = 1) => {
      setDraftCategory(categoryId);
      setDraftQuantity(quantity);
      navigate('/app/new/address');
    },
    [navigate, setDraftCategory, setDraftQuantity],
  );
}

/**
 * Xizmat kartasini ochish — katalogdagi va bosh sahifadagi bosish shu
 * yerga olib keladi.
 *
 * Buyurtma DARHOL boshlanmaydi: mijoz avval nimani olayotganini koʻradi
 * (narx ichiga nimalar kiradi, qancha vaqt, rasm). Buyurtma kartadagi
 * tugmadan boshlanadi va u `useSelectService` ni chaqiradi.
 */
export function useOpenService(): (categoryId: string) => void {
  const navigate = useNavigate();

  return useCallback(
    (categoryId: string) => navigate(`/app/services/${categoryId}`),
    [navigate],
  );
}
