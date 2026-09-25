import { Button } from '@/components/ui';

/**
 * Ikki maydonli qatorlar roʻyxati — bosqichlar va savol-javoblar uchun.
 *
 * Ikkalasining tuzilishi bir xil (sarlavha + matn, tartib, oʻchirish),
 * shuning uchun bitta komponent: ikki nusxa yozilsa, biriga qoʻshilgan
 * tuzatish ikkinchisida unutilib ketardi.
 *
 * Maydonlar `head`/`body` deb ataladi: bosqichda bu sarlavha va tavsif,
 * savolda esa savol va javob.
 */
export interface PairRow {
  head: string;
  body: string;
}

interface FieldSpec {
  label: string;
  placeholder: string;
  max: number;
}

export function PairEditor({
  label,
  hint,
  rows,
  onChange,
  headField,
  bodyField,
  addLabel,
  max,
  numbered = false,
}: {
  label: string;
  hint?: string;
  rows: PairRow[];
  onChange: (rows: PairRow[]) => void;
  headField: FieldSpec;
  bodyField: FieldSpec;
  addLabel: string;
  max: number;
  /** Bosqichlar raqamlanadi — mijoz ekranida ular tartib bilan chiziladi. */
  numbered?: boolean;
}) {
  const replace = (index: number, patch: Partial<PairRow>) =>
    onChange(rows.map((row, position) => (position === index ? { ...row, ...patch } : row)));

  const remove = (index: number) => onChange(rows.filter((_, position) => position !== index));

  /** Tartib mijoz ekranida koʻrinadi, shuning uchun uni qoʻlda oʻzgartirib boʻlsin. */
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;

    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-12">
      <div>
        <span className="text-caption-strong text-text-secondary">{label}</span>
        {hint && <p className="text-caption text-text-secondary">{hint}</p>}
      </div>

      {rows.map((row, index) => (
        <div
          key={index}
          className="flex flex-col gap-8 rounded-md border border-border bg-surface-elevated p-12"
        >
          <div className="flex items-center justify-between gap-8">
            <span className="text-caption-strong text-text-secondary">
              {numbered ? `${index + 1}-bosqich` : `${index + 1}`}
            </span>

            <div className="flex items-center gap-8">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="text-caption-strong text-text-secondary disabled:text-text-disabled"
                aria-label={`${index + 1}-qatorni yuqoriga koʻchirish`}
              >
                Yuqoriga
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === rows.length - 1}
                className="text-caption-strong text-text-secondary disabled:text-text-disabled"
                aria-label={`${index + 1}-qatorni pastga koʻchirish`}
              >
                Pastga
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-caption-strong text-danger"
                aria-label={`${index + 1}-qatorni oʻchirish`}
              >
                Oʻchirish
              </button>
            </div>
          </div>

          <input
            value={row.head}
            onChange={(event) => replace(index, { head: event.target.value })}
            placeholder={headField.placeholder}
            maxLength={headField.max}
            aria-label={`${index + 1}. ${headField.label}`}
            className="h-40 rounded-md border border-border bg-surface px-12 text-body text-text-primary placeholder:text-text-disabled"
          />

          <textarea
            value={row.body}
            onChange={(event) => replace(index, { body: event.target.value })}
            placeholder={bodyField.placeholder}
            maxLength={bodyField.max}
            rows={2}
            aria-label={`${index + 1}. ${bodyField.label}`}
            className="rounded-md border border-border bg-surface px-12 py-8 text-body text-text-primary placeholder:text-text-disabled"
          />
        </div>
      ))}

      <div>
        <Button
          variant="secondary"
          onClick={() => onChange([...rows, { head: '', body: '' }])}
          disabled={rows.length >= max}
        >
          {addLabel}
        </Button>
        {rows.length >= max && (
          <p className="pt-4 text-caption text-text-secondary">Koʻpi bilan {max} ta.</p>
        )}
      </div>
    </div>
  );
}
