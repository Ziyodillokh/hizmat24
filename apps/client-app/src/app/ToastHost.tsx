import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Toast, type ToastVariant } from '@/components/Toast';

/**
 * Amal natijasi haqida qisqa javob.
 *
 * Haqiqiy ilovada tugma bosilgach nimadir "sodir bo'lgani" ko'rinishi kerak —
 * ekran jimgina o'zgarsa, foydalanuvchi amal ishlaganiga ishonchsiz qoladi.
 */
interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

const ToastContext = createContext<((message: string, variant?: ToastVariant) => void) | null>(
  null,
);

export function useToast(): (message: string, variant?: ToastVariant) => void {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast faqat ToastHost ichida ishlatiladi');
  return show;
}

let nextId = 0;

export function ToastHost({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const show = useCallback((message: string, variant: ToastVariant = 'neutral') => {
    nextId += 1;
    setToast({ id: nextId, message, variant });
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[92px]">
          <div className="pointer-events-auto w-full max-w-[420px] px-20">
            <Toast
              key={toast.id}
              message={toast.message}
              variant={toast.variant}
              onDismiss={() => setToast(null)}
            />
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
