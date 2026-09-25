-- Xizmat sahifasining toʻliq mazmuni (jarayon, FAQ, uskunalar, kafolat).
--
-- Hammasi IXTIYORIY: admin toʻldirmasa ilovada oʻsha blok umuman
-- koʻrsatilmaydi. Boʻsh blok yoki «maʼlumot yoʻq» yozuvi chiqmaydi.
--
-- Migratsiya faqat QOʻSHADI: hech bir ustun oʻchirilmaydi va turi
-- oʻzgartirilmaydi, shuning uchun eski ilova ishlab turaveradi.

-- «Bizning jarayonimiz» va FAQ — koʻrsatish uchun tartiblangan roʻyxatlar.
-- Shakli DTO chegarasida tekshiriladi (`steps`, `faq`).
ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "steps" JSONB;
ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "faq" JSONB;

-- «Sizdan bizga nima kerak boʻladi» va ishonch bandlari.
ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "requirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Zarardan himoya. Izoh va summa BIRGA maʼnoli.
ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "warranty_note" VARCHAR(300);
ALTER TABLE "service_categories" ADD COLUMN IF NOT EXISTS "warranty_amount" INTEGER;

-- Rasmning sahifadagi oʻrni: «oldin/keyin» juftligi va uskunalar tasmasi
-- uchun alohida rol kerak. Mavjud rasmlar GALLERY boʻlib qoladi.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ServiceMediaRole') THEN
    CREATE TYPE "ServiceMediaRole" AS ENUM ('GALLERY', 'BEFORE', 'AFTER', 'EQUIPMENT');
  END IF;
END
$$;

ALTER TABLE "service_media" ADD COLUMN IF NOT EXISTS "role" "ServiceMediaRole" NOT NULL DEFAULT 'GALLERY';
ALTER TABLE "service_media" ADD COLUMN IF NOT EXISTS "caption" VARCHAR(80);
