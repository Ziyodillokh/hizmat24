# Hizmat24 — admin panel TZ

Panel ikki qismdan iborat va ular BIRGA yoziladi: `client-api` ichidagi `admin` moduli va
`apps/admin-web` (brauzer ilovasi). Har bosqich oxirida ikkalasi ham ishlaydi — «backend
tayyor, UI keyin» degan holat boʻlmaydi.

Serverda panel uchun ilgaklar allaqachon bor: `ActorType.ADMIN` audit logda,
`admin:safety-alerts` Redis kanali, matchingʼdagi `MATCHING_ESCALATED` eskalatsiyasi va
`audit_logs` ning oʻchirib boʻlmasligi (DB trigger). Panel ularni ulaydi, qaytadan yozmaydi.

Bu hujjat [backend-ulash-tz.md](backend-ulash-tz.md) ga bogʻlangan: **A2 (usta arizalari)
B4 ning bevosita sharti** — usta arizasini kimdir tasdiqlashi kerak, aks holda usta
ilovasiga kira olmaydi.

---

## 0. Qarorlar

### 0.1 Panel — alohida ilova, alohida domen

`apps/admin-web` — React 18 + Vite + TypeScript + Tailwind (ilova bilan bir xil tokenlar,
lekin desktop layout). `admin.hizmat24.uz` — alohida domen, alohida CORS, alohida
deployment. Mijoz ilovasi bilan bitta kodda yashamaydi: admin buggi mijozlarga tushmasligi
kerak.

Backend: `apps/client-api` ichida **yangi `admin` moduli** (bir xil Prisma, bir xil
tranzaksiyalar, bir xil holat mashinasi). Alohida NestJS ilovasi EMAS — buyurtma holatini
ikkita jarayon oʻzgartirsa, ular albatta bir-biridan uzoqlashadi. Marshrutlar `/admin/*`
prefiksida va alohida guard bilan.

### 0.2 Admin kirishi — email + parol + 2FA, SMS EMAS

Adminlar — xodimlar, mijoz emas. SMS OTP ular uchun ham qimmat, ham zaif.
`admin_users`: email + parol (argon2id) + TOTP (Google Authenticator).
Sessiya — **httpOnly + Secure + SameSite=Strict cookie** (localStorage EMAS: admin brauzeri
mijoz telefonidan koʻra koʻproq hujum yuzasiga ega), 30 daqiqalik faolsizlik chegarasi.

Birinchi admin `npm run admin:create` CLI buyrugʻi bilan yaratiladi — panelda «roʻyxatdan
oʻtish» ekrani hech qachon boʻlmaydi.

### 0.3 Rollar

| Rol | Nima qila oladi |
|---|---|
| `SUPERADMIN` | Hammasi + adminlarni boshqarish + katalog narxlari |
| `OPERATOR` | Buyurtmalar monitoringi, eskalatsiya, xavfsizlik signallari, foydalanuvchi bloklash |
| `MODERATOR` | Usta arizalari va usta profillarini tekshirish |

Uch roldan boshlaymiz: ikkitasi kam (moderator bilan operator vazifasi har xil), toʻrttasi
erta (moliya roli toʻlov ulangach). Ruxsatlar **endpoint darajasida** tekshiriladi, faqat
UI da yashirish emas.

### 0.4 Adminning qoʻli yetmaydigan joylar

Bular ataylab yoʻq va panelda ularning tugmasi ham chizilmaydi:

- **Yopilgan buyurtmaning narxini oʻzgartirish** — chek mijozda allaqachon bor.
- **Bahoni oʻchirish yoki tahrirlash** — reyting mijozniki; faqat «shikoyat» belgisi qoʻyiladi.
- **Audit yozuvini oʻchirish** — DB trigger buni bloklaydi va panel ham urinmaydi.
- **Foydalanuvchini oʻchirish** — faqat bloklash (`UserStatus`), maʼlumot qoladi.
- **Ustaga buyurtmani majburan berish** — faqat qayta qidiruvga qoʻyish; usta rad eta oladi.
- **Mijoz yoki ustaning parolini/kodini koʻrish** — hech qachon; OTP hashlangan.

