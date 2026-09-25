import { useState } from 'react';
import { CaretDown, ShieldCheck } from '@phosphor-icons/react';
import { API_BASE_URL } from '@/api/client';
import { mediaSrc } from '@/lib/servicePresentation';
import { formatPrice } from '@/lib/formatters';
import type { ServiceFaqItem, ServicePage } from '@/api/servicePage';

/**
 * Xizmat sahifasining qoʻshimcha bloklari.
 *
 * Har bir blok FAQAT toʻldirilgan boʻlsa chiziladi: boʻsh sarlavha yoki
 * «maʼlumot yoʻq» yozuvi sahifani uzaytiradi va hech narsa bermaydi.
 */
export function ServicePageBlocks({ page }: { page: ServicePage }) {
  return (
    <>
      {page.beforeAfter && (
        <Section title="Oldin va keyin">
          <div className="grid grid-cols-2 gap-8">
            <Shot url={page.beforeAfter.before} label="Oldin" />
            <Shot url={page.beforeAfter.after} label="Keyin" />
          </div>
        </Section>
      )}

      {page.highlights.length > 0 && (
        <Section title="Nega bizga ishonasiz">
          <ul className="flex flex-col gap-8">
            {page.highlights.map((item) => (
              <li key={item} className="text-body text-text-primary">
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.steps.length > 0 && (
        <Section title="Bizning jarayonimiz">
          <ol className="flex flex-col gap-16">
            {page.steps.map((step, index) => (
              <li key={`${step.title}-${index}`} className="flex gap-12">
                <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-caption-strong text-text-secondary">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-body-strong text-text-primary">{step.title}</p>
                  {step.description && (
                    <p className="mt-2 text-body-sm text-text-secondary">{step.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {page.equipment.length > 0 && (
        <Section title="Bizning uskunalarimiz">
          <ul className="grid grid-cols-3 gap-8">
            {page.equipment.map((item) => (
              <li key={item.url}>
                <img
                  src={mediaSrc(API_BASE_URL, item.url)}
                  alt=""
                  className="aspect-square w-full rounded-md object-cover"
                />
                {item.caption && (
                  <p className="mt-4 text-caption text-text-secondary">{item.caption}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.requirements.length > 0 && (
        <Section title="Sizdan nima kerak boʻladi">
          <ul className="flex flex-col gap-8">
            {page.requirements.map((item) => (
              <li key={item} className="text-body text-text-primary">
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {page.warranty && (
        <Section title="Zarardan himoya">
          <div className="flex gap-12 rounded-md bg-surface-sunken p-16">
            <ShieldCheck size={24} weight="fill" className="shrink-0 text-success" aria-hidden />
            <div className="min-w-0">
              <p className="text-body text-text-primary">{page.warranty.note}</p>
              <p className="mt-4 text-body-sm text-text-secondary">
                {formatPrice(page.warranty.amount)}gacha qoplanadi
              </p>
            </div>
          </div>
        </Section>
      )}

      {page.faq.length > 0 && (
        <Section title="Tez-tez beriladigan savollar">
          <ul className="flex flex-col gap-8">
            {page.faq.map((item, index) => (
              <FaqRow key={`${item.question}-${index}`} item={item} />
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-24 px-4">
    <h2 className="text-overline uppercase text-text-secondary">{title}</h2>
    <div className="mt-12">{children}</div>
  </section>
);

const Shot = ({ url, label }: { url: string; label: string }) => (
  <figure>
    <img src={mediaSrc(API_BASE_URL, url)} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />
    <figcaption className="mt-4 text-caption text-text-secondary">{label}</figcaption>
  </figure>
);

/** Javob yopiq turadi: savollar roʻyxati bir qarashda koʻrinsin. */
function FaqRow({ item }: { item: ServiceFaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-12 px-16 py-12 text-left"
      >
        <span className="text-body text-text-primary">{item.question}</span>
        <CaretDown
          size={16}
          weight="bold"
          aria-hidden
          className={`shrink-0 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <p className="whitespace-pre-line px-16 pb-12 text-body-sm text-text-secondary">
          {item.answer}
        </p>
      )}
    </li>
  );
}
