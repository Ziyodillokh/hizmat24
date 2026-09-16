# Hizmat24 — ilovani backendga ulash TZ

Ilova hozir butunlay `localStorage` da yashaydi: buyurtma ham, usta ham, pul ham shu telefonda.
Backend esa allaqachon bor (`apps/client-api` — NestJS 11 + Prisma + PostgreSQL 16 + Redis + BullMQ),
lekin ilovaga hech qachon ulanmagan va u faqat MIJOZ tomonini biladi.
Bu hujjat ikkalasini bir-biriga ulaydigan bosqichlarni belgilaydi: har bir bosqich oxirida
ishlaydigan APK boʻladi va hech bir bosqich ekranda yolgʻon qoldirmaydi.

Asosiy qoida oʻzgarmaydi: **ishlamaydigan narsa ekranda ishlayotgandek koʻrinmaydi.**
Server ulangan sari «Tez orada» chiplari birma-bir olib tashlanadi — bittasi ham oldindan emas.

---

## 0. Qarorlar

### 0.1 Backend — mavjud `apps/client-api`, Supabase EMAS

Repoda 4 448 qator server kodi, 45 ta test fayli, 3 ta migratsiya va ishlaydigan
Eskiz.uz SMS integratsiyasi bor. Supabaseʼga oʻtish auth, OTP, matching navbati va
oʻchirib boʻlmaydigan audit logni noldan yozish demakdir — hech qanday yutuq yoʻq.

### 0.2 Birinchi navbat — haqiqiy foydalanuvchi va buyurtma

Ikki telefon bir-birini koʻrishi kerak: mijoz buyurtma beradi, usta uni oʻz telefonida
koʻradi va qabul qiladi. Toʻlov (Click/Payme) va admin panel keyingi navbatda.

### 0.3 Ulash yoʻli — bosqichma-bosqich, bayroq bilan

Ilovada bitta seam: `src/api/*`. Har bir ekran hozirgidek `useApp()` / `useMaster()` bilan
ishlaydi; oʻzgarish faqat provayderlar ichida boʻladi. `VITE_API_URL` boʻsh boʻlsa ilova
mock rejimda ishlaydi (hozirgidek), toʻldirilsa serverga boradi. Shu sababli har bir
bosqichni telefonda sinab koʻrish mumkin va orqaga qaytarish bitta oʻzgaruvchi.

> Bayroq VAQTINCHA. B7 oxirida mock yoʻl butunlay oʻchiriladi — ikki haqiqat manbai
> uzoq yashasa, ular albatta bir-biridan uzoqlashadi.

### 0.4 Serverdagi katta yetishmovchiliklar (bu TZ ularni yopadi)

| Yetishmayapti | Nima uchun muhim | Qaysi bosqich |
|---|---|---|
| Ustaning hisobi yoʻq (`Master` va `User` bogʻlanmagan, usta kira olmaydi) | Usta ilovasi umuman ulanmaydi | B4 |
| Usta amallari endpointlari (qabul, yoʻlga chiqish, yetib kelish, yakunlash) | M2–M4 ekranlari server bilan gaplashmaydi | B5 |
| `Order.paymentMethod` maydoni yoʻq | Ilova naqd/karta tanlaydi, server buni saqlamaydi | B3 |
| `Order.workNote` yoʻq | Ustaning izohi mijozga yetib bormaydi | B5 |
| `addressLat/addressLng` NOT NULL | Ilovada xarita yoʻq, koordinata ham yoʻq | B3 |
| Narx tafsiloti (`base`, `urgentFee`, `discount`) yoʻq — faqat `price` | Chek va hamyon shu tafsilotdan quriladi | B3 |
| Usta profili maydonlari (tumanlar, ish vaqti, «oʻzim haqimda») yoʻq | Usta profili saqlanmaydi | B4 |
| Daraja/chegirma/keshbek modeli yoʻq | Hozir ilovada hisoblanadi, serverda izi yoʻq | B6 |

### 0.5 Ataylab KEYINGA qoldiriladi

Toʻlov tizimi (Click/Payme), ustaning ish fotosi, push bildirishnoma, admin panel UI, chat.
Ularning har biri `/app/master/limits` roʻyxatida turibdi va u yerdan faqat HAQIQATAN
ishlaganda olib tashlanadi.

