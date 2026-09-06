-- Audit log — append-only (TZ 6.4, 9.7).
-- UPDATE va DELETE DB darajasida bloklanadi: ilova kodidagi xato yoki
-- to'g'ridan-to'g'ri SQL orqali ham yozuvlarni o'zgartirib bo'lmaydi.

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs jadvali append-only: % amali taqiqlanadi', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- Buyurtma holatlari tarixi ham o'zgartirilmaydi.
CREATE TRIGGER order_status_history_no_update
  BEFORE UPDATE ON "order_status_history"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- DELETE bloklanmaydi: buyurtma o'chirilganda cascade ishlashi kerak.
-- (TRUNCATE ham row-level triggerlarni ishga tushirmaydi — test tozalash uchun muhim.)
