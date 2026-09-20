-- B3b — buyurtma serverga koʻchadi: narx tafsiloti, toʻlov usuli, reja va qisqa raqam.
--
-- Qoida (TZ 5-bo'lim, "Xavflar"): faqat QOʻSHISH. Bironta ustun oʻchirilmaydi va
-- nomi oʻzgartirilmaydi, shuning uchun migratsiya ishlab turgan bazada ham xavfsiz.

-- ── 1. Toʻlov usuli ────────────────────────────────────────────────────────
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'ESCROW');

-- ── 2. Qisqa raqam ketma-ketligi ───────────────────────────────────────────
-- 104901 dan boshlanadi: ilovadagi chek namunalari HZ-104xxx oraligʻida va
-- yangi raqamlar ular bilan chalkashmasligi kerak. Raqamni SERVER beradi —
-- ilova yuborgan qiymat hech qachon ishlatilmaydi.
CREATE SEQUENCE "orders_short_id_seq" START WITH 104901 MINVALUE 100000 MAXVALUE 999999;

-- ── 3. Yangi ustunlar ──────────────────────────────────────────────────────
ALTER TABLE "orders"
  ADD COLUMN "short_id"            VARCHAR(20),
  ADD COLUMN "scheduled_at"        TIMESTAMPTZ(3),
  ADD COLUMN "payment_method"      "PaymentMethod",
  ADD COLUMN "price_base"          INTEGER,
  ADD COLUMN "price_urgent_fee"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discount_percent"    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discount_amount"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "work_note"           VARCHAR(300),
  ADD COLUMN "handled_by_master"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "preferred_master_id" UUID;

-- ── 4. Mavjud satrlarni toʻldirish ─────────────────────────────────────────
-- `price_base` = eski `price`: eski buyurtmalarda shoshilinchlik qoʻshimchasi
-- ham, chegirma ham qoʻllanmagan edi, shuning uchun butun summa asosiy narx.
-- Bu taxmin emas, oʻsha kodning aynan xulqi.
UPDATE "orders" SET "price_base" = "price" WHERE "price_base" IS NULL;
UPDATE "orders"
   SET "short_id" = 'HZ-' || LPAD(nextval('orders_short_id_seq')::text, 6, '0')
 WHERE "short_id" IS NULL;

-- `payment_method` ataylab toʻldirilmaydi: eski buyurtmada toʻlov usuli
-- tanlanmagan, soxta "naqd" yozish — yolgʻon maʼlumot boʻlardi.

ALTER TABLE "orders"
  ALTER COLUMN "price_base" SET NOT NULL,
  ALTER COLUMN "short_id"   SET NOT NULL,
  ALTER COLUMN "short_id"   SET DEFAULT ('HZ-' || LPAD(nextval('orders_short_id_seq')::text, 6, '0'));

ALTER SEQUENCE "orders_short_id_seq" OWNED BY "orders"."short_id";

CREATE UNIQUE INDEX "orders_short_id_key" ON "orders"("short_id");

-- ── 5. Koordinata endi ixtiyoriy ───────────────────────────────────────────
-- Ilovada xarita yoʻq (K1 bosqichigacha), soxta koordinata yozilmaydi.
ALTER TABLE "orders" ALTER COLUMN "address_lat" DROP NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "address_lng" DROP NOT NULL;

-- ── 6. Soʻralgan usta ──────────────────────────────────────────────────────
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_preferred_master_id_fkey"
  FOREIGN KEY ("preferred_master_id") REFERENCES "masters"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "orders_preferred_master_id_idx" ON "orders"("preferred_master_id");

-- ── 7. Rejalashtirilgan buyurtmalarni sweeper tez topishi uchun ────────────
CREATE INDEX "orders_scheduled_at_idx" ON "orders"("scheduled_at");