**Xarita va jonli kuzatuv** alohida hujjatda: [xarita-va-kuzatuv-tz.md](xarita-va-kuzatuv-tz.md).
Uning bosqichlari shu yerdagilarga bogʻlangan: K1 (manzil koordinatasi) — B3 bilan birga,
K2 (ustaning joylashuvi) — B5 dan keyin, K3 (jonli xarita) — K2 dan keyin.

---

## 1. Arxitektura

### 1.1 Ilova tomoni (`apps/client-app`)

```
src/api/
  client.ts        fetch oʻramchisi: base URL, JWT, 401 → refresh, xato → AppError
  auth.ts          requestOtp, verifyOtp, refresh, logout
  catalog.ts       serviceGroups, serviceCategories
  orders.ts        create, list, byId, cancel, confirmMaster, rate
  master.ts        profile, availability, offers, accept, depart, arrive, finish
  realtime.ts      WebSocket ulanishi, qayta ulanish, hodisa → store
  dto.ts           server DTO → LiveOrder (va teskarisi) — SOF funksiyalar + testlar
```

Qoidalar:
- `src/api` dan tashqarida birorta `fetch` boʻlmaydi.
- DTO oʻgirish sof funksiyalar; ular `src/lib` dagi kabi vitest bilan qoplanadi.
  Serverdagi maydon nomi oʻzgarsa, bitta fayl va bitta test yiqiladi.
- Ekranlar hech narsa bilmaydi: ular hozirgidek `useApp()` ga qaraydi.

### 1.2 Holat manbai

| Maʼlumot | Hozir | Ulangandan keyin |
|---|---|---|
| Sessiya (telefon, ism, rol) | `hizmat24:session:v1` | JWT + `/auth/me`; localStorage faqat token va rol keshiga |
| Buyurtmalar | localStorage massivi | Server; WS orqali jonli yangilanadi; localStorage — oxirgi koʻrilgan holat keshi |
| Katalog | `src/mocks/serviceGroups.ts` | `GET /service-groups`, `GET /service-categories` + 1 soatlik kesh |
| Ustalar roʻyxati | `src/mocks/masters.ts` | Serverdan (faqat buyurtmaga tayinlangan usta) |
| Usta profili | `hizmat24:master:v1` | Server; qurilmada faqat kesh |
| Manzillar, sevimlilar, mavzu | localStorage | **Oʻzgarmaydi** — bular qurilma sozlamasi |
| Daraja/keshbek | ilovada hisoblanadi | B6 da serverga koʻchadi |

### 1.3 Simulyatsiya oʻchadi

`src/lib/orderSimulation.ts` — taymer bilan «usta topildi → yoʻlga chiqdi» taqlidi.
Server ulanganda u **butunlay oʻchadi**: holatni faqat server oʻzgartiradi.
`simulationStep()` allaqachon bitta qorovul — bosqich B3 da unga uchinchi shart qoʻshiladi
(`apiEnabled` → doim `null`), B7 da esa fayl va u bilan birga `DemoAction` tugmalari oʻchiriladi.

---

## 2. Maʼlumot modeli — kelishilishi kerak boʻlgan farqlar

| Mavzu | Ilova | Server | Qaror |
|---|---|---|---|
| Holatlar | 10 ta | 12 ta (`DRAFT`, `RATED` qoʻshimcha) | `DRAFT` ishlatilmaydi (qoralama faqat ilovada); `RATED` → ilovada `CLOSED` deb koʻrsatiladi, oʻgirish `dto.ts` da |
| Narx | `invoice {base, urgentFee, discountPercent, discount, total}` | `price: Int` | Serverga toʻrtta ustun qoʻshiladi (B3); `total` — yagona haqiqat |
| Toʻlov usuli | `paymentMethod` | yoʻq | `payment_method` ustuni qoʻshiladi (B3) |
| Manzil | `{label, entrance, floor, apartment}` | `clientAddress Json` + `lat/lng` NOT NULL | `lat/lng` **nullable** qilinadi (B3); koordinata K1 da xaritadan tanlanadi — soxta koordinata hech qachon yozilmaydi |
| Ish izohi | `workNote` | yoʻq | `work_note VarChar(300)` (B5) |
| Usta | mock roʻyxat | `Master` jadvali | Usta `User` bilan bogʻlanadi: `masters.user_id` (B4) |
| Usta profili | tumanlar, ish vaqti, «oʻzim haqimda», sertifikat daʼvosi | yoʻq | `master_profiles` jadvali (B4) |
| Reyting | 1–5 + teglar + izoh | `Rating` jadvali bor | Oʻzgarmaydi |

