# Hizmat24 — Santexnika · Namangan: yoʻnalish oʻzgarishi (TZ)

Holat: 2026-09-22. Egasining koʻrsatmasi asosida tuzildi. **Tasdiqlanmaguncha ish boshlanmaydi.**

---

## 1. Men tushunganim (qisqacha)

| Hozir | Boʻlishi kerak |
|---|---|
| Platforma umumiy («santexnik/elektrik…»), usta kasbini oʻzi yozadi | Faqat **santexnika**. Kasb soʻralmaydi — hamma usta santexnik |
| Usta roʻyxatdan oʻtishda 6–7 savol (kasb, tajriba, sertifikat, oʻzim haqimda, tumanlar, ish vaqti) | **Minimal**: ism + qaysi ishlarni qiladi (roʻyxatdan yoqib/oʻchirib). Qolgani keyin, xohlasa |
| Xizmat = nom + narx + ikonka; rasm ilova ichiga tikilgan | Xizmat = **toʻliq karta** (Urban Company kabi): nomi, batafsil tavsif, narx, **narx ichiga nimalar kiradi**, taxminiy vaqt, **rasm va videolar** — hammasi **admin paneldan** kiritiladi va oʻzgartiriladi |
| Katalog seedʼdan keladi, panel faqat oʻqiydi | Egasi katalogni **paneldan oʻzi** yaratadi va narxlaydi |
| Usta xizmatlarini faqat ariza berganda soʻraydi, keyin oʻzgartira olmaydi | Usta **istalgan vaqtda** profilidan xizmatlarni yoqib/oʻchiradi; buyurtmalar shunga qarab keladi |
| Shahar tushunchasi yoʻq; tumanlar matn | **Faqat Namangan** shahri, belgilangan chegara ichida. Keyinchalik kengaytiriladi |

Yaʼni tizim «ustaning kasbi» emas, **«katalogdagi aniq ish»** atrofida quriladi: egasi ishlarni belgilaydi, usta ulardan oʻziga mosini yoqadi, mijoz aniq ishni tanlaydi, buyurtma shu ishni yoqqan ustaga tushadi.

---

## 2. Nima OʻZGARMAYDI

- Kirish (SMS/OTP), buyurtma yaratish → usta tayinlash → tasdiqlash → yakunlash → baholash zanjiri.
- Admin paneli asosi (kirish, rollar, arizalar boʻlimi).
- Narx serverda hisoblanadi; shoshilinch yigʻim, daraja chegirmasi — qoladi.
- Halollik qoidalari: soxta maʼlumot yoʻq, ishlamaydigan tugma yoʻq, «tekshirilmagan» belgisi.

---

## 3. Bosqichlar

### P1 — Xizmat kartasi va katalog boshqaruvi (server + panel + ilova) ✅ BAJARILDI

> Jonli serverda tekshirildi: paneldan xizmat yaratildi, rasm yuklandi
> (webp ga qayta kodlandi), ilovada karta toʻliq koʻrindi.
>
> Yoʻl-yoʻlakay uchta nuqson tuzatildi:
> - `/service-groups` yangi maydonlarni qaytarmasdi (ilova aynan shundan oʻqiydi)
> - katalog `PATCH` toʻliq almashtirish kabi ishlab, yuborilmagan guruhni
>   nolga tushirardi va xizmat mijoz katalogidan yoʻqolardi
> - media papkasining egasi konteyner foydalanuvchisiga mos kelmasdi (EACCES)

**Maqsad:** egasi paneldan toʻliq xizmat kartasini yaratadi; mijoz ilovada uni koʻradi.