### 0.5 Halollik qoidasi panelga ham tegishli

Panelda koʻrsatiladigan har bir raqam bazadan hisoblanadi. «Taxminiy», «demo» va
«tez orada toʻldiriladi» degan grafik chizilmaydi: maʼlumot yetarli boʻlmasa, blok
umuman koʻrsatilmaydi va sababi yoziladi.

---

## 1. Maʼlumot modeli (yangi jadvallar)

```prisma
model AdminUser {
  id           String     @id @default(uuid()) @db.Uuid
  email        String     @unique @db.VarChar(160)
  passwordHash String     @map("password_hash") @db.VarChar(200)
  fullName     String     @map("full_name") @db.VarChar(120)
  role         AdminRole
  totpSecret   String?    @map("totp_secret") @db.VarChar(64)
  totpEnabled  Boolean    @default(false) @map("totp_enabled")
  isActive     Boolean    @default(true) @map("is_active")
  lastLoginAt  DateTime?  @map("last_login_at") @db.Timestamptz(3)
  failedLogins Int        @default(0) @map("failed_logins")
  lockedUntil  DateTime?  @map("locked_until") @db.Timestamptz(3)
  // + createdAt/updatedAt
}

enum AdminRole { SUPERADMIN OPERATOR MODERATOR }

model AdminSession {        // cookie ↔ server sessiyasi
  id           String   @id @default(uuid()) @db.Uuid
  adminId      String   @map("admin_id") @db.Uuid
  tokenHash    String   @unique @map("token_hash") @db.VarChar(128)
  ip           String?  @db.VarChar(45)
  userAgent    String?  @map("user_agent") @db.VarChar(300)
  expiresAt    DateTime @map("expires_at") @db.Timestamptz(3)
  revokedAt    DateTime? @map("revoked_at") @db.Timestamptz(3)
}

model MasterApplication {   // B4 bilan birga yaratiladi
  id            String            @id @default(uuid()) @db.Uuid
  userId        String            @map("user_id") @db.Uuid
  profession    String            @db.VarChar(120)
  experience    MasterExperienceLevel
  about         String            @db.VarChar(1000)
  districts     String[]
  workFrom      Int               @map("work_from")
  workTo        Int               @map("work_to")
  claimsCertificate Boolean       @map("claims_certificate")
  status        ApplicationStatus @default(PENDING)
  reviewedBy    String?           @map("reviewed_by") @db.Uuid
  reviewedAt    DateTime?         @map("reviewed_at") @db.Timestamptz(3)
  rejectReason  String?           @map("reject_reason") @db.VarChar(500)
}

enum ApplicationStatus { PENDING APPROVED REJECTED }
```

`AuditAction` enumiga qoʻshiladi: `ADMIN_LOGIN`, `ADMIN_LOGIN_FAILED`, `APPLICATION_REVIEWED`,
`USER_BLOCKED`, `MASTER_BLOCKED`, `ORDER_REASSIGNED`, `ORDER_FORCE_CANCELLED`,
`CATALOG_CHANGED`, `PII_VIEWED`.

---

## 2. Bosqichlar

Har bosqich oxirida: ikkala tomonda `typecheck + lint + test + build` yashil;
`apps/admin-web` da Playwright bilan asosiy yoʻl tekshiriladi; har bir yangi endpoint
uchun e2e test (Testcontainers) yoziladi.

---

### A1 — Kirish, qobiq va rollar

> **Bajarildi** · backend `5820bff`, frontend `1d32ba5`
>
> Rejadan chetlanishlar:
> - parol argon2/bcrypt emas, `node:crypto` scrypt bilan hashlanadi —
>   ikkovi ham nativ qurishni talab qiladi va Docker imijida
>   build-toolchain saqlashga majbur qilardi
> - `GET /admin/catalog/categories` reja tashqarisida qoʻshildi: boʻlim
>   ruxsatini isbotlash uchun haqiqiy endpoint kerak edi (A6 unga
>   tahrirlashni qoʻshadi)
> - panel react-router 7 da; mijoz ilovasi 6 da qoladi

