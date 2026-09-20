-- Baho teglari ("Vaqtida keldi", "Toza ishladi" …).
--
-- Ilova ularni baholash ekranida yigʻadi va chekda koʻrsatadi; serverda
-- ustun boʻlmagani uchun ular yoʻqolardi. Boʻsh massiv — tegsiz baho.
ALTER TABLE "ratings" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
