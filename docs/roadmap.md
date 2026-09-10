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

### 4-bosqich — Ish jarayoni

| Sahifa | Marshrut |
|---|---|
| Jonli xarita (usta yo'lda) | `/app/order/:id/map` |
| Ish yakunlash isboti (foto + GPS) | `/app/order/:id/proof` |
| Baholash (qayta ishlangan) | `/app/order/:id/rate` |

### 5-bosqich — Nizo va kafolat

| Sahifa | Marshrut |
|---|---|
| Nizo ochish | `/app/order/:id/dispute` |
| Nizolarim | `/app/disputes` |
| Kafolat va sug'urta | `/app/guarantee` |

### 6-bosqich — Shaxsiy bo'lim

| Sahifa | Marshrut |
|---|---|
| Manzillar (Uy / Ish) | `/app/addresses` |
| Sevimli ustalar | `/app/favorites` |
| Kelgan takliflar | `/app/offers` |

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
