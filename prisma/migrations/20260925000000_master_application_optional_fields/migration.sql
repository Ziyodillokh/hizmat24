-- Usta arizasida faqat ISM va XIZMATLAR majburiy boʻlib qoldi.
--
-- Platforma faqat santexnikaga xizmat qiladi: kasbni soʻrash maʼnosiz,
-- tajriba va sertifikatni hech kim tekshirmaydi, tuman va ish vaqtining
-- oʻrnini smena tugmasi bosadi. Ustunlar OʻCHIRILMAYDI — eski arizalar
-- toʻliq oʻqilaveradi; faqat NOT NULL cheklovi olib tashlanadi, shunda
-- «soʻralmagan» degan javobni «NEW» degan yolgʻondan farqlash mumkin.
ALTER TABLE "master_applications" ALTER COLUMN "profession" DROP NOT NULL;
ALTER TABLE "master_applications" ALTER COLUMN "experience_level" DROP NOT NULL;
ALTER TABLE "master_applications" ALTER COLUMN "claims_certificate" DROP NOT NULL;
ALTER TABLE "master_applications" ALTER COLUMN "claims_certificate" DROP DEFAULT;
ALTER TABLE "master_applications" ALTER COLUMN "about" DROP NOT NULL;
ALTER TABLE "master_applications" ALTER COLUMN "work_from" DROP NOT NULL;
ALTER TABLE "master_applications" ALTER COLUMN "work_to" DROP NOT NULL;
