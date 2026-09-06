import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { Textarea } from '@/components/Textarea';
import { ConfirmMasterScreen } from './ConfirmMasterScreen';

const NOTE_MAX = 1000;

/**
 * 17 · Xavfsizlik tasdigʻi (modal).
 *
 * 16-ekran ustida ochiladi, shuning uchun fon sifatida oʻsha ekran chiziladi —
 * modal kontekstsiz koʻrinmasin.
 */
export type SafetyConfirmVariant = 'default' | 'submitting';

export interface SafetyConfirmModalProps {
  variant?: SafetyConfirmVariant;
}

export function SafetyConfirmModal({ variant = 'default' }: SafetyConfirmModalProps) {
  const [note, setNote] = useState('');

  return (
    <div className="relative h-full">
      <ConfirmMasterScreen />

      <Modal open>
        <div className="flex flex-col items-center">
          <Icon icon={AlertTriangle} size={48} className="text-danger" />
          <h3 className="mt-16 text-center text-h3 text-text-primary">
            Bu amalni bekor qilib boʻlmaydi
          </h3>
          <p className="mt-8 text-center text-body text-text-secondary">
            Buyurtma toʻxtatiladi va operator siz bilan bogʻlanadi.
          </p>
        </div>

        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={NOTE_MAX}
          placeholder="Izoh (ixtiyoriy)"
          className="mt-20"
        />

        <div className="mt-20 flex flex-col gap-12">
          <Button variant="destructive" loading={variant === 'submitting'}>
            Tasdiqlash
          </Button>
          <Button variant="ghost">Orqaga</Button>
        </div>
      </Modal>
    </div>
  );
}
