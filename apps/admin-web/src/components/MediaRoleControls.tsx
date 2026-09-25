import { useEffect, useState } from 'react';
import type { AdminMedia, MediaRole } from '@/api/admin';
import { captionProblem, MEDIA_ROLE_LABELS, MEDIA_ROLES } from '@/lib/catalogForm';

/**
 * Rasmning sahifadagi oʻrni va yorligʻi.
 *
 * Yorliq maydoni faqat «Uskuna» rolida koʻrinadi: qolgan rollarda u
 * ilovada hech qayerda chizilmaydi va boʻsh maydon adminni chalgʻitardi.
 *
 * Yorliq HAR BOSISHDA emas, fokus ketganda saqlanadi — har harf uchun
 * soʻrov yuborish serverni ham, tarmoqni ham bekorga band qilardi.
 */
export function MediaRoleControls({
  item,
  disabled,
  onChange,
}: {
  item: AdminMedia;
  disabled: boolean;
  onChange: (patch: { role?: MediaRole; caption?: string }) => void;
}) {
  const [caption, setCaption] = useState(item.caption ?? '');

  // Server javobi kelgach maydon yangi qiymatga tenglashadi — aks holda
  // boshqa joydan oʻzgargan yorliq ekranda eski boʻlib qolardi.
  useEffect(() => setCaption(item.caption ?? ''), [item.caption]);

  const problem = captionProblem(item.role, caption);

  return (
    <div className="flex flex-col gap-8">
      <label className="flex flex-col gap-4">
        <span className="text-caption-strong text-text-secondary">Sahifadagi oʻrni</span>
        <select
          value={item.role}
          disabled={disabled}
          onChange={(event) => onChange({ role: event.target.value as MediaRole })}
          className="h-40 rounded-md border border-border bg-surface-elevated px-12 text-body text-text-primary disabled:opacity-50"
        >
          {MEDIA_ROLES.map((role) => (
            <option key={role} value={role}>
              {MEDIA_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </label>

      {item.role === 'EQUIPMENT' && (
        <label className="flex flex-col gap-4">
          <span className="text-caption-strong text-text-secondary">Yorliq</span>
          <input
            value={caption}
            disabled={disabled}
            maxLength={80}
            onChange={(event) => setCaption(event.target.value)}
            onBlur={() => {
              if (caption.trim() === (item.caption ?? '').trim()) return;
              onChange({ caption: caption.trim() });
            }}
            placeholder="Mikrofiber matolar"
            className="h-40 rounded-md border border-border bg-surface-elevated px-12 text-body text-text-primary placeholder:text-text-disabled disabled:opacity-50"
          />
          {problem && <span className="text-caption text-danger">{problem}</span>}
        </label>
      )}
    </div>
  );
}