**Maqsad:** admin kira oladi, panel skeleti turadi, ruxsatlar ishlaydi.

**Backend:** `admin` moduli; `AdminUser`/`AdminSession` migratsiyasi; `POST /admin/auth/login`
(email+parol → 2FA talab), `POST /admin/auth/totp`, `POST /admin/auth/logout`,
`GET /admin/me`; `AdminGuard` + `@Roles()` dekoratori; `npm run admin:create` CLI;
login urinishlari cheklovi (5 marta → 15 daqiqa blok) va audit yozuvi.

**Frontend:** `apps/admin-web` skeleti (Vite + React + TS + Tailwind + TanStack Query +
React Router); login ekrani (parol → TOTP); chap menyu + tepa panel; rolga qarab menyu
elementlari; 401 → login; 30 daqiqa faolsizlikda avtomatik chiqish va ogohlantirish.

**Qabul:** `OPERATOR` roli bilan kirilganda katalog boʻlimi menyuda ham yoʻq, toʻgʻridan-toʻgʻri
URL bilan kirilganda ham `403`; barcha kirish urinishlari audit logda.

---

### A2 — Usta arizalari (B4 ning sharti)

> **Bajarildi** · server `b8a3165`, panel `29c82bd`, ilova `7ef5983` ·
> APK `hizmat24-a2-ariza.apk`
>
> Rejadan chetlanishlar:
> - `GET /admin/applications/categories` qoʻshildi — moderator `catalog`
>   boʻlimiga kira olmaydi, tasdiqlashda esa xizmatlar roʻyxati kerak
> - bitta foydalanuvchida bitta PENDING ariza bazadagi qisman unique
>   indeks bilan kafolatlanadi (servis tekshiruvi faqat oʻzbekcha 409 uchun)
> - audit yozuvi tranzaksiya ICHIDA, keyin emas
> - «tasdiqlangach usta rejimiga kiradi» — maʼlumot darajasida bajarildi
>   (`masters.user_id` bogʻlanadi); ilovaning usta rejimi hozircha
>   mahalliy profilga tayanadi, serverga B4 da bogʻlanadi

**Maqsad:** usta arizasi panelga tushadi, moderator tekshiradi, tasdiqlangach usta ilovaga kiradi.

**Backend:** `MasterApplication` migratsiyasi; `POST /master/applications` (ilovadan),
`GET /admin/applications?status=`, `GET /admin/applications/:id`,
`POST /admin/applications/:id/approve`, `/reject` (sabab majburiy).
Tasdiqlash **bitta tranzaksiyada**: `Master` yaratiladi, `masters.user_id` bogʻlanadi,
kategoriyalar biriktiriladi, `master_profiles` yoziladi, audit yozuvi qoʻyiladi.

**Frontend:** arizalar roʻyxati (yangi → eski, holat filtri, qidiruv); ariza kartasi:
shaxs, kasb, tajriba, tumanlar, ish vaqti, «oʻzim haqimda», sertifikat **daʼvosi**
(«tekshirilmagan» belgisi bilan); ikki tugma — «Tasdiqlash» (kategoriyalarni tanlab) va
«Rad etish» (sabab majburiy, mijoz ilovasida koʻrinadi).

**Qabul:** ilovadan yuborilgan ariza 5 soniyada panelda; tasdiqlangandan keyin oʻsha telefon
usta rejimiga kiradi; rad etilganda ilovada sabab koʻrinadi. Har ikki amal audit logda
(kim, qachon, qaysi IP).

---

### A3 — Buyurtmalar monitoringi va eskalatsiya — ✅ BAJARILDI