**Server:**
- `service_categories` ga yangi ustunlar (faqat qoʻshimcha): `summary` (bir qatorli), `description` (batafsil, bir necha xatboshi), `includes` (roʻyxat: narx ichiga nimalar kiradi), `excludes` (ixtiyoriy: nimalar kirmaydi), `duration_minutes` (taxminiy vaqt), `price_kind` (`fixed` | `from` — «… soʻmdan» boshlab).
- Yangi jadval `service_media`: `category_id`, `kind` (`image` | `video`), `url`, `sort_order`, `is_cover`. Fayllar serverda `/var/www/hizmat24/media/` da, nginx orqali `https://hizmat24.uz/media/...` deb beriladi.
- Yuklash: `POST /admin/catalog/media` (multipart). Rasm — jpg/png/webp, ≤ 5 MB, server oʻzi 1600px gacha kichraytiradi va webp qiladi. Video — mp4, ≤ 60 MB, 90 soniyagacha. Cheklovlar oshsa aniq oʻzbekcha xato.
- CRUD: `POST/PATCH /admin/catalog/groups`, `POST/PATCH /admin/catalog/categories`, faollashtirish/oʻchirish, tartib. Narx oʻzgarganda audit yozuvi (kim, qachon, eski → yangi).
- Mijoz endpointlari (`/service-categories`, `/service-groups`) yangi maydonlar va mediani qaytaradi. Kesh oʻzgarishda tozalanadi (allaqachon bor).

**Panel (A6 shu yerga qoʻshiladi):**
- Katalog boʻlimi: guruhlar va xizmatlar roʻyxati, yaratish/tahrirlash shakli.
- Shakl: nom, qisqa izoh, batafsil tavsif, narx + turi, vaqt, «Narx ichiga kiradi» roʻyxat muharriri (qator qoʻshish/oʻchirish), «Kirmaydi» roʻyxati, media: muqova rasmi + galereya (drag-drop, tartib), video.
- Faol/oʻchirilgan; oʻchirilgan xizmat ilovada koʻrinmaydi, lekin eski buyurtmalarda nomi qoladi.

**Ilova:**
- Xizmat sahifasi (yangi ekran): muqova rasm/galereya (video ham), nom, narx, vaqt, tavsif, «Narx ichiga kiradi» / «Kirmaydi», «Buyurtma berish» tugmasi.
- Bosh sahifa va katalog kartalarida rasm **serverdan** (ilovaga tikilgan `SERVICE_IMAGES` olib tashlanadi; rasm boʻlmasa ikonka).
- Buyurtma tasdiqlash ekranida xizmat kartasining qisqa koʻrinishi.

**Qabul:** egasi paneldan yangi xizmatni rasm va video bilan yaratadi → 1 daqiqa ichida ilovada koʻrinadi va unga buyurtma berish mumkin; narxni oʻzgartirsa yangi buyurtmalar yangi narxda, eskilari eskisida.

---

### P2 — Usta rejimini soddalashtirish (ilova + server + panel) — ✅ BAJARILDI

> Bajarildi: `is_enabled`, `GET/PUT /master/me/services`, matching filtri,
> ilovada «Mening xizmatlarim» ekrani (profildan ochiladi).
>
> Bajarildi (2026-09-22): ariza BITTA ekranga tushdi — faqat ism, xizmatlar
> (hammasi yoqilgan holda ochiladi) va ixtiyoriy tanishtiruv. Kasb, tajriba,
> sertifikat, tumanlar va ish vaqti savollari olib tashlandi; besh qadamli
> sozlash oqimi bitta ixtiyoriy maydonga aylandi; smenani ochish uchun
> «profil toʻliq» qorovuli olib tashlandi (majburiy savol qolmadi).
>
> Bazada ustunlar QOLDI, lekin `NULL` qabul qiladi
> (`20260925000000_master_application_optional_fields`): eski arizalardagi
> haqiqiy javoblar oʻqilaveradi, yangilarida esa panel «soʻralmagan» deb
> koʻrsatadi — «yoʻq» deb yozish toʻqilgan maʼlumot boʻlardi.
>
> Jonli tekshirildi: minimal ariza → panelda `null` maydonlar → tasdiqlash →
> 3 ta xizmati yoqilgan faol usta. Sinov maʼlumotlari oʻchirildi.

**Maqsad:** usta 1 daqiqada ishga tayyor boʻladi; qaysi ishlarni qilishini oʻzi boshqaradi.