---

## 3. Bosqichlar

Har bir bosqich oxirida: `npm run typecheck && npm run lint && npm test && npm run build`
ikkala ilovada ham yashil; APK `~/Desktop/hizmat24-<nom>.apk`; telefonda qoʻlda tekshirish.

---

### B1 — Server koʻtariladi va ilova uni koʻradi

**Maqsad:** `docker compose up` bilan Postgres + Redis + API ishlaydi; ilova serverga ulana oladi.

- `.env` toʻldiriladi (JWT sirlari, `OTP_HASH_SECRET`, `SMS_PROVIDER=console` — sinov uchun).
- `npx prisma migrate deploy && npm run seed` — katalog va sinov ustalari.
- Ilovada: `src/api/client.ts` (base URL, xato modeli, 8 soniyalik timeout), `VITE_API_URL`,
  `src/api/health.ts` va Profil ekranining pastida kichik qator: «Server: ulangan / ulanmagan».
- Android uchun: emulyator `10.0.2.2`, haqiqiy telefon uchun LAN IP; `CORS_ORIGINS` ga
  `capacitor://localhost` va `http://localhost` qoʻshiladi.

**Qabul:** telefondagi APK Profil ekranida «Server: ulangan» deb koʻrsatadi; `VITE_API_URL`
boʻsh boʻlsa hammasi hozirgidek ishlaydi.
**APK:** `hizmat24-api-1-ulanish.apk`

---

### B2 — Haqiqiy kirish (SMS OTP)

**Maqsad:** telefon raqami bilan haqiqiy kirish; JWT saqlanadi va yangilanadi.

- Server: `SMS_PROVIDER=eskiz`, Eskiz kabineti (shablon tasdiqlash 1–3 kun oladi — oldindan boshlanadi).
- Ilova: `src/api/auth.ts`; `LoginScreen`/`OtpScreen` serverga boradi; xato holatlari
  (notoʻgʻri kod, muddati tugagan, 3 marta urinish, cooldown) ekranda oʻzbekcha aytiladi.
- Token saqlash: `access` xotirada, `refresh` `localStorage` da (`hizmat24:auth:v1`).
  401 → bitta marta refresh, keyin chiqish.
- `signOut` serverdagi `logout` ni ham chaqiradi.
- Ism: `PATCH /users/me` (yangi, kichik endpoint) — hozir ism faqat qurilmada.

**Qabul:** ikkita HAR XIL telefondan ikki xil raqam bilan kirish; ilovani oʻchirib qayta
oʻrnatganda sessiya saqlanmaydi (bu toʻgʻri), lekin qayta kirish ishlaydi.
**APK:** `hizmat24-api-2-kirish.apk`

---

### B3 — Katalog va buyurtma serverda

**Maqsad:** buyurtma serverga tushadi, mijoz uni serverdan koʻradi; taymer oʻchadi.

**Server (migratsiya):**
- `orders`: `payment_method`, `price_base`, `price_urgent_fee`, `discount_percent`, `discount_amount` ustunlari; `address_lat/lng` → nullable.
- `POST /orders` DTO shu maydonlarni qabul qiladi; `idempotencyKey` ilovadan yuboriladi (qayta bosishdan himoya).

**Ilova:**
- `src/api/catalog.ts` + kesh; `src/mocks/serviceGroups.ts` faqat zaxira sifatida qoladi.
- `createOrder` → `POST /orders`; roʻyxat va tafsilot serverdan; `cancelOrder`, `confirmMaster`,
  `rateOrder` → mos endpointlar.
- `src/api/realtime.ts`: WS ulanishi, `order.status_changed` hodisasi → storeʼdagi buyurtma yangilanadi.
- `simulationStep()` ga `apiEnabled` sharti: server ulangan boʻlsa hech qachon qadam qaytarmaydi.
- Mijoz ekranidagi «Demo ·» tugmalari server rejimida chizilmaydi (qorovul allaqachon bor).

**Qabul:** ilova oʻchirilib qayta ochilganda buyurtma yoʻqolmaydi (u serverda); ikkinchi
telefondan oʻsha akkaunt bilan kirilsa oʻsha buyurtma koʻrinadi; internetsiz holatda ekran
«Ulanish yoʻq» deb aytadi va soxta maʼlumot chizmaydi.
**APK:** `hizmat24-api-3-buyurtma.apk`

---

### B4 — Usta hisobi va profili

**Maqsad:** usta oʻz telefonidan kira oladi va profili serverda yashaydi.

