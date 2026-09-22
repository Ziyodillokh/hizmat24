import { useState } from 'react';
import { Button } from '@/components/ui';

/**
 * «Narx ichiga kiradi» kabi qator roʻyxatlar muharriri.
 *
 * Har bir band alohida qator: mijoz ekranida ular belgilangan roʻyxat
 * boʻlib chiziladi, shuning uchun ularni bitta matn maydoniga yozib
 * keyin ajratish ishonchsiz boʻlardi (vergul bandning ichida ham uchraydi).
 */
export function ListEditor({
  label,
  hint,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <span className="text-caption-strong text-text-secondary">{label}</span>
        {hint && <p className="text-caption text-text-secondary">{hint}</p>}
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col gap-4">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center justify-between gap-8 rounded-md border border-border px-12 py-8"
            >
              <span className="min-w-0 break-words text-body text-text-primary">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, position) => position !== index))}
                className="shrink-0 text-caption-strong text-danger"
                aria-label={`«${item}» bandini oʻchirish`}
              >
                Oʻchirish
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-8">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return;
            // Enter shakl yuborilishini boshlamasligi kerak — u bandni qoʻshadi.
            event.preventDefault();
            add();
          }}
          placeholder={placeholder}
          className="h-40 flex-1 rounded-md border border-border bg-surface-elevated px-12 text-body text-text-primary placeholder:text-text-disabled"
        />
        <Button variant="secondary" onClick={add} disabled={draft.trim().length === 0}>
          Qoʻshish
        </Button>
      </div>
    </div>
  );
}
