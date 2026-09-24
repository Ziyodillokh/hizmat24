-- Foydalanuvchilar boʻlimi (A5) va audit koʻrinishi (A7).
--
-- `PII_VIEWED`: toʻliq telefon raqamini koʻrish ALOHIDA amal. Roʻyxatda
-- raqam maskalangan turadi va uni ochgan odam iz qoldiradi — aks holda
-- panelga kirgan har kim minglab raqamni koʻchirib olishi mumkin edi.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_BLOCKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'USER_UNBLOCKED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PII_VIEWED';