**Server:**
- `masters.user_id` (unique, nullable) — usta ham `User`, ham `Master`.
- `master_profiles`: `about`, `districts text[]`, `work_from`, `work_to`, `claims_certificate`,
  `available_since`.
- `POST /auth/verify-otp` javobiga `roles: ["client"] | ["client","master"]`.
- Yangi: `GET /master/me`, `PATCH /master/me` (profil), `POST /master/availability` (smena).
- Ariza: `POST /master/applications` — usta arizasi serverga tushadi (hozir u Telegramga qoʻlda yuboriladi).
  Tekshiruvni admin bajaradi; holat `PENDING | APPROVED | REJECTED`.

**Ilova:**
- `MasterProvider` serverdan oʻqiydi; `hizmat24:master:v1` — kesh.
- `MasterApply` ekrani: matn tayyorlash oʻrniga haqiqiy yuborish; «Telegram ochildi» oʻrniga
  «Ariza yuborildi · koʻrib chiqilmoqda» — **faqat shu bosqichdan keyin**.
- Rejim tanlash: `roles` da `master` boʻlmasa, usta rejimi «Ariza bering» ekraniga olib boradi.

**Qabul:** bitta telefonda ariza beriladi, admin (hozircha `psql` orqali) tasdiqlaydi, usta
rejimi ochiladi; profil boshqa qurilmada ham koʻrinadi.
**APK:** `hizmat24-api-4-usta-hisobi.apk`

---

### B5 — Usta ishlaydi: takliflar va amallar

**Maqsad:** ikki telefon bir-birini koʻradi. Mijoz buyurtma beradi — usta qabul qiladi.

**Server (yangi `master-orders` moduli):**
- `GET /master/offers` — ustaga taklif qilingan buyurtmalar (matching allaqachon tanlaydi;
  endi u ustaga **push** emas, **pull** qilib ham beriladi).
- `POST /master/orders/:id/accept` — `ASSIGNED`; `SELECT … FOR UPDATE SKIP LOCKED` bilan
  poyga yopiladi: ikkinchi usta «Buyurtma allaqachon olingan» xatosini oladi.
- `POST /master/orders/:id/depart` (`eta_minutes`), `/arrive`, `/finish` (`work_note`), `/cancel` (`reason`).
- Hammasi `OrderEntity.transitionTo()` orqali — holat mashinasi bitta joyda qoladi.
- `orders.work_note` ustuni.
- WS: ustaga `offer.created`, mijozga `order.status_changed`.

**Ilova:**
- `src/api/master.ts`; `masterAcceptOrder`/`masterDepart`/`masterArrive`/`masterFinish`/
  `masterCancelOrder` serverga boradi.
- Xato holatlari ekranda: «Bu buyurtmani boshqa usta oldi», «Smena yopiq», «Profil tasdiqlanmagan».
- `createDemoOrder()` server rejimida chizilmaydi (u lokal dunyo uchun edi).
- «Bitta qurilma, bitta dunyo» matnlari olib tashlanadi — endi ular yolgʻon.

**Qabul (asosiy sinov):** ikkita telefon. Birinchisida mijoz buyurtma beradi, ikkinchisida
usta uni koʻradi, qabul qiladi, yoʻlga chiqadi, yetib keladi; mijoz tasdiqlaydi; usta
yakunlaydi; mijoz baholaydi. Ikkala ekranda ham holat 2 soniyadan kam vaqtda yangilanadi.
**APK:** `hizmat24-api-5-ikki-telefon.apk`

---

### B6 — Pul, tarix, daromad

**Maqsad:** raqamlar serverdan keladi va ikkala tomonda bir xil boʻladi.

- `GET /orders/history`, `GET /master/orders` — sahifalangan tarix.
- `GET /master/earnings?from=&to=` — server hisoblaydi (ilovadagi `masterEarnings.ts`
  formulalari serverga koʻchadi, ilovada faqat koʻrsatish qoladi).
- Daraja va chegirma: `user_levels` (bronza/kumush/oltin, bajarilgan buyurtma soni boʻyicha).
  Chegirma buyurtma yaratilayotganda **server** tomonidan qoʻllanadi — hozir uni ilova hisoblaydi.
- Keshbek: hozircha yoʻq. «Demo · keshbek» chipi qoladi yoki blok butunlay olib tashlanadi.
- Komissiya: `masters.commission_percent` (default `null`). Raqam belgilanmaguncha
  Daromad ekranidagi matn oʻzgarmaydi.

