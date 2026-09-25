import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteMedia,
  mediaSrc,
  setMediaCover,
  updateMedia,
  uploadMedia,
  type AdminCategory,
  type MediaRole,
} from '@/api/admin';
import { ApiError } from '@/api/client';
import { useAuth } from '@/app/AuthProvider';
import { ACCEPTED_MEDIA, fileProblem, MAX_MEDIA_PER_CATEGORY } from '@/lib/catalogForm';
import { Button, Notice, Pill } from '@/components/ui';
import { MediaRoleControls } from '@/components/MediaRoleControls';

const errorText = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback;

/**
 * Xizmat kartasining rasm va videolari.
 *
 * Muqova — roʻyxatda koʻrinadigan asosiy rasm; u faqat rasm boʻlishi
 * mumkin (video kadri statik emas). Birinchi yuklangan rasm avtomatik
 * muqova boʻladi, shuning uchun karta hech qachon rasmsiz qolmaydi.
 */
export function MediaManager({ category }: { category: AdminCategory }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const refresh = (updated: AdminCategory) => {
    queryClient.setQueryData(['admin', 'catalog', updated.id], updated);
    void queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] });
  };

  const upload = useMutation({
    mutationFn: (file: File) => uploadMedia(token as string, category.id, file),
    onSuccess: refresh,
  });
  const cover = useMutation({
    mutationFn: (mediaId: string) => setMediaCover(token as string, mediaId),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (mediaId: string) => deleteMedia(token as string, mediaId),
    onSuccess: refresh,
  });
  const role = useMutation({
    mutationFn: ({ mediaId, patch }: { mediaId: string; patch: { role?: MediaRole; caption?: string } }) =>
      updateMedia(token as string, mediaId, patch),
    onSuccess: refresh,
  });

  const pick = (file: File | undefined) => {
    if (!file) return;
    const found = fileProblem(file, category.media.length);
    setProblem(found);
    if (!found) upload.mutate(file);
    if (fileInput.current) fileInput.current.value = '';
  };

  const busy = upload.isPending || cover.isPending || remove.isPending || role.isPending;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-baseline justify-between gap-12">
        <h2 className="text-h3 text-text-primary">Rasm va video</h2>
        <span className="text-caption text-text-secondary">
          {category.media.length} / {MAX_MEDIA_PER_CATEGORY}
        </span>
      </div>

      {category.media.length === 0 && (
        <p className="text-body text-text-secondary">
          Hali fayl yoʻq. Birinchi yuklangan rasm muqova boʻladi va roʻyxatda koʻrinadi.
        </p>
      )}

      {category.media.length > 0 && (
        <ul className="grid grid-cols-2 gap-12 md:grid-cols-3">
          {category.media.map((item) => (
            <li key={item.id} className="flex flex-col gap-8">
              <div className="overflow-hidden rounded-md border border-border bg-surface-sunken">
                {item.kind === 'IMAGE' ? (
                  <img
                    src={mediaSrc(item.url)}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <video src={mediaSrc(item.url)} controls className="aspect-[4/3] w-full object-cover" />
                )}
              </div>

              <div className="flex items-center justify-between gap-8">
                {item.isCover ? (
                  <Pill tone="success">muqova</Pill>
                ) : item.kind === 'IMAGE' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => cover.mutate(item.id)}
                    className="text-caption-strong text-primary disabled:opacity-50"
                  >
                    Muqova qilish
                  </button>
                ) : (
                  <Pill>video</Pill>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove.mutate(item.id)}
                  className="text-caption-strong text-danger disabled:opacity-50"
                >
                  Oʻchirish
                </button>
              </div>

              {item.kind === 'IMAGE' && (
                <MediaRoleControls
                  item={item}
                  disabled={busy}
                  onChange={(patch) => role.mutate({ mediaId: item.id, patch })}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {problem && <Notice>{problem}</Notice>}
      {upload.isError && <Notice>{errorText(upload.error, 'Faylni yuklab boʻlmadi')}</Notice>}
      {remove.isError && <Notice>{errorText(remove.error, 'Faylni oʻchirib boʻlmadi')}</Notice>}
      {cover.isError && <Notice>{errorText(cover.error, 'Muqovani belgilab boʻlmadi')}</Notice>}
      {role.isError && <Notice>{errorText(role.error, 'Rasm sozlamasini saqlab boʻlmadi')}</Notice>}

      <div>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_MEDIA}
          className="hidden"
          onChange={(event) => pick(event.target.files?.[0])}
        />
        <Button
          variant="secondary"
          loading={upload.isPending}
          disabled={busy || category.media.length >= MAX_MEDIA_PER_CATEGORY}
          onClick={() => fileInput.current?.click()}
        >
          Fayl qoʻshish
        </Button>
        <p className="mt-4 text-caption text-text-secondary">
          Rasm: JPEG, PNG yoki WebP, 5 MB gacha. Video: MP4, 60 MB gacha.
        </p>
      </div>
    </div>
  );
}