> Bajarildi (2026-09-24). Eskalatsiya USTUN EMAS, hisoblanadigan holat:
> «qidiruv davom etyapti va urinishlar tugagan». Ustun qoʻshilsa u
> haqiqat bilan ajralib qolishi mumkin edi.
>
> Qaysi amal mumkinligini server aytadi (`canRequeue`, `canCancel` va
> sabab) — panel qoidani takrorlamaydi.
>
> TZ dan chekinish: virtualizatsiya va kursorli sahifalash yozilmadi
> (hozircha `limit`/`offset`), xarita nuqtasi K1 gacha yoʻq. Jonli
> yangilanish WS emas, 5 soniyalik takroriy soʻrov.
>
> Qabul sinovi: eskalatsiya navbati → qayta qidiruv (urinishlar nolga
> tushdi, usta darhol tayinlandi) → operator bekor qilishi (sabab mijoz
> kartochkasida koʻrindi). Audit izi joyida.

#### Dastlabki reja

**Maqsad:** operator butun oqimni koʻradi va tiqilib qolganini qoʻl bilan hal qiladi.

**Backend:** `GET /admin/orders` (holat, sana, kategoriya, usta, mijoz boʻyicha filtr,
sahifalash, kursor); `GET /admin/orders/:id` (toʻliq kartochka + `OrderStatusHistory`);
`GET /admin/orders/escalated` (matching 5 urinishdan keyin eskalatsiya qilganlar);
`POST /admin/orders/:id/requeue` (qayta qidiruvga), `POST /admin/orders/:id/cancel`
(sabab majburiy, `cancelledBy: SYSTEM`, mijozga bildirishnoma).

**Frontend:** jadval (virtualizatsiya, 50 qator sahifada); qator rangi holat boʻyicha;
buyurtma kartasi: vaqt chizigʻi (`OrderStatusHistory` — kim, qachon, nimaga), mijoz va usta
bloklari, narx tafsiloti, xarita nuqtasi (K1 dan keyin); eskalatsiya navbati alohida
sahifada va tepada hisoblagich.

**Qabul:** eskalatsiya qilingan buyurtma navbatda 10 soniyada paydo boʻladi; «qayta qidiruv»
tugmasidan keyin matching yana ishga tushadi; bekor qilinganda mijoz ilovasida holat
oʻzgaradi va sabab koʻrinadi.

---

### A4 — Xavfsizlik signallari — ✅ BAJARILDI

> Bajarildi (2026-09-24). Uch xil xulosa (CONFIRMED / FALSE_ALARM /
> NO_CONTACT) va majburiy izoh; usta bloklash va blokdan chiqarish shu
> yerdan. Buyurtma holati OʻZGARTIRILMAYDI va bloklash AVTOMATIK emas.
>
> TZ dan chekinish: admin WS (`/ws/admin`) va ovozli bildirishnoma
> yozilmadi — panelda alohida WS kanali yoʻq va uni faqat hisoblagich
> uchun qurish ortiqcha edi. Signallar 3 soniyalik takroriy soʻrov
> bilan yangilanadi (qabul sharti «3 soniyada» bajariladi).
>
> Qabul sinovi: ilovada «Bu men chaqirgan usta emas» → signal panelda →
> xulosa bilan yopildi → usta bloklandi → bloklangan usta
> `/master/orders` dan aniq sabab bilan qaytarildi.

#### Dastlabki reja

**Maqsad:** «Bu men chaqirgan usta emas» signali panelga darhol tushadi.

**Backend:** `admin:safety-alerts` Redis kanaliga obuna → admin WS (`/ws/admin`);
`GET /admin/safety-alerts`, `POST /admin/safety-alerts/:id/resolve` (natija: `CONFIRMED`,
`FALSE_ALARM`, `NO_CONTACT` + izoh). Usta bloklash shu yerdan bir bosishda.

**Frontend:** ochiq signallar tepada qizil hisoblagich va ovozli bildirishnoma (brauzerda);
signal kartasi: buyurtma, mijoz, usta, vaqt, IP/User-Agent; qaror tugmalari izoh bilan.

