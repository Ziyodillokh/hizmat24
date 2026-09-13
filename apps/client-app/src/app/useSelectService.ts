import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './store';

/**
 * Xizmat tanlash: qoralamaga kategoriya yoziladi va tafsilotlar ekraniga
 * oʻtiladi.
 *
 * Bosh sahifa kartasi = guruh sahifasi qatori = "Barcha xizmatlar" qatori.
 * Uch ekran bir xil ikki qatorni takrorlardi; bittasi oʻzgarsa qolganlari
 * jimgina orqada qolardi.
 */
export function useSelectService(): (categoryId: string) => void {
  const navigate = useNavigate();
  const { setDraftCategory } = useApp();

  return useCallback(
    (categoryId: string) => {
      setDraftCategory(categoryId);
      navigate('/app/new/details');
    },
    [navigate, setDraftCategory],
  );
}