**Ilova — roʻyxatdan oʻtish (3 qadam oʻrniga 1 ekran):**
- Ism (hisobdan olinadi, tahrirlash mumkin).
- **Xizmatlar roʻyxati** — katalogdagi barcha faol ishlar, har birida yoqish/oʻchirish. Standart holat: **hammasi yoqilgan**, usta qila olmaganini oʻchiradi (egasining soʻzi boʻyicha). Kamida bittasi yoqiq boʻlishi shart.
- «Oʻzim haqimda» — ixtiyoriy, keyin ham yozish mumkin.
- OLIB TASHLANADI: kasb, tajriba darajasi, sertifikat savoli, tumanlar, ish vaqti. (Ish vaqti oʻrniga mavjud «smena ochiq/yopiq» tugmasi yetadi.)
- Ariza serverga shu maʼlumot bilan ketadi (A2 endpointi moslanadi).

**Ilova — profil:**
- «Mening xizmatlarim» boʻlimi: oʻsha roʻyxat, istalgan vaqt yoqib/oʻchirish. Oʻzgarish darhol serverga yoziladi va tasdiq xabari chiqadi.
- Katalogga yangi xizmat qoʻshilsa ustada u **oʻchiq** holda paydo boʻladi va ilovada «Yangi xizmat: … — yoqasizmi?» deb koʻrsatiladi (ustaning roziligisiz avtomatik yoqilmaydi).

**Server:**
- `master_service_categories` ga `is_enabled` (standart `true`) — yozuv oʻchirilmaydi, faqat oʻchiriladi; tarix saqlanadi.
- `GET/PUT /master/me/services` (B4 ning usta hisobi qismi shu yerda bajariladi: `masters.user_id` orqali).
- Matching: usta faqat **yoqilgan** xizmatlar boʻyicha taklif oladi.
- Ariza modeli: `profession`, `experience_level`, `districts`, `work_from/to` ixtiyoriy boʻladi (ustunlar qoladi — eski maʼlumot buzilmaydi).

**Panel:**
- Ariza kartasi soddalashadi: ism, telefon, tanlagan xizmatlar, «oʻzim haqimda». Tasdiqlashda xizmatlar oldindan belgilangan.
- Foydalanuvchilar boʻlimida (A5 ning bir qismi): ustaning yoqilgan xizmatlarini koʻrish.

**Qabul:** yangi usta ilovada bir ekranni toʻldirib ariza beradi; tasdiqlangach uning oʻchirgan xizmati boʻyicha buyurtma unga TUSHMAYDI, yoqqani boʻyicha tushadi; profildan bittasini oʻchirsa keyingi buyurtma boshqa ustaga ketadi.

---

### P3 — Faqat Namangan — ✅ BAJARILDI

> Bajarildi (2026-09-22): `service_areas` jadvali (Namangan, 40.9983 /
> 71.6726, 12 km), buyurtma yaratishda hudud tekshiruvi, paneldagi
> «Sozlamalar» boʻlimi (faqat SUPERADMIN, oʻzgarish auditga yoziladi),
> ilovada shahar qulflangan manzil maydoni va bosh sahifadagi belgi.
>
> Qoida: koordinata bor boʻlsa faqat U hisobga olinadi (matn aldashi
> mumkin — «Namangan koʻchasi, Toshkent»); koordinatasiz manzil shahar
> nomi boʻyicha tekshiriladi.
>
> Jonli tekshirildi: Toshkent manzili, Toshkent koordinatasi va Namangan
> chekkasidan tashqarisi rad etildi; Namangan ichidagi ikki manzil qabul
> qilindi. Paneldan radius 40 km qilinganda oʻzgarish darhol kuchga kirdi
> (kesh yoʻq), audit yozuvida oldingi va yangi qiymat koʻrindi.
>
> Qoldi: usta qidiruvini hudud boʻyicha cheklash — ustalarda koordinata
> YOʻQ (xarita K1 bosqichida). Hozir manzil chegara ichida boʻlgani
> yetarli.

