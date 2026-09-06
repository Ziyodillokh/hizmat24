import type { ReactNode } from 'react';

/** Galereya bo'limi — dev qobig'i, mahsulot qismi emas. */
export function GallerySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-32">
      <h2 className="text-h3 text-text-primary">{title}</h2>
      <div className="mt-12 flex flex-wrap items-start gap-16 rounded-lg bg-surface p-20">
        {children}
      </div>
    </section>
  );
}

export function GalleryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-8">
      <p className="text-caption text-text-secondary">{label}</p>
      <div className="flex flex-wrap items-center gap-12">{children}</div>
    </div>
  );
}