**Qabul:** ilovada «Bu men chaqirgan usta emas» bosilganda panel 3 soniyada signal koʻrsatadi;
qaror audit logda va buyurtma `SAFETY_FLAGGED` holatida qoladi (oʻzgartirilmaydi).

---

### A5 — Foydalanuvchilar va ustalar — ✅ BAJARILDI

> Bajarildi (2026-09-24). PII qoidasi bajarildi: roʻyxatda raqam
> maskalangan, toʻliq koʻrish alohida amal va `PII_VIEWED` yozuvi
> qoldiradi.
>
> Bekor qilish ulushi usta TEGGAN ishlardan hisoblanadi; ishi yoʻq
> ustada `null` (nol foiz yolgʻon boʻlardi).
>
> TZ dan chekinish: `GET /admin/masters/:id` alohida kartochkasi va
> `PATCH /admin/masters/:id/categories` yozilmadi — usta xizmatlarini
> oʻzi boshqaradi (P2) va admin tomondan oʻzgartirish hozircha kerak
> emas. Reyting TARIXI ham yoʻq: `ratings` jadvalida vaqt boʻyicha
> kesim saqlanmaydi.
>
> Qabul sinovi: maskalangan roʻyxat → toʻliq raqam ochildi va auditga
> tushdi → bloklash → ikkinchi marta bloklab boʻlmadi → blokdan
> chiqarish.

#### Dastlabki reja

**Maqsad:** qoʻllab-quvvatlash ishi: kim, nima qilgan, kimni bloklash kerak.

**Backend:** `GET /admin/users` (telefon/ism boʻyicha qidiruv), `GET /admin/users/:id`
(buyurtmalar tarixi bilan), `POST /admin/users/:id/block` / `/unblock` (sabab majburiy);
`GET /admin/masters`, `GET /admin/masters/:id` (reyting tarixi, bajarilgan ishlar,
bekor qilishlar foizi), `POST /admin/masters/:id/block` / `/unblock`,
`PATCH /admin/masters/:id/categories`.
**PII qoidasi:** telefon raqamini toʻliq koʻrish alohida amal — bosilganda `PII_VIEWED`
audit yozuvi qoʻyiladi va roʻyxatda raqam maskalangan turadi.

**Frontend:** qidiruv, kartochka, bloklash dialogi (sabab), «Nima oʻzgardi» tarixi.

**Qabul:** bloklangan foydalanuvchi ilovaga kira olmaydi (server allaqachon tekshiradi);
bloklangan usta yangi taklif olmaydi, lekin joriy ishini yakunlaydi.

---

### A6 — Katalog boshqaruvi

**Maqsad:** yangi xizmat qoʻshish uchun ilovani yangilash shart emas.

**Backend:** `ServiceGroup` va `ServiceCategory` CRUD (`SUPERADMIN`); narx oʻzgarishi
audit logda; oʻchirish YOʻQ — faqat `isActive=false`; oʻzgarishda
`service-categories:invalidate` kanaliga xabar (mexanizm allaqachon bor).

**Frontend:** guruhlar va xizmatlar jadvali, sudrab tartiblash (`sortOrder`), narx va
murakkablik darajasi, ikona kaliti tanlagich (ilovadagi mavjud ikonalar roʻyxatidan —
ixtiyoriy matn EMAS, aks holda ilovada ikona chizilmaydi).

**Qabul:** panelda narx oʻzgartirilgandan keyin ilova 1 daqiqa ichida yangi narxni koʻrsatadi;
allaqachon berilgan buyurtmaning narxi oʻzgarmaydi (u muzlatilgan).

---

### A7 — Hisobotlar va audit koʻrinishi — ✅ BAJARILDI

