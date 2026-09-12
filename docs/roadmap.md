# Hizmat24 — rivojlantirish rejasi

Egasi bergan demo (`skillhub_demo_v21`) asosida tuzilgan. Demodan **UX va
funksionallik** olinadi, **dizayn tizimi bizniki qoladi**: turkuaz palitra,
Phosphor ikonalari, mavjud token va karta tili.

Holat: 2026-yil 9-sentabr.

---

## 1. Hozirgi holat

Tayyor (18 ta ekran):

| Bo'lim | Ekranlar |
|---|---|
| Kirish | Login, SMS tasdiqlash, Tanishtiruv (4 bosqich) |
| Bosh | Bosh sahifa, Kategoriyalar, Barcha xizmatlar |
| Buyurtma | Tafsilotlar, Xarita tanlash, Manzil, Tasdiqlash, Kuzatuv, Ustani tasdiqlash, Xavfsizlik, Baholash, Chek |
| Ro'yxatlar | Buyurtmalar, Bildirishnomalar, Mutaxassislar, Usta profili |
| Market | Do'konlar, Do'kon sahifasi, Mahsulot sahifasi |
| Boshqa | Profil, Qo'llab-quvvatlash |

Backend (`apps/client-api`) tayyor, lekin **ilovaga ulanmagan** — barcha
ma'lumot `src/mocks` dan keladi.

---

## 2. Navigatsiya tuzilmasi

Tab bar demodagi kabi **5 ta bo'lim** bo'ladi:

| Tab | Ichida nima bor |
|---|---|
| **Bosh** | Premium ustalar tasmasi, qidiruv, banner, kategoriyalar, tavsiya etilgan ustalar. **Market** va **Mutaxassislar** shu yerdan ochiladi |
| **Karta** | Shu oyda sarflangan pul, soha va to'lov usuli bo'yicha taqsimot, oxirgi 6 oy, daraja va keshbek |
| **Buyurtma** | Buyurtmalar ro'yxati va kuzatuv |
| **Chat** | Suhbatlar ro'yxati, usta bilan yozishma, AI yordamchi |
| **Profil** | Manzillar, sevimlilar, rol, sozlamalar, yordam |

**Market va Mutaxassislar tab bardan chiqadi.** Sabab: beshta tabga demo
bo'limlari sig'ishi kerak, va bu ikkisi asosiy oqim emas — ular Bosh
sahifadan kiriladi.

---

## 3. Bosqichlar

Har bosqichda kamida uchta yangi sahifa. Tegishli eski sahifalar shu
bosqichning o'zida yangilanadi — alohida "tuzatish" bosqichi qilinmadi,
chunki kontekst yo'qoladi.

### 1-bosqich — Chat ✅ bajarildi

| Sahifa | Marshrut |
|---|---|
| Suhbatlar ro'yxati | `/app/chat` |
| Usta bilan yozishma | `/app/chat/:threadId` |
| AI yordamchi | `/app/chat/ai` |

Chat butunlay yangi tab. U tayyor bo'lmaguncha tab barni almashtirib
bo'lmaydi, shuning uchun birinchi.

Kirish nuqtalari: buyurtma kuzatuvi, usta profili va Profil → Xabarlar.
Tab bar hozircha o'zgarmadi — u 2-bosqich oxirida almashadi.

Qo'shimcha qarorlar:
- Xabarlar qurilmada saqlanadi (`hizmat24:chat:v1`), chiqishda o'chiriladi.
- Suhbati yo'q usta bilan yozishmoqchi bo'lsa — bo'sh suhbat ochiladi.
- Klaviatura kompozitorni yopmasligi uchun `windowSoftInputMode=adjustResize`.

### 2-bosqich — Karta va pul ✅ bajarildi

| Sahifa | Marshrut |
|---|---|
| Karta va moliya (sarflangan pul, statistika) | `/app/wallet` |
| Bonuslar (Bronza / Kumush / Oltin, keshbek) | `/app/wallet/bonus` |
| Tranzaksiyalar tarixi | `/app/wallet/history` |

**Tab bar almashdi:** Bosh · Karta · Buyurtma · Chat · Profil. Market va
Mutaxassislar Bosh sahifadagi katakchalarga ko'chdi (qo'shilgan balandlik 0px).

