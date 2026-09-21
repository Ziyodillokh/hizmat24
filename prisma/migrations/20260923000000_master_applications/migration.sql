-- CreateEnum
CREATE TYPE "MasterApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'MASTER_APPLICATION_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'MASTER_APPLICATION_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'MASTER_APPLICATION_REJECTED';

-- AlterTable
ALTER TABLE "masters" ADD COLUMN     "user_id" UUID;

-- CreateTable
CREATE TABLE "master_profiles" (
    "master_id" UUID NOT NULL,
    "about" VARCHAR(1000) NOT NULL,
    "districts" TEXT[],
    "work_from" INTEGER NOT NULL,
    "work_to" INTEGER NOT NULL,
    "claims_certificate" BOOLEAN NOT NULL DEFAULT false,
    "available_since" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "master_profiles_pkey" PRIMARY KEY ("master_id")
);

-- CreateTable
CREATE TABLE "master_applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "profession" VARCHAR(120) NOT NULL,
    "experience_level" "MasterExperienceLevel" NOT NULL,
    "claims_certificate" BOOLEAN NOT NULL DEFAULT false,
    "about" VARCHAR(1000) NOT NULL,
    "districts" TEXT[],
    "work_from" INTEGER NOT NULL,
    "work_to" INTEGER NOT NULL,
    "requested_category_ids" UUID[],
    "status" "MasterApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" VARCHAR(500),
    "reviewed_by_admin_id" UUID,
    "reviewed_at" TIMESTAMPTZ(3),
    "master_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "master_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "master_applications_status_created_at_idx" ON "master_applications"("status", "created_at");

-- CreateIndex
CREATE INDEX "master_applications_user_id_idx" ON "master_applications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "masters_user_id_key" ON "masters"("user_id");

-- AddForeignKey
ALTER TABLE "masters" ADD CONSTRAINT "masters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_profiles" ADD CONSTRAINT "master_profiles_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_applications" ADD CONSTRAINT "master_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_applications" ADD CONSTRAINT "master_applications_master_id_fkey" FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Bitta foydalanuvchida bir vaqtning oʻzida faqat BITTA kutayotgan ariza.
--
-- NEGA qisman (partial) unique indeks, servis tekshiruvi emas: «avval
-- oʻqib koʻraman, keyin yozaman» yoʻli poygaga ochiq — ikki soʻrov bir
-- vaqtda kelsa, ikkalasi ham «ariza yoʻq» deb koʻrib, ikkita PENDING yozib
-- qoʻyadi va moderator bir odamning arizasini ikki marta koʻradi. Indeks
-- buni bazaning oʻzida, qanday urinish boʻlishidan qatʼi nazar toʻxtatadi.
--
-- NEGA qisman: rad etilgan yoki tasdiqlangan arizalar TARIX sifatida
-- qoladi, ularga cheklov qoʻyilmaydi — odam rad javobidan keyin qaytadan
-- ariza bera oladi.
--
-- Servisdagi tekshiruv ham saqlanadi, lekin boshqa maqsad bilan: u
-- foydalanuvchiga oʻzbekcha tushunarli 409 matnini beradi. Indeks —
-- kafolat, tekshiruv — xushmuomalalik.
--
-- Prisma sxemasi qisman indeksni ifodalay olmaydi, shuning uchun u faqat
-- shu yerda, xom SQL da yashaydi.
CREATE UNIQUE INDEX "master_applications_one_pending_per_user"
  ON "master_applications" ("user_id")
  WHERE "status" = 'PENDING';