> Bajarildi (2026-09-24). Raqamlar keshsiz SQL agregatsiyasi; audit
> filtr bilan va CSV eksport (`@RawResponse()` — konvertdan chetlab
> oʻtadi, aks holda Fastify obyektni yubora olmasdi).
>
> Maʼlumot boʻlmagan davrda «Bu davrda maʼlumot yoʻq» yoziladi;
> oʻrtacha tayinlash vaqti `null` boʻlishi mumkin.
>
> TZ dan chekinish: grafik chizilmadi — raqamli roʻyxat qoʻyildi.
> Grafik kutubxonasi qoʻshish hozirgi hajmda ortiqcha.
>
> Qabul sinovi: hisobot raqami psql bilan bir xil (17 = 17); CSV
> `text/csv` sarlavhasi bilan keldi, ichki qoʻshtirnoqlar ikkilangan.

#### Dastlabki reja

**Maqsad:** «bugun nima boʻldi» degan savolga bir ekranda javob.

**Backend:** `GET /admin/stats?from=&to=` — buyurtmalar soni holat boʻyicha, oʻrtacha
tayinlash vaqti, bekor qilish sabablari, faol ustalar soni, kategoriya boʻyicha taqsimot.
Hammasi SQL agregatsiyasi, keshsiz (kunlik hajm kichik); `GET /admin/audit` (filtr: aktor,
amal, sana, obyekt) + CSV eksport.

**Frontend:** bosh sahifa: bugungi raqamlar va ochiq muammolar (eskalatsiya, signallar,
kutayotgan arizalar); audit sahifasi — jadval va filtr.

**Qabul:** raqamlar `psql` dagi soʻrov bilan bir xil; maʼlumot boʻlmagan davr uchun grafik
oʻrniga «Bu davrda maʼlumot yoʻq» yoziladi.

---

### A8 — Moliya (toʻlov ulangandan keyin)

Komissiya hisobi, ustaning qarzi/toʻlovlari, hisob-kitob davrlari, Click/Payme tranzaksiyalari.
Alohida TZ talab qiladi — toʻlov integratsiyasidan oldin yozilmaydi.

---

## 3. Xavfsizlik talablari

1. **Har bir yozuv amali audit logda** — kim (admin id), nima, qaysi obyekt, IP, User-Agent.
2. **2FA majburiy** `SUPERADMIN` uchun; boshqalar uchun birinchi kirishda yoqiladi.
3. **Sessiya** httpOnly cookie, 30 daqiqa faolsizlik, `SameSite=Strict`, CSRF tokeni.
4. **Ruxsat endpointda** tekshiriladi; UI da yashirish — faqat qulaylik.
5. **PII koʻrish qayd qilinadi** (telefon raqami, manzil) — kim koʻrgani bilinadi.
6. **Rate limit**: login 5/15 daqiqa, qidiruv 60/daqiqa, eksport 5/soat.
7. **Alohida domen va CORS**; `admin-web` mijoz ilovasi bilan bitta originda turmaydi.
8. **Backup tekshiruvi**: panel orqali qilingan har bir bloklash/bekor qilish qaytariladigan
   boʻlishi kerak (holat oʻzgaradi, maʼlumot oʻchmaydi).

---

## 4. Ketma-ketlik va bogʻliqliklar

```
A1 (kirish, qobiq)
 └─ A2 (usta arizalari) ──► B4 ni ochadi (usta ilovaga kira oladi)
     └─ A3 (buyurtmalar) ──► B5 bilan birga maʼnoli boʻladi
         ├─ A4 (xavfsizlik signallari)
         ├─ A5 (foydalanuvchilar)
         └─ A6 (katalog) ──► B3 dagi katalogni toʻldiradi
             └─ A7 (hisobotlar)
                 └─ A8 (moliya — toʻlovdan keyin)
```

Tavsiya etilgan tartib: **A1 → A2 → B4 → B5 → A3 → A4 → A5 → A6 → A7.**
Sababi: A2 boʻlmasa usta tomoni serverga ulanmaydi; A3 esa haqiqiy buyurtmalar
oqimi paydo boʻlgandan keyin maʼnoli.