Qo'shimcha qarorlar:
- Bu bo'lim **hamyon emas**: hisob balansi va uni to'ldirish Click hamda
  Payme ulangach ishga tushadi. Hozircha faqat sarflangan pul ko'rsatiladi
  va sahifa buni ochiq aytadi.
- Daraja pul emas, **yakunlangan buyurtma soniga** bog'liq: 0–9 Bronza (2%),
  10–29 Kumush (4%), 30+ Oltin (6%). Bekor qilingan buyurtma sanalmaydi.
- Keshbek alohida mexanika: har 10 ta buyurtmada 1%, eng yaqin 100 so'mga
  yaxlitlanadi.
- Tab yorlig'i demodagi "Zakazlar" emas, "Buyurtma" — ilovada birorta joyda
  "zakaz" so'zi yo'q.
- Statistika mock to'lovlar (16 ta) va haqiqiy yakunlangan buyurtmalardan
  birgalikda hisoblanadi; bir buyurtma ikki marta sanalmaydi.

**3-bosqichga ko'chirildi:** escrow'da muzlatilgan summa, chegirmani to'lovda
qo'llash, keshbekni sarflash, to'lov cheki, Click/Payme integratsiyasi.

### 3-bosqich — Bron va to'lov ✅ bajarildi

| Sahifa | Marshrut |
|---|---|
| Sana va vaqt tanlash | `/app/new/schedule` |
| To'lov usuli va hisob | `/app/new/payment` |
| To'lov cheki | `/app/order/:id/payment-receipt` |

Buyurtma zanjiri to'liq: xizmat → tavsif → xarita → manzil → **vaqt** →
**to'lov** → tasdiqlash → **to'lov cheki** → kuzatuv. StepDots 5 qadam.

Qo'shimcha qarorlar:
- **Yakuniy summa** = asosiy narx + shoshilinch qo'shimchasi (20 000 so'm,
  qat'iy) − daraja chegirmasi. Chegirma faqat asosiy narxdan olinadi.
- Shoshilinch qo'shimchasi vaqt tanlash ekranida, tugma yonida aytiladi —
  to'lov ekranida birinchi marta ko'rinsa, u yashirin to'lov bo'lardi.
- **Faqat naqd ishlaydi.** Kafolatli to'lov va bank kartasi ro'yxatda
  ko'rinadi, lekin `disabled` — Click va Payme ulangach ochiladi. Ekranda
  buni aytadigan banner turadi.
- Hisob-faktura buyurtma yaratilganda **muzlatiladi**: daraja keyin
  ko'tarilsa ham o'tmishdagi chek va statistika o'zgarmaydi.
- `LiveOrder.price` o'chirildi, o'rniga `invoice` — kompilyator har bir
  o'quvchini ko'rsatishi uchun.
- Rejalashtirilgan buyurtmada usta qidiruvi belgilangan vaqtda boshlanadi.
- Ikkita chek bir-birini takrorlamaydi: `/receipt` — nima qilindi va kim
  qildi, `/payment-receipt` — nima to'lanadi va qaysi qatorlardan.
- Sug'urta va bosqichli escrow qoidasi **kiritilmadi**: shartnoma yo'q,
  demak bajarib bo'lmaydigan va'da bo'lardi.

**Yopilgan ochiq uchlar:** `DEFAULT_PAYMENT_METHOD` taxmini o'chdi, daraja
chegirmasi haqiqatan qo'llanadi, kafolat va'dalari "tez orada" deb
aniqlashtirildi.

