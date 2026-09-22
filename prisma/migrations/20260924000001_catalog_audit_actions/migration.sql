-- Katalog va usta xizmatlari boʻyicha audit harakatlari.
--
-- Alohida migratsiya: oldingisi allaqachon qoʻllangan edi va unga qoʻshish
-- hech narsa qilmasdi.
ALTER TYPE "AuditAction" ADD VALUE 'CATALOG_CATEGORY_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CATALOG_CATEGORY_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'CATALOG_PRICE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'MASTER_SERVICES_CHANGED';
