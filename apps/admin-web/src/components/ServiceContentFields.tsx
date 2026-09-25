import { Card, Field } from '@/components/ui';
import { ListEditor } from '@/components/ListEditor';
import { PairEditor } from '@/components/PairEditor';
import {
  FAQ_ANSWER_MAX,
  FAQ_QUESTION_MAX,
  MAX_FAQ,
  MAX_HIGHLIGHTS,
  MAX_REQUIREMENTS,
  MAX_STEPS,
  STEP_TEXT_MAX,
  STEP_TITLE_MAX,
  WARRANTY_NOTE_MAX,
  type ContentFormState,
} from '@/lib/catalogContent';

/**
 * Xizmat sahifasining mazmun bloklari.
 *
 * `CategoryEditScreen` dan ataylab ajratilgan: oltita blok oʻsha ekranga
 * qoʻshilganda u 500 qatordan oshib ketardi va asosiy maydonlar (nom,
 * narx) matnlar ichida koʻrinmay qolardi.
 *
 * Har bir blok IXTIYORIY: toʻldirilmasa ilovada u umuman chizilmaydi.
 * Shuning uchun bu yerda hech qaysi maydon «majburiy» deb belgilanmagan.
 */
export function ServiceContentFields({
  form,
  patch,
}: {
  form: ContentFormState;
  patch: (next: Partial<ContentFormState>) => void;
}) {
  return (
    <>
      <Card className="flex flex-col gap-20 p-20">
        <PairEditor
          label="Bizning jarayonimiz"
          hint="Mijoz ish qanday ketishini oldindan koʻradi. Tartib muhim."
          rows={form.steps.map((step) => ({ head: step.title, body: step.description }))}
          onChange={(rows) =>
            patch({ steps: rows.map((row) => ({ title: row.head, description: row.body })) })
          }
          headField={{ label: 'Bosqich nomi', placeholder: 'Nam tozalash', max: STEP_TITLE_MAX }}
          bodyField={{
            label: 'Bosqich tavsifi',
            placeholder: 'Nam mikrofiber mato bilan tozalash',
            max: STEP_TEXT_MAX,
          }}
          addLabel="Bosqich qoʻshish"
          max={MAX_STEPS}
          numbered
        />
      </Card>

      <Card className="flex flex-col gap-20 p-20">
        <PairEditor
          label="Tez-tez beriladigan savollar"
          hint="Javobsiz savol saqlanmaydi"
          rows={form.faq.map((item) => ({ head: item.question, body: item.answer }))}
          onChange={(rows) =>
            patch({ faq: rows.map((row) => ({ question: row.head, answer: row.body })) })
          }
          headField={{
            label: 'Savol',
            placeholder: 'Ushbu xizmat barcha lavabolar uchun amal qiladimi?',
            max: FAQ_QUESTION_MAX,
          }}
          bodyField={{
            label: 'Javob',
            placeholder: 'Ha, standart lavabolarning barcha turlari uchun.',
            max: FAQ_ANSWER_MAX,
          }}
          addLabel="Savol qoʻshish"
          max={MAX_FAQ}
        />
      </Card>

      <Card className="flex flex-col gap-20 p-20">
        <ListEditor
          label="Sizdan bizga nima kerak boʻladi"
          hint="Mijoz usta kelishidan oldin tayyorlaydigan narsalar"
          items={form.requirements}
          onChange={(requirements) => patch({ requirements })}
          placeholder="Suvni oʻchirish imkoni"
        />
        <ListEditor
          label="Ishonch bandlari"
          hint={`Koʻpi bilan ${MAX_HIGHLIGHTS} ta. Reyting bu yerga YOZILMAYDI — u haqiqiy buyurtmalardan hisoblanadi.`}
          items={form.highlights}
          onChange={(highlights) => patch({ highlights })}
          placeholder="100+ soat davomida oʻqitilgan usta"
        />
        {form.requirements.length >= MAX_REQUIREMENTS && (
          <p className="text-caption text-text-secondary">
            «Sizdan nima kerak» boʻlimida koʻpi bilan {MAX_REQUIREMENTS} ta band.
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-20 p-20">
        <div>
          <span className="text-caption-strong text-text-secondary">Zarardan himoya</span>
          <p className="text-caption text-text-secondary">
            Izoh va summa BIRGA toʻldiriladi — yarimtasi mijozni chalgʻitadi.
          </p>
        </div>

        <Field
          label="Izoh"
          hint={`Koʻpi bilan ${WARRANTY_NOTE_MAX} belgi`}
          value={form.warrantyNote}
          maxLength={WARRANTY_NOTE_MAX}
          onChange={(event) => patch({ warrantyNote: event.target.value })}
          placeholder="Ish paytida zarar yetkazilsa qoplanadi"
        />

        <Field
          label="Qoplama chegarasi (soʻm)"
          inputMode="numeric"
          value={form.warrantyAmount}
          onChange={(event) => patch({ warrantyAmount: event.target.value })}
          placeholder="5000000"
        />
      </Card>
    </>
  );
}
