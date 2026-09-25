-- Buyurtmaga MIQDOR va tavsifning ixtiyoriy boʻlishi.
--
-- Miqdor: bitta ishning bir nechtasi boʻlishi mumkin — masalan ikkita
-- quvurni tozalash. Narx shu songa koʻpaytiriladi va odatdagidek
-- MUZLATILADI, shuning uchun katalog narxi keyin oʻzgarsa ham chek
-- oʻzgarmaydi. Eski buyurtmalar uchun 1 — ularning narxi oʻzgarmaydi.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;

-- Tavsif: buyurtma oqimidan «muammoni tavsiflab bering» qadami olib
-- tashlandi — xizmat nomi va manzil yetarli, ortiqcha qadam esa
-- buyurtma berishni sekinlashtirardi.
--
-- Ustun NOT NULL boʻlib QOLADI, faqat DEFAULT qoʻshiladi: `null` qilinsa,
-- uni oʻqiydigan har bir joy (usta ekrani, admin, chek) yangi holatni
-- hisobga olishi kerak boʻlardi. Boʻsh satr esa hech narsani buzmaydi.
ALTER TABLE "orders" ALTER COLUMN "description" SET DEFAULT '';
