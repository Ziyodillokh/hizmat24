-- Usta tomoni serverga ulandi (B5): ish qabul qilish, rad etish va smena
-- oʻzgarishi ham audit izini qoldirishi kerak. «Nega bu buyurtma boshqa
-- ustaga oʻtdi» degan savolga javob shu yozuvlardan topiladi.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MASTER_ORDER_ACCEPTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MASTER_ORDER_DECLINED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MASTER_SHIFT_CHANGED';
