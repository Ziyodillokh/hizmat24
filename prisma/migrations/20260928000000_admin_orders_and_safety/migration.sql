-- Operator paneli: buyurtmalar monitoringi (A3) va xavfsizlik signallari (A4).
--
-- Signalda «yopildi» degan yagona holat yetarli emas: uch xil natija uch
-- xil xulosa beradi. Tasdiqlangan hodisa ustani bloklashga olib keladi,
-- yolgʻon signal esa hech narsaga; bogʻlana olmaslik — ish tugamagani.
CREATE TYPE "SafetyResolution" AS ENUM ('CONFIRMED', 'FALSE_ALARM', 'NO_CONTACT');

ALTER TABLE "safety_alerts" ADD COLUMN "resolution" "SafetyResolution";
ALTER TABLE "safety_alerts" ADD COLUMN "resolution_note" VARCHAR(1000);
ALTER TABLE "safety_alerts" ADD COLUMN "resolved_by_admin_id" UUID;

-- Operator amallari ham audit izini qoldiradi: «nega bu buyurtma bekor
-- qilindi» degan savolga javob shu yozuvlardan topiladi.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_ORDER_REQUEUED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_ORDER_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SAFETY_ALERT_RESOLVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MASTER_BLOCKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MASTER_UNBLOCKED';