**Qabul:** usta ikki ish yakunlaydi — Daromaddagi summa `SELECT sum(price)` bilan bir xil;
mijozning chegirmasi serverdan kelgan darajaga mos.
**APK:** `hizmat24-api-6-daromad.apk`

---

### B7 — Mockni oʻchirish va ishonchlilik

**Maqsad:** ikki haqiqat manbai qolmasin.

- `VITE_API_URL` majburiy boʻladi; mock yoʻl, `orderSimulation.ts`, `DemoAction`,
  `createDemoOrder`, `src/mocks/orders.ts`, `src/mocks/masters.ts` oʻchiriladi.
- Oflayn: ulanish yoʻqolganda ekran «Ulanish yoʻq — qayta urinish» deb aytadi; keshdagi
  buyurtma «oxirgi koʻrilgan holat» belgisi bilan koʻrsatiladi.
- Qayta urinish siyosati: GET — 3 marta eksponensial, POST — hech qachon avtomatik emas
  (idempotency kaliti bor amallardan tashqari).
- Xato loglari: Sentry yoki oddiy `POST /client-errors`.
- `/app/master/limits` roʻyxati qayta koʻrib chiqiladi: ishga tushganlari olib tashlanadi.

**Qabul:** internetni oʻchirib ilova ochilganda hech qanday soxta raqam koʻrinmaydi;
`npm run test:e2e` (Testcontainers) yashil.
**APK:** `hizmat24-api-7-relizga-tayyor.apk`

---

### B8 — Admin va toʻlov (keyingi toʻlqin)

Admin panel (ariza tekshiruvi, ustalarni bloklash, buyurtma eskalatsiyasi), Click/Payme,
push bildirishnoma (FCM — `DeviceToken` jadvali allaqachon bor), ish fotosi uchun S3.
Bu bosqich alohida TZ talab qiladi.

---

## 4. Xavfsizlik va halollik qoidalari

1. **Serverga ishonch — bir tomonlama.** Narx, chegirma, holat oʻtishi va usta tayinlash
   faqat serverda hal qilinadi. Ilova yuborgan `price` hech qachon ishlatilmaydi.
2. **Ustaning telefon raqami** faqat `ASSIGNED…IN_PROGRESS` oraligʻida qaytariladi
   (server allaqachon shunday qiladi) — mijoz ilovasi buni aylanib oʻtmaydi.
3. **Token** `localStorage` da: XSS xavfi Capacitor WebViewʼda cheklangan, lekin
   `refresh` tokeni har ishlatilganda almashtiriladi (server allaqachon shunday qiladi).
4. **Idempotentlik**: buyurtma yaratish va usta amallari kalit bilan yuboriladi — ikki marta
   bosilgan tugma ikkita buyurtma yaratmaydi.
5. **Soxta maʼlumot taqiqi kuchda qoladi.** Server javob bermasa — «Ulanish yoʻq», keshdan
   koʻrsatilsa — «oxirgi koʻrilgan holat». Hech qachon boʻsh nol yoki taxminiy raqam emas.
6. **Matnlar bosqich bilan birga oʻzgaradi.** «Server ulanmagan», «Bitta qurilma, bitta dunyo»,
   «Telegram ochildi» — har biri oʻz bosqichida olib tashlanadi, oldin emas.

---

## 5. Xavflar

| Xavf | Taʼsiri | Nima qilamiz |
|---|---|---|
| Eskiz shablonini tasdiqlash 1–3 kun | B2 kechikadi | Ariza B1 bilan birga beriladi; sinovda `SMS_PROVIDER=console` |
| Server ulangach ilovada regressiya | Ishlaydigan ekranlar buziladi | Har bosqichda bayroq bilan ikkala yoʻl ham sinaladi |
| Matching ustani topmasa | Buyurtma navbatda qoladi | Navbat oʻrni ekranda rost koʻrsatiladi (allaqachon shunday) |
| Bitta buyurtmani ikki usta olishi | Maʼlumot buzilishi | `FOR UPDATE SKIP LOCKED` + tranzaksiya (server naqshi tayyor) |
| Telefon internetsiz | Ekran boʻsh qoladi | B7 dagi kesh va «Ulanish yoʻq» holati |
| Prisma migratsiyasi ishlab turgan bazada | Toʻxtash | Har migratsiya qoʻshimcha (nullable), ustun oʻchirilmaydi |
