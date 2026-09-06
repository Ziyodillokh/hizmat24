-- Xizmat guruhlari: bosh sahifadagi plitkalar va kategoriya ekranining tuzilmasi.
-- Taksonomiya admin panel orqali boshqariladi — ilovada hardcode qilinmaydi.

-- CreateTable
CREATE TABLE "service_groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "icon_key" VARCHAR(60) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_groups_name_key" ON "service_groups"("name");

-- CreateIndex
CREATE INDEX "service_groups_is_active_sort_order_idx" ON "service_groups"("is_active", "sort_order");

-- AlterTable
-- group_id nullable: guruhga biriktirilmagan xizmatlar ham yashayveradi.
ALTER TABLE "service_categories" ADD COLUMN "group_id" UUID,
                                 ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "service_categories_group_id_sort_order_idx" ON "service_categories"("group_id", "sort_order");

-- AddForeignKey
-- SET NULL: guruh o'chirilsa xizmatlar yo'qolmaydi, faqat guruhsiz qoladi.
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "service_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
