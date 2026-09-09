import { cn } from '@/lib/cn';

/**
 * Chat xabari.
 *
 * Oʻz xabari oʻngda va `primary` fonda, kelgan xabar chapda va yuza
 * rangida. Burchak radiusi yuboruvchi tomonda kichrayadi ("dumcha") —
 * bu xabar kimdan kelganini rangdan tashqari SHAKL bilan ham aytadi va
 * rangni ajrata olmaydigan foydalanuvchi ham suhbatni oʻqiy oladi.
 */
export type BubbleSide = 'own' | 'other';

export interface ChatBubbleProps {
  side: BubbleSide;
  text: string;
  /** "14:32" koʻrinishidagi vaqt. */
  time: string;
  className?: string;
}

export function ChatBubble({ side, text, time, className }: ChatBubbleProps) {
  const isOwn = side === 'own';

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start', className)}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-12 py-8',
          isOwn
            ? 'rounded-br-xs bg-primary text-on-primary'
            : cn(
                'rounded-bl-xs border border-transparent bg-surface-elevated text-text-primary shadow-e1',
                "[[data-theme='dark']_&]:border-border",
              ),
        )}
      >
        <p className="whitespace-pre-wrap break-words text-body">{text}</p>
        <p
          className={cn(
            'tabular mt-2 text-right text-caption',
            isOwn ? 'text-on-primary/[0.7]' : 'text-text-secondary',
          )}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

/**
 * Kun ajratkichi ("Bugun", "Kecha", "5-sentabr").
 *
 * Xabar ostidagi soat KUNni aytmaydi: uch kunlik suhbatda "09:15" ikki marta
 * uchraydi va qaysi biri qachonligi bilinmaydi. Ajratkich shuni hal qiladi.
 */
export function ChatDayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="rounded-full bg-surface-sunken px-12 py-4 text-caption text-text-secondary">
        {label}
      </span>
    </div>
  );
}

/** Uchta nuqta — suhbatdosh javob yozayotgan payt. */
export function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          'flex items-center gap-4 rounded-lg rounded-bl-xs px-16 py-12',
          'border border-transparent bg-surface-elevated shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
        role="status"
        aria-label="Javob yozilmoqda"
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            aria-hidden
            style={{ animationDelay: `${index * 160}ms` }}
            className="h-[6px] w-[6px] rounded-full bg-text-secondary motion-safe:animate-typing-dot"
          />
        ))}
      </div>
    </div>
  );
}