**Maqsad:** platforma faqat Namangan shahrida, belgilangan chegara ichida ishlaydi.

**Server:**
- Xizmat hududi sozlamasi: markaz koordinatasi + radius (km). Boshlangʻich qiymat: Namangan markazi, radius **12 km** (tasdiqlashingiz kerak). Keyinchalik kengaytirish uchun paneldan oʻzgartiriladigan `settings` jadvali.
- Buyurtma yaratishda: manzilda koordinata boʻlsa hudud ichidami tekshiriladi; boʻlmasa (xarita hali yoʻq — K1) shahar matn boʻyicha «Namangan» boʻlishi shart. Hududdan tashqarida — aniq xabar: «Hozircha faqat Namangan shahrida xizmat koʻrsatamiz».
- Usta qidiruvi hudud ichidagi ustalar bilan.

**Ilova:**
- Manzil qadamida shahar **Namangan** deb qattiq turadi (tanlanmaydi), koʻcha/uy yoziladi. Tanishtiruv va bosh sahifada «Namangan shahri» belgisi.
- Usta roʻyxatdan oʻtishda shahar soʻralmaydi.

**Panel:** Sozlamalar sahifasi — hudud (markaz, radius), platforma nomi/shahri. Keyinchalik shu yerdan ikkinchi shahar qoʻshiladi.

**Qabul:** Namangandan tashqari manzil bilan buyurtma berilmaydi va sabab aytiladi; Namangan ichida beriladi.

---

### P4 — Ilova matnlari va bosh sahifa

- Bosh sahifa: guruh chiplari oʻrniga toʻgʻridan-toʻgʻri santexnika ishlari (rasmli kartalar, P1 dan).
- Barcha «santexnik/elektrik», «soha», «kasb» soʻzlari olib tashlanadi; tanishtiruv slaydlari santexnikaga moslanadi.
- Mijoz ekranidagi usta kartasi: «Santexnik · N ta ish bajargan · baho».

---

## 4. Tartib va bogʻliqlik

1. **P1** (katalog kartasi + media + panel CRUD) — asos; boshqalari unga tayanadi.
2. **P2** (usta soddalashtirish + xizmatlarni yoqish/oʻchirish) — P1 dagi roʻyxat kerak.
3. **P3** (Namangan) — mustaqil, P1 dan keyin istalgan vaqt.
4. **P4** (matnlar) — P1–P2 bilan birga yoʻl-yoʻlakay.

Eski rejadan: **A6** P1 ichiga kiradi; **B4** ning usta hisobi qismi P2 ichida bajariladi; **A5** (foydalanuvchilar) va **K1** (xarita) oʻz oʻrnida qoladi. Har bosqich oxirida server yangilanadi va APK yigʻiladi.

---

## 5. Sizdan tasdiq kerak boʻlgan qarorlar

1. **Standart holat:** yangi ustada barcha xizmatlar **yoqilgan** (u kerak emasini oʻchiradi) — toʻgʻrimi? Yoki hammasi oʻchiq, usta kerakini yoqadi?
2. **Narx turi:** har bir ish uchun qatʼiy narxmi («85 000 soʻm»), yoki «… dan» ham boʻladimi? Ikkalasini ham qoʻllash taklif qilinadi.
3. **Video:** ≤ 60 MB, ≤ 90 soniya, mp4 — yetadimi? Katta videolar uchun YouTube havolasi ham qabul qilaylikmi?
4. **Namangan chegarasi:** markazdan 12 km radius — maʼqulmi? Aniq mahallalar roʻyxati kerakmi?
5. **Sertifikat savoli:** butunlay olib tashlaymizmi, yoki profilda ixtiyoriy qoldiramizmi?
6. **Tajriba darajasi** (yangi/tajribali): ilgari ustaning murakkab ishlarga ruxsati shunga bogʻliq edi. Endi usta xizmatni oʻzi yoqadi — daraja kerak emas deb hisoblayman. Rozimisiz?