**Ochiq uchlar (keyingi bosqichlarga):** qoralama saqlanmaydi (oqim
yarmida ilova yopilsa yo'qoladi); `MapStep` dagi "Mening joylashuvim"
tugmasi hech narsa qilmaydi (`@capacitor/geolocation` o'rnatilmagan);
rejalashtirilgan buyurtma uchun alohida `OrderStatus` yo'q; keshbekni
sarflash balans bilan birga keladi; platforma komissiyasi ish narxining
6% idan kam bo'lmasligi shart — aks holda Oltin darajadagi chegirma
platformani zararga soladi.

### 4-bosqich — Ish jarayoni ✅ bajarildi

| Sahifa | Marshrut |
|---|---|
| Usta yo'lda (manzil va aloqa) | `/app/order/:id/map` |
| Ish isboti | `/app/order/:id/proof` |
| Baholash (qayta ishlangan) | `/app/order/:id/rate` |

**Jonli xarita BAJARILMADI va bu ataylab.** Ma'lumot modelida birorta
koordinata yo'q (`OrderAddress` ham, `Master` ham), xarita kutubxonasi va
plitka serveri yo'q, ilova internetsiz ishlaydi. Har qanday xarita to'liq
ixtiro bo'lardi — foydalanuvchi eng xavotirli bo'lgan daqiqada aytilgan
yolg'on. Ekran o'rniga to'rt savolga javob beradi: kim keladi, taxminan
qachon, qanday bog'lanaman, kechiksa nima qilaman.

Qo'shimcha qarorlar:
- `@capacitor/camera` va `@capacitor/geolocation` **o'rnatilmadi.** Isbot
  fotosini usta oladi (mijozga kamera kerak emas), geolokatsiya esa
  mijozning koordinatasini beradi, ustanikini emas.
- Isbot sahifasida soxta foto **yo'q**: o'rindosh ochiq "hali yuklanmagan"
  deydi. "GPS tasdiqlandi" belgichasi ham chizilmaydi — tekshirilmagan
  xavfsizlik da'vosi oddiy soxta ma'lumotdan og'irroq.
- Isbot sahifasi baholashni **bloklamaydi**: hech qachon kelmaydigan
  ma'lumotga qo'yilgan darvoza buyurtmani muzlatib qo'yardi.
- Baholashda past baho uchun **sabab tegi majburiy** (uzun izoh emas):
  bir marta bosish bir xil signalni beradi, eng asabiy daqiqada esa
  20 belgilik izoh eng katta to'siq bo'lardi.
- Yulduz shkalasi monoton qilindi: ilgari 2-yulduz "Qoniqarli" edi —
  salbiy bahoga ijobiy yorliq.
- `ProgressBar value={72}` o'chirildi: 72% to'qilgan raqam edi, endi
  `indeterminate`.

**Ochiq uchlar:** jonli xarita, ish fotosi va GPS tasdig'i — backend va
usta ilovasi kelgach; nizo ochish — 5-bosqich; `MapStep` dagi "Mening
joylashuvim" tugmasi hamon hech narsa qilmaydi.

### 5-bosqich — Nizo va kafolat ✅ bajarildi

| Sahifa | Marshrut |
|---|---|
| Muammo haqida xabar | `/app/order/:id/dispute` |
| Murojaat matni | `/app/disputes/:disputeId` |
| Murojaatlarim | `/app/disputes` |
| Kafolat va himoya | `/app/guarantee` |

**Nizo tizimi BAJARILMADI va bu ataylab.** Murojaatni ko'rib chiqadigan
hakam ham, operator ham, backend ham yo'q. "Ariza qabul qilindi ·
ko'rib chiqilmoqda" degan ekran ilovaning eng ishonchsiz daqiqasida
aytilgan eng katta yolg'on bo'lardi: holat hech qachon o'zgarmasdi.

O'rniga ilova bajarishi mumkin bo'lgan ish bajarildi va u haqiqiy:
**murojaat matnini tayyorlash**. Foydalanuvchi sabab va kutilmani
tanlaydi, nima bo'lganini yozadi — ilova esa buyurtma raqami, sana,
usta ismi, summa, to'lov usuli, manzil va telefon raqamini qo'shib
to'liq matn yig'adi. Bugun bu ma'lumotni foydalanuvchi qo'lda qidirib
topishi kerak edi.

Qo'shimcha qarorlar:
- Tugma yorlig'i **"Matnni tayyorlash"** — "Nizo ochish" emas. Yorliq
  amalni aytadi, natijani emas.
- Kanal jurnalida **"Yuborildi" hech qachon yozilmaydi**: ilova Telegram
  havolasi ochilganini biladi, matn qo'yilganini bilmaydi.
- Yagona holat — foydalanuvchi o'zi qo'yadigan "Hal bo'ldi" belgisi.
  Platforma nomidan qaror yozilmaydi.
- Xavfsizlik sababi tanlansa **`tel:102`** blokini ko'rsatadi va ilova
  militsiyaga xabar yubormasligini darhol aytadi.
- Kafolat sahifasidagi har bir bandda **`limit` maydoni majburiy**
  (TypeScript darajasida `?` yo'q) — chegarasiz yozilgan band marketing
  bo'lardi. Nomdan "sug'urta" so'zi olib tashlandi: shartnoma yo'q.
- Murojaat matnidagi sana **mutlaq** (`12.09.2026, 10:57`): "Bugun"
  matn ichida muzlab qolardi va ertaga noto'g'ri kunni ko'rsatardi.
  Ekrandagi yorliq nisbiy qoladi — u qayta hisoblanadi.

**Bir vaqtning o'zida tuzatilgan eski va'dalar:** xavfsizlik oqimidagi
"Operatorimiz siz bilan bog'lanadi", qo'llab-quvvatlash ekranidagi
begona mock buyurtma raqami, kirish va tanishtiruv ekranlaridagi
"Passport va ID tekshirilgan" hamda "24/7 AI", AI yordamchining
o'lchanmagan "15 daqiqa", "20% farq" va "3 daqiqagacha" qoidalari.

**Ochiq uchlar:** kafolatli to'lov, pulni qaytarish va murojaatni
platforma tomonida ko'rib chiqish — Click/Payme va backend kelgach.

### 6-bosqich — Shaxsiy bo'lim ✅ bajarildi

| Sahifa | Marshrut |
|---|---|
| Shaxsiy ma'lumotlar | `/app/profile/edit` |
| Manzillarim | `/app/addresses` |
| Manzil qo'shish / tahrirlash | `/app/addresses/new` · `/app/addresses/:id` |
| Sevimli ustalar | `/app/favorites` |
| Manzilni tanlash (buyurtma oqimida) | `/app/new/address` |

**"Kelgan takliflar" QILINMADI va o'rniga "Shaxsiy ma'lumotlar" qilindi.**
Sabab: taklif yuboradigan tizim yo'q. `NotificationKind` — faqat buyurtma
hodisalaridan iborat yopiq ro'yxat, push plagini o'rnatilmagan, promokod
va referal kodi yo'q. Yagona haqiqiy chegirma — daraja va keshbek, ular
esa allaqachon Bonuslar sahifasida. Doim bo'sh turadigan sahifa
foydalanuvchini bir marta chalg'itib, boshqa ochilmasdi.

**Uch yolg'on tuzatildi — bosqichning asosiy qiymati shunda:**

1. **To'qilgan ism.** Profil va bosh sahifa `src/mocks/user.ts` dagi
   "Jasur" ni ko'rsatardi — foydalanuvchi hech qachon aytmagan ism. Endi
   ism foydalanuvchidan keladi yoki "Ism kiritilmagan" deb turadi.
   Ism murojaat matniga ham qo'shiladi.
2. **Soxta joylashuv aniqlash.** `/app/new/map` ekrani "Manzilni tanlang"
   deb turib, qattiq yozilgan `DETECTED_ADDRESS` ni aniqlangan manzil
   sifatida ko'rsatardi; "Mening joylashuvim" tugmasining esa `onClick` i
   umuman yo'q edi (`@capacitor/geolocation` o'rnatilmagan). Ekran o'chirildi
   va o'rniga saqlangan manzilni tanlash ekrani keldi. `MapPreview` buyurtma
   oqimidan olib tashlandi: yozilgan matn yonidagi xarita geokodlash
   bo'lgandek ko'rsatardi.
3. **Boshqa odam tayinlanishi.** `assignMaster()` argumentsiz edi va HAR
   BIR buyurtmaga bitta odam — Akmal Rahimov — tayinlanardi, bosh sahifadagi
   "Buyurtma berish" tugmasi boshqa ustaning kartasida turgan bo'lsa ham.
   Endi `OrderDraft.preferredMasterId` va `LiveOrder.preferredMasterId`
   bor: tanlangan usta buyurtmaga yoziladi va aynan u tayinlanadi.

Qo'shimcha qarorlar:
- Saqlangan manzil FAQAT yozishni tejaydi. Koordinata yo'q, shuning uchun
  masofa, ETA va "eng yaqin usta" haqida bir so'z ham yozilmaydi.
- `AddressStep` endi `draft.address` dan tiklanadi. Ilgari u `draft` ni
  umuman o'qimasdi: foydalanuvchi manzilini yozib, keyingi qadamga o'tib,
  orqaga bosganda o'z matnini yo'qotardi.
- Sevimli ustada UCHTA amal bor va uchalasi ishlaydi: profil, yozish va
  chaqirish. Bandlik, narx va masofa YOZILMAYDI — `Master` tipida bu
  maydonlar yo'q.
- Usta profilidagi "Pasport ma'lumotlari tekshirilgan" olib tashlandi: u
  Kafolat sahifasining "Passport va ID tekshiruvi ilovada
  ko'rsatilmaydi" jumlasiga qarama-qarshi turardi.
- Telefon raqamini o'zgartirish QILINMADI: u SMS bilan tasdiqlangan va
  qayta tasdiqlash oqimi yo'q. Maydon read-only va sabab yozilgan.
- Manzil maydonlarida yorliq endi KO'RINADI (`AddressPartFields`):
  placeholder to'ldirilgach yo'qolardi va "3" nimani bildirishi
  noma'lum qolardi.
- `applyServerStep` va `advanceOrder` dagi takroriy mantiq `buildStepPatch`
  ga yig'ildi — tanlangan ustani faqat bittasiga qo'shish jimgina
  nomuvofiqlik berardi.
- `reviveSession` sof funksiya sifatida ajratildi va eski yozuv
  migratsiyasi endi test bilan qoplangan (`price` → `invoice`, `fullName`,
  `preferredMasterId`).
- `Tabs.tsx` 500 satrdan oshgani uchun `MasterProfile` alohida faylga
  chiqarildi.

**`docs/frontend-prompt.md` §14 bilan ziddiyat:** o'sha bo'lim
"Manzillarim" ni (14.4.29), ism o'zgartirishni (14.4.28) va
"yoqtirish" tugmasini (14.1.5) TAQIQLAGAN edi. Taqiqning sababi
ma'lumot manbai yo'qligi edi; endi manba bor. §14 ga bekor qilingan
bandlar jadvali qo'shildi va kuchda qolganlari sanab o'tildi.

**Ochiq uchlar:** xarita va geolokatsiya, telefon raqamini o'zgartirish,
tanlangan ustaning bandligini tekshirish — backend kelgach.

### 7-bosqich — Usta tomoni: kirish

| Sahifa | Marshrut |
|---|---|
| Usta bo'lish (ariza) | `/app/master/apply` |
| Soha tanlash (1/5 oqim) | `/app/master/setup` |
| Usta profili sozlamalari | `/app/master/settings` |

### 8-bosqich — Usta tomoni: ish topish

| Sahifa | Marshrut |
|---|---|
| Ish takliflari | `/app/master/jobs` |
| Obuna tariflari (kunlik / haftalik / oylik) | `/app/master/subscription` |
| E'lon joylash | `/app/master/post-job` |

### 9-bosqich — Qo'shimchalar

| Sahifa | Marshrut |
|---|---|
| Hamkor dasturi (referal) | `/app/partner` |
| Namoz vaqtlari va qibla | `/app/prayer` |
| Hisobni o'chirish | `/app/profile/delete` |

**Jami: 27 ta yangi sahifa.**

---

## 4. Hal qilinmagan savollar

Bu savollar arxitekturaga ta'sir qiladi va bosqich boshlanishidan oldin
javob kerak:

1. ~~**Balans qayerdan to'ladi?**~~ Javob berildi: Click va Payme kelajakda
   ulanadi va hisob to'ldiriladi. 2-bosqichda balans chizilmadi — u to'lov
   integratsiyasi bilan birga 3-bosqichda keladi.
2. **Usta tomoni qayerda?** Shu ilova ichida rejim almashtirish bilanmi
   (demodagi kabi: bitta hisob, ikki rejim) yoki alohida APK.
3. **Backend qachon ulanadi?** Hozir barcha ekran mock'da ishlaydi.
   Ulanish qancha kechiksa, mock va API o'rtasidagi farq shuncha ko'payadi.

---

## 5. O'zgarmaydigan qoidalar

- Rang faqat `src/tokens/colors.ts` dagi tokenlardan; shrift o'lchami faqat
  `typography.ts` dan.
- Padding/margin faqat `spacing.ts` dagi `SPACING` ro'yxatidan. Ro'yxatda
  yo'q raqam jimgina Tailwind standartiga tushadi (`py-10` → 40px).
- O'zbek tipografiyasi: `oʻ` va `gʻ` da U+02BB, tutuq belgisida U+02BC.
- Ilova internetsiz ochiladi: tashqi rasm, shrift yoki so'rov yo'q.
- Bosh sahifa to'rtta o'lchamda scrollsiz sig'adi: 360×730, 393×780,
  390×844, 412×915.
- Ishlamaydigan tugma yozilmaydi. Funksiya tayyor bo'lmasa — buni aytadigan
  xabar chiqadi.
