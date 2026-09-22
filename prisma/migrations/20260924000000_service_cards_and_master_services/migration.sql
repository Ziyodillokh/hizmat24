-- CreateEnum
CREATE TYPE "ServicePriceKind" AS ENUM ('FIXED', 'FROM');

-- CreateEnum
CREATE TYPE "ServiceMediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- DropIndex
DROP INDEX "master_service_categories_category_id_idx";

-- AlterTable
ALTER TABLE "master_service_categories" ADD COLUMN     "is_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "service_categories" ADD COLUMN     "details" TEXT,
ADD COLUMN     "duration_minutes" INTEGER,
ADD COLUMN     "excludes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "price_kind" "ServicePriceKind" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "summary" VARCHAR(200);

-- CreateTable
CREATE TABLE "service_media" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "kind" "ServiceMediaKind" NOT NULL,
    "url" VARCHAR(300) NOT NULL,
    "poster_url" VARCHAR(300),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_media_category_id_sort_order_idx" ON "service_media"("category_id", "sort_order");

-- CreateIndex
CREATE INDEX "master_service_categories_category_id_is_enabled_idx" ON "master_service_categories"("category_id", "is_enabled");

-- AddForeignKey
ALTER TABLE "service_media" ADD CONSTRAINT "service_media_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Kategoriyada faqat BITTA muqova rasmi boʻlishi mumkin.
--
-- Servis darajasida tekshiruv poygaga ochiq: ikki admin bir vaqtda ikki
-- rasmni muqova qilsa, ikkalasi ham yozilib qolardi va roʻyxatda qaysi
-- biri chiqishi tasodifga bogʻliq boʻlardi. Qisman indeks buni bazada
-- toʻxtatadi.
CREATE UNIQUE INDEX "service_media_one_cover_per_category"
  ON "service_media" ("category_id")
  WHERE "is_cover" = true;
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.
