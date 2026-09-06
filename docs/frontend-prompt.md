# Hizmat24 — mijoz mobil ilovasi uchun to'liq UI to'plami

> Bu hujjat — yagona haqiqat manbai. Referens rasmlar faqat vizual til uchun namuna; ular bilan bu hujjat zid kelgan har bir joyda **bu hujjat ustun turadi**. Rasmdagi hech qanday matn ko'chirilmaydi.

---

## 0. VAZIFA VA ISHLASH TARTIBI

Sen "Hizmat24" — santexnik, elektrik, duradgor va boshqa uy xizmatlari ustalarini mijoz bilan bog'laydigan **mijoz (client) mobil ilovasi** uchun to'liq UI to'plamini yasaysan.

Ishni **5 bosqichda** bajar (13-bo'limga qara). Har bir bosqichni tugatgach, keyingisiga o'tishdan oldin: ishlatilgan token va komponentlar ro'yxatini chiqar — keyingi bosqichda **aynan o'shalar** qayta ishlatiladi, yangi qiymat kiritilmaydi.

Chiqish: mobile-first, iOS status bar bilan, har bir ekran alohida frame, Dark va Light variantlar alohida qatorda.

---

## 1. MAHSULOT KONTEKSTI VA QAT'IY BIZNES QOIDALARI

Bu qoidalar backend bilan qat'iy bog'langan. Ularni buzadigan ekran chizilsa, u hech qachon ishlamaydi.

1. **Ustani mijoz TANLAMAYDI.** Tizim buyurtmaga bitta ustani o'zi tayinlaydi. Har qanday ekranda har doim **bitta usta yoki hech kim** bo'ladi. Ustalar ro'yxati, katalogi, qidiruvi, takliflari, karuseli — mavjud emas.
2. **Chat/xabarlashuv yo'q.** Mijoz—usta aloqasi faqat telefon qo'ng'irog'i orqali.
3. **Usta telefon raqami faqat 4 holatda mavjud:** "Usta topildi", "Usta yo'lda", "Usta yetib keldi", "Ish jarayonida". Boshqa holatlarda raqam yo'q — tugma disabled emas, **butunlay yashiriladi**.
4. **Buyurtmani bekor qilish faqat 4 holatda mumkin:** "Usta qidirilmoqda", "Navbatdasiz", "Usta topildi", "Usta yo'lda". "Usta yetib keldi", "Ish jarayonida" va undan keyingi barcha holatlarda bekor qilish tugmasi **umuman chizilmaydi**.
5. **Bekor qilish sababi majburiy:** 3–500 belgi.
6. **"Bu men chaqirgan usta emas" — qaytarib bo'lmaydigan amal.** Buyurtma "Xavfsizlik tekshiruvida" terminal holatiga o'tadi va undan chiqish yo'li yo'q.
7. **Baholash faqat "Ish yakunlandi" holatida.** Baholangach buyurtma darhol "Yakunlandi" ga o'tadi; baho tahrirlanmaydi va qayta berilmaydi.
8. **Chek faqat yakunlangan buyurtmalarda** ("Ish yakunlandi", "Yakunlandi"). Bekor qilingan va xavfsizlik tekshiruvidagi buyurtmada chek yo'q.
9. **Buyurtma yaratilgach tahrirlanmaydi** — tavsif, manzil, xizmat turi, "Shoshilinch" o'zgartirilmaydi. Faqat bekor qilib, yangisini yaratish mumkin.
10. **Manzil majburiy:** xarita nuqtasi + matnli manzil.
11. **Valyuta bitta — so'm.** Valyuta tanlash, konvertatsiya, ikkinchi valyuta yo'q.
12. **Foydalanuvchi profili tahrirlanmaydi** — ism, telefon, avatar, manzillar ro'yxati o'zgartirilmaydi.
13. **Usta joylashuvi mijozga berilmaydi** — xaritada ustaning real-vaqt harakati ko'rsatilmaydi.
14. **Login majburiy.** Login qilmagan foydalanuvchi faqat xizmat turlari ro'yxatini (narxlari bilan) ko'ra oladi.
15. **Buyurtma holati orqaga qaytishi mumkin:** usta javob bermasa, "Usta topildi" ekrani yana "Usta qidirilmoqda" ga qaytadi. Bu xato emas — oqimning normal qismi.
16. **Katalog ikki qavatli:** guruh ("Elektrik xizmatlari") → xizmat ("Rozetka o'rnatish"). Buyurtma har doim **xizmatga** beriladi, guruhga emas — narx va murakkablik xizmat darajasida yashaydi. Guruhning o'zini buyurtma qilib bo'lmaydi. Guruh ikonasi server bergan `iconKey` kaliti orqali ilova ichidagi vektor to'plamdan tanlanadi — rasm URL emas, shuning uchun ikona temaga qarab rangini o'zgartiradi.
17. **Terminal bo'lmagan holatlar oltita:** "Usta qidirilmoqda", "Navbatdasiz", "Usta topildi", "Usta yo'lda", "Usta yetib keldi", "Ish jarayonida", shuningdek "Ish yakunlandi — baholang". Terminal holatlar uchtasi: "Yakunlandi", "Bekor qilindi", "Xavfsizlik tekshiruvida".

---

## 2. REFERENS RASMLARDAN NIMA OLINADI / NIMA OLINMAYDI

### 2.1. Referensdan OLINADI (qonun)

1. Vertikal ritm va bloklar tartibi: status bar → header → qidiruv paneli → banner → xizmat turlari gridi → ro'yxat → pastki navigatsiya.
2. Komponent anatomiyasi: grid elementi = doira + ichida outline ikona + ostida bir qatorli yorliq; usta kartasi = kvadrat avatar + ism + kasb + reyting.
3. Ikki temaning tuzilish farqi: **Light** temada tepada dekorativ turkuaz blok bor — u status bar, header va qidiruv panelining orqasidan o'tib, banner ustida tugaydi; qidiruv paneli **oq** to'ldirilgan holda uning ustida soya bilan "suzadi". **Dark** temada bu blok yo'q, fon bir tekis to'q.
4. Xizmat turlari gridi: 4 ustun × 2 qator.
5. Kartalarning yumshoq, yumaloq burchakli, havodor xarakteri.

### 2.2. Referensdan OLINMAYDI — va sababi

| Referensda | Bizda nima bo'ladi | Sababi |
|---|---|---|
| Barcha inglizcha matnlar (Good Morning, Search for services, NEED HELP?, Book Now, Popular Services, Plumber…) | 8-bo'limdagi matn jadvali bo'yicha **o'zbekcha** matnlar | Ilova to'liq o'zbek tilida; server ham o'zbekcha matn yuboradi, aralash til bitta ro'yxatda ko'rinib qoladi |
| "Recommended for you" — 2 ta usta kartasi + "Book Now" | O'rniga: **"Aktiv buyurtmangiz"** kartasi, aktiv buyurtma bo'lmasa **"So'nggi buyurtmalaringiz"** (2 ta karta) | Ustalar katalogi mavjud emas — tizim ustani o'zi tayinlaydi, mijoz tanlamaydi |
| Light temada yulduz turkuaz rangda | Yulduz **ikkala temada ham amber** (dark `#FFC24B`, light `#D97706`) | Turkuaz = interaktiv/aksent semantikasi. Reyting — read-only ma'lumot, u "bosiladigan" degan yolg'on signal bermasligi kerak |
| Light temada yorqin turkuaz ustida **oq** matn | Yorqin turkuaz ustida matn va ikona **`#04302F`** | Oq yorqin turkuaz ustida WCAG AA talabini bajarmaydi |
| Grid qat'iy 8 ta, inglizcha kasb nomlari | Grid **dinamik** va **xizmat guruhlarini** ko'rsatadi: elementlar soni, nomlari, ikona kaliti va tartibi serverdan keladi (`sortOrder` bo'yicha — UI qayta saralamaydi) | Taksonomiya admin paneldan boshqariladi; yangi guruh qo'shilsa ilova yangilanishisiz paydo bo'lishi kerak |
| — | Karta radiusi faqat 6.2-banddagi shkaladan olinadi | — |
| — | Rang faqat 3-bo'limdagi token jadvalidan olinadi — hujjatda yo'q hech qanday hex ishlatilmaydi | — |
| "Messages" tabi | Pastki navigatsiyaning 3-bo'limi — **"Bildirishnomalar"** | Chat moduli mavjud emas |

### 2.3. Referensda YO'Q, LEKIN MAJBURIY

"Shoshilinch" toggle, status chiplari, 5 bosqichli stepper, bloklovchi tasdiqlash ekrani, xavfsizlik ekrani, skeleton/bo'sh/xato holatlari, kirish (OTP) oqimi, manzil oqimi.

---

## 3. DIZAYN TIZIMI — RANG TOKENLARI

Quyidagi ro'yxatdan **tashqari hech qanday rang ishlatilmaydi**. Har bir token Figma'da Color Variable sifatida yaratiladi, ikkita mode: `Dark` va `Light`.

### 3.1. Dark mode

```
color/surface            #0E2B2C   ekran foni
color/surface-elevated   #123738   karta foni (e1)
color/surface-raised     #16403F   suzuvchi element foni (e2)
color/surface-modal      #1A4A48   modal / bottom sheet foni (e3)
color/surface-sunken     #12403F   input, qidiruv paneli, ichki blok
color/surface-hero       #1C6B6B   banner
color/category-circle    #1B7070   grid doirasi
color/primary            #2DD4BF
color/primary-pressed    #22B8A6
color/on-primary         #04302F   primary ustidagi matn/ikona
color/primary-deep       #0B7C7B   oq matnli tugma foni
color/on-primary-deep    #FFFFFF
color/border             #1E4F4E
color/border-strong      #2A6A68
color/text-primary       #F2FAFA
color/text-secondary     #9BB8B8
color/text-disabled      #5F7C7C
color/success            #34D399
color/warning            #FBBF24
color/danger             #FCA5A5   (matn)
color/danger-fill        #DC2626   (tugma foni)
color/star               #FFC24B
color/star-empty         #3A5A5A
color/shadow             #062C2C   soya asos rangi (Dark'da ishlatilmaydi)
color/overlay            rgba(0,0,0,0.60)
```

### 3.2. Light mode

```
color/surface            #FFFFFF
color/surface-elevated   #FFFFFF   (+ soya, 6.3-bandga qara)
color/surface-raised     #FFFFFF   (+ e2 soya)
color/surface-modal      #FFFFFF   (+ e3 soya)
color/surface-sunken     #F1F7F7
color/surface-hero       #1EC8C8   tepadagi dekorativ turkuaz blok
color/surface-hero-deep  #1C7A7A   banner
color/category-circle    #FFFFFF   (+ e2 soya)
color/primary            #10A3A0
color/primary-pressed    #0B7C7B
color/on-primary         #04302F
color/primary-deep       #0B7C7B
color/on-primary-deep    #FFFFFF
color/border             #E2ECEC
color/border-strong      #C7DADA
color/text-primary       #04302F
color/text-secondary     #5C7A7A
color/text-disabled      #9AB0B0
color/success            #047857
color/warning            #92400E
color/danger             #DC2626
color/danger-fill        #DC2626
color/star               #D97706
color/star-empty         #D6E3E3
color/shadow             #062C2C   barcha soyalarning asos rangi
color/overlay            rgba(4,48,47,0.45)
```

### 3.3. Canvas foni (frame'lardan tashqarida)

Dark to'plam ostida `#7FA5A5`, Light to'plam ostida `#E6F7F7`.

### 3.4. Rang qo'llash qoidalari

- Ekran foni — faqat `surface`. Karta foni — faqat `surface-elevated`. Ajratuvchi chiziq — faqat `border`.
- Yangi hex kiritish **taqiqlanadi**. Rang kerak bo'lsa, avval token jadvaliga qo'shiladi.
- Bu qoida soya va chegara ranglariga ham tegishli — ular ham token orqali beriladi. **Yagona istisno:** Dark temadagi oq chegaralarning opacity qiymatlari (6% / 8% / 10%).
- Amber (`star`) **faqat** reyting yulduzlari uchun. Banner, badge, ikona yoki tugmada amber ishlatilmaydi.

---

## 4. KONTRAST QOIDALARI (majburiy, har bir frame'da)

1. Yorqin teal (`#1EC8C8`, `#2DD4BF`, `#10A3A0`) ustiga **oq matn ishlatilmaydi**. Bu fonlarda matn va ikona rangi = `#04302F`.
   `#04302F` / `#1EC8C8` = 6,9:1 · `#04302F` / `#2DD4BF` = 8,2:1 · `#04302F` / `#10A3A0` = 4,6:1
2. Oq matn faqat to'q teal ustida: `#0B7C7B` (5,0:1), `#1C7A7A` (5,1:1), `#1C6B6B` (6,2:1) va undan to'qroq.
3. Light temadagi tepa turkuaz blokda "Xayrli tong", ism va qo'ng'iroq ikonasi `#04302F` rangda chiziladi.
4. Matn kontrasti: asosiy matn ≥ 4,5:1; 18px+ yoki 16px bold matn ≥ 3:1; ma'noli ikona va chegara ≥ 3:1.
5. Disabled matn kontrast talabidan ozod, lekin disabled tugma yonida **har doim** tushuntiruvchi matn bo'ladi.
6. Har bir frame yonida kichik izoh: qaysi rang juftligi ishlatilgan va nisbati qancha.

---

## 5. TIPOGRAFIKA

Shrift: **Inter** (fallback: SF Pro). Format — `o'lcham / line-height / weight`. Bu shkaladan tashqari hech qanday shrift qiymati ishlatilmaydi.

```
display     32/38/700   baholash ekrani, chekdagi jami summa
h1          28/34/700   ekran sarlavhasi
h2          22/28/700   bo'lim sarlavhasi, OTP kataki
h3          18/24/600   karta ichidagi ism, modal sarlavhasi
body-lg     16/24/400   asosiy matn, input qiymati
body        15/22/400   tavsif, ikkilamchi matn
body-sm     13/18/400   yordamchi va xato matni
caption     12/16/500   vaqt, meta, stepper yorlig'i
tab-label   11/14/500   pastki navigatsiya yozuvlari
overline    11/14/600   tracking +0.6px, CAPS
button      16/20/600   tracking 0
button-sm   14/18/600   kichik tugma (h=36)
price       18/24/700   tabular figures
currency    14/20/500   narx yonidagi "so'm"
numeric-sm  14/20/600   reyting raqami, tabular figures
mono        14/20/500   tracking +0.4px, tabular figures — faqat texnik identifikatorlar
                        (signal raqami, buyurtma raqami). Shrift: Inter'ning tabular
                        figures varianti; alohida monospace oila kiritilmaydi.
```

**Qoidalar:**
- Sarlavhalarda tracking −0.2px.
- Karta ichidagi matn maksimum 2 satr, keyin "…".
- Tugma matni bir satr, gorizontal padding 20px. Matn sig'masa tugma balandligi emas, shrift `button-sm` ga tushadi.
- O'zbekcha matn inglizchadan ~25–30% uzunroq. Har bir tugmada minimum 24px zaxira kenglik qoldiriladi va barcha yorliqlar **eng uzun o'zbekcha variantda** tekshiriladi.

---

## 6. SPACING, RADIUS, ELEVATSIYA, IKONALAR

### 6.1. Spacing shkalasi (4px asos)

`2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64` — bu ro'yxatdan tashqari qiymat yo'q (13, 15, 18, 22px **taqiqlanadi**).

Bu shkala **tashqi bo'shliqlar (padding, margin, gap)** uchun. Chegara qalinligi, nuqta/halqa diametri va komponent ichki o'lchamlari alohida belgilanadi va faqat shu hujjatda ko'rsatilgan qiymatlarda bo'ladi.

```
Ekran gorizontal padding        20px (barcha ekranda bir xil)
Status bar                      54px
Header balandligi               56px
Header ostidagi bo'shliq        20px
Bo'limlar orasi                 24px
Bo'lim sarlavhasi → kontent     12px
Karta ichki padding             16px
Ro'yxat elementlari orasi       12px
Grid gutter                     12px, qatorlar orasi 20px
Ikona ↔ matn                    8px
Bottom tab bar                  56px + 34px home indicator
Kontent pastdan zaxira          90px
Minimal teginish maydoni        44×44px
```

### 6.2. Radius shkalasi

```
radius/xs    8px    kvadrat avatar, kichik tugma (h≤36), thumbnail
radius/sm    12px   kichik karta, ro'yxat elementi, banner ichidagi blok
radius/md    14px   qidiruv paneli, barcha input/textarea, OTP kataki, asosiy tugma (h=52)
radius/lg    16px   kontent kartalari (usta kartasi, banner, chek bloki, bildirishnoma)
radius/xl    24px   faqat bottom sheet va modal — yuqori ikki burchak; pastki burchaklar 0
radius/full  999px  grid doirasi, dumaloq avatar, status chip, badge, segment, progress bar
```

Bitta ekranda ko'pi bilan 3 xil radius. Ichma-ich joylashganda: ichki radius = tashqi radius − padding.

### 6.3. Elevatsiya — ikki tema, ikki mexanizm

**Light — soya (asos rang: `color/shadow`):**
```
e0  soya yo'q                                    ro'yxat elementlari
e1  0 1px 2px   color/shadow 6%                  karta
e2  0 4px 12px  color/shadow 8%                  suzuvchi qidiruv paneli, grid doiralari
e3  0 12px 24px color/shadow 10%                 bottom sheet, modal, sticky pastki panel
```

**Dark — soya EMAS, fon zinapoyasi + ingichka chegara:**
```
e0  color/surface                                            ekran foni
e1  color/surface-elevated + 1px rgba(255,255,255,0.06)       karta
e2  color/surface-raised   + 1px rgba(255,255,255,0.08)       suzuvchi element
e3  color/surface-modal    + 1px rgba(255,255,255,0.10)       modal / bottom sheet
```
Dark temada soya faqat bitta joyda: modal ostidagi overlay. Bir ekranda ko'pi bilan 2 daraja elevatsiya; e3 faqat modal/sheet uchun.

### 6.4. Ikona uslubi

Lucide/Feather uslubi, faqat outline. Grid 24×24px, ichki chizma maydoni 20×20 (har tomondan 2px optik padding). Stroke **1.75px** (20px ikona uchun 1.5px, 28px uchun 2px). Fill yo'q. Round cap, round join. Ikona ichidagi burchak radiusi 2px.

```
Kontent ikonasi                text-secondary
Aksent/faol ikona              primary
Grid doirasi ichida            Dark: #FFFFFF · Light: primary
Grid doirasi                   72px diametr, ikona 28px markazda
Bottom tab ikonasi             24px; faol = primary + 2px stroke, nofaol = text-secondary + 1.75px
```
Faol tab ikonasi to'ldirilmaydi — faqat rang va yorliq weight (500 → 600) o'zgaradi. Barcha ekranlarda bitta ikona oilasi ishlatiladi; fill va outline aralashtirish taqiqlanadi.

---

## 7. FRAME VA CHIQISH SPETSIFIKATSIYASI

```
Frame o'lchami        393 × 852px (iPhone 15 Pro) — barcha frame aynan shu
Safe area             tepadan 54px, pastdan 34px, chapdan/o'ngdan 20px
Grid                  4 ustun, gutter 12px, margin 20px
Status bar            9:41, to'liq signal / wifi / batareya
Frame nomi            "12 · Usta qidirilmoqda · Dark"
                      "12 · Usta qidirilmoqda · Light"
                      (raqam · o'zbekcha nom · tema)
Raqam manbai          FAQAT 11-bo'limdagi ekran raqami. Raqamni o'zgartirish,
                      qayta tartiblash yoki yangi raqam o'ylab topish taqiqlanadi.
                      Bir ekranning Dark va Light varianti AYNAN bir xil raqam va
                      bir xil nom oladi.
Holat variantlari     nomga qo'shimcha suffiks bilan: "12 · Usta qidirilmoqda · Operator · Dark",
                      "23 · Buyurtma tafsiloti · Bekor qilingan · Light"
Joylashuv             Dark qator tepada, Light qator 240px pastda; bir xil ekran
                      ikki variant bir-birining ustida turadi; frame'lar orasi 120px
Frame izohi           har bir frame tagida: qaysi buyurtma holati va ekran vazifasi
```

Auto-layout barcha kartalar, ro'yxatlar, tugmalar va formalarda **majburiy**. Ekranlarda komponentlar faqat instance sifatida ishlatiladi — detach qilingan nusxa bo'lmasin.

---

## 8. TIL, MATN VA FORMAT QOIDALARI

### 8.1. Glossariy — sinonim ishlatish taqiqlanadi

Bu jadval **foydalanuvchi ko'radigan matnlarga** tegishli. Spetsifikatsiya ichida texnik nom sifatida "kategoriya grid", "kategoriya doirasi", "kategoriya ikonasi" ishlatilishi mumkin — bu nomlar maketdagi matnga chiqmaydi.

| Tushuncha | Yagona atama | Taqiqlangan variantlar | Sababi |
|---|---|---|---|
| Ijrochi | **usta** (ko'plik: ustalar) | mutaxassis, expert, professional, xodim, ishchi | Server matnlari aynan "Usta topildi", "Usta yo'lga chiqdi" deydi — ikkala atama bitta ekranda yonma-yon turadi |
| Ish birligi | **buyurtma** | chaqiruv, ariza, so'rov, zayavka | Server "Buyurtma bekor qilindi", "Buyurtma topilmadi" deydi |
| Xizmat guruhi | **xizmat turi** | kategoriya, servis, yo'nalish | — |
| Yordam | **qo'llab-quvvatlash xizmati** | support, yordam markazi | Server matni: "…qo'llab-quvvatlash xizmatiga murojaat qiling" |
| Mijoz bahosi | **baho / baholash** | reyting berish, otziv | — |
| Ustaning ko'rsatkichi | **reyting** (raqam) | — | — |

**Yagona istisno:** fe'l sifatida "chaqirish" faqat bitta joyda — asosiy CTA **"Ustani chaqirish"**. Boshqa hamma joyda harakat "buyurtma berish".

**Qo'llab-quvvatlash yozuvi bitta shaklda qotirilgan:** tugma matni — **"Qo'llab-quvvatlashga murojaat"**, ekran sarlavhasi — **"Qo'llab-quvvatlash xizmati"**. Boshqa variantlar ("Qo'llab-quvvatlashga yozish", "Qo'llab-quvvatlash bilan bog'lanish", yolg'iz "Qo'llab-quvvatlash") ishlatilmaydi.

### 8.2. Matn jadvali — YAGONA ruxsat etilgan matnlar manbai

Referens rasmdagi inglizcha matnni **ko'chirma**, shu jadval bo'yicha almashtir. Jadvalda yo'q hech qanday inglizcha so'z (Home, Book Now, Search, Rating, Receipt, ETA, Loading) maketda paydo bo'lmasin. "ETA" ham yozilmaydi — o'rniga **"Taxminiy vaqt"**.

**Qoida:** ekranlarda faqat shu jadvaldagi matnlar ishlatiladi; yangi yozuv kerak bo'lsa, avval jadvalga qo'shiladi.

**Pastki navigatsiya:** Bosh sahifa · Buyurtmalarim · Bildirishnomalar · Profil

**Header salomlashuvi:** Xayrli tong, / Xayrli kun, / Xayrli kech,

**Bo'lim sarlavhalari:** Xizmat turlari · Aktiv buyurtmangiz · So'nggi buyurtmalaringiz

**Banner:** YORDAM KERAKMI? · Ishonchli ustani toping

**Grid yorliqlari — bular xizmat GURUHLARI (faqat maket uchun placeholder, real nomlar serverdan keladi):** Elektrik xizmatlari · Santexnika · Gaz uskunalari · Maishiy texnika · Duradgorlik · Bo'yoqchilik · Tozalash · Barchasi

Guruh nomi ikki so'zdan iborat bo'lishi mumkin — yorliq **ikki qatorgacha** o'ralsin, uchinchi qatorda "…" bilan kesilsin. Grid katakchasining balandligi eng uzun yorliqqa qarab belgilanadi va barcha katakchalarda bir xil bo'ladi.

**Ekran sarlavhasi (header) va ekran ichidagi `h1` — ikki xil shakl.** Header — ot shakli, `h1` — buyruq shakli. Ikkalasi ham shu jadvalda:

| № | Header (ot shakli) | Ekran ichidagi `h1` |
|---|---|---|
| 03 | Telefon raqami | Telefon raqamingizni kiriting |
| 04 | Tasdiqlash kodi | Tasdiqlash kodi |
| 05 | — | Hisobingiz bloklangan |
| 07 | Barcha xizmatlar | — |
| 07a | (guruh nomi) | — |
| 08 | Buyurtma berish | — |
| 09 | Manzilni tanlang | — |
| 10 | Manzil tafsilotlari | — |
| 11 | Buyurtmani tasdiqlash | Buyurtmani tasdiqlang |
| 12 | Buyurtma | — |
| 13 | Buyurtma | — |
| 14 | Buyurtma | — |
| 15 | Buyurtma | — |
| 16 | — | (usta ismi) |
| 18 | Buyurtma | — |
| 19 | Buyurtma | Ishni baholang |
| 20 | Chek | — |
| 21 | — | Signalingiz qabul qilindi |
| 22 | — | Buyurtma bekor qilindi |
| 23 | Buyurtma tafsiloti | — |
| 24 | Buyurtmalarim | — |
| 25 | Bildirishnomalar | — |
| 26 | Profil | — |
| 27 | Usta profili | — |
| 30 | Qo'llab-quvvatlash xizmati | — |

**Tugmalar:** Ustani chaqirish · Davom etish · Bekor qilish · Ha, shu usta · Yo'q, bu boshqa odam · Qo'ng'iroq qilish · Qo'llab-quvvatlashga murojaat · Ishni baholash · Bahoni yuborish · Chekni ko'rish · Qayta buyurtma berish · Kodni qayta yuborish (00:59) · Yangi kod so'rash · Barchasini o'qilgan deb belgilash · Barchasini ko'rish · Barcha xizmatlarni ko'rish · Shu yerda · Mening joylashuvim · O'zgartirish · Saqlash · Qayta urinish · Yangilash · Chiqish · Kuzatish · Tasdiqlash · Orqaga · Yopish · Ha, bekor qilish · Yo'q · Ruxsat berish · Keyinroq · Sozlamalarni ochish · Manzilni qo'lda kiritish · Bosh sahifaga · Buyurtmalarimga qaytish

**Tugma ichidagi holat matni:** Yuborilmoqda…

**Placeholder'lar:** Xizmat qidirish · Manzilni qidirish · Masalan: oshxonadagi kran oqmoqda… · Manzil · Masalan: 2-kirish · Qavat · Xonadon · Izoh (ixtiyoriy)

**Toggle:** Shoshilinch

**Baho yorliqlari:** Yomon · Qoniqarli · Yaxshi · Juda yaxshi · Ajoyib

**Bekor qilish sabab chiplari:** Fikrimdan qaytdim · Juda uzoq kutdim · Muammo o'zi hal bo'ldi · Narx to'g'ri kelmadi · Boshqa sabab

**Bo'sh holatlar:** "Hozircha buyurtmalaringiz yo'q" / "Birinchi buyurtmangizni bering" · "Bildirishnomalar yo'q" / "Buyurtma bergach, holat o'zgarishlari shu yerda ko'rinadi" · "Hech narsa topilmadi" · "Internetga ulanish yo'q"

**Yuklanish matnlari:** "Yuklanmoqda…" · "Usta qidirilmoqda…" · "Hisoblanmoqda" (taxminiy vaqt mavjud bo'lmaganda)

**O'z xato matnlarimiz:** "Telefon raqamini +998 XX XXX XX XX formatida kiriting" · "Kamida 10 belgi" · "Kamida 5 belgi kiriting" · "Maksimum 10 ta fayl" · "Juda ko'p urinish. Bir oz kuting va qayta urinib ko'ring." · "Juda ko'p urinish. 5 daqiqadan keyin qayta urinib ko'ring." · "Server javob bermadi. Qayta urinib ko'ring." · "Xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring." · "Xavfsizlik sababli barcha sessiyalar yopildi. Qaytadan kiring." · "SMS yuborishda xatolik. Kod kelmasa, taymer tugagach qayta so'rang." · "Buyurtma holati yangilandi" · "Aloqa tiklanmoqda…" · "Yangilanishlar to'xtadi"

### 8.3. Header salomlashuvi — 3 vaqt varianti, 2 ism holati

```
05:00–11:59 → "Xayrli tong,"
12:00–17:59 → "Xayrli kun,"
18:00–04:59 → "Xayrli kech,"
```
- **Ism bor:** ikkinchi qatorda bold katta ism — "Jasur".
- **Ism yo'q:** ikkinchi qatorda qisman yashirilgan telefon raqami — "+998 90 *** ** 67". Xuddi shu maska 26-ekranda ham ishlatiladi. **Istisno:** 04-ekranda raqam to'liq ko'rsatiladi ("+998 90 123 45 67") — foydalanuvchi qaysi raqamga kod kelganini tekshira olishi kerak.
- Avatar: rasm mavjud emas — ism bosh harfi `primary` fonda; ism ham yo'q bo'lsa neytral shaxs ikonasi.
- "Xayrli tong, Foydalanuvchi" kabi to'ldiruvchi so'z **ishlatilmaydi**.

### 8.4. Narx formati

```
Shakl                   150 000 so'm     (mingliklar — probel, kasr YO'Q, "so'm" kichik harf)
Oraliq                  80 000 – 150 000 so'm
Tipografika             raqam: price 18/24/700 tabular figures
                        "so'm": currency 14/20/500 text-secondary
Xizmat turi va bosh sahifada     "taxminan 150 000 so'm"  yoki  "150 000 so'mdan"
Chekda va buyurtma tafsilotida   aniq:  "150 000 so'm"
```
**Taqiqlanadi:** `UZS`, `сум`, `150,000`, `150.000`, `150K`, `1,2 mln`, `so'm 150 000`, tiyin/kasr qism, narx yonida `~` belgisi.

### 8.5. Sana, vaqt, raqam formati

```
Vaqt                24 soatlik: "14:30". AM/PM taqiqlanadi (status bardagi "9:41" — tizim elementi, istisno)
Bugun / kecha       "Bugun, 14:30" · "Kecha, 09:15"
Shu yil ichida      "5-sentabr, 14:30"
O'tgan yillar       "2025-yil 5-sentabr, 14:30"
Qisqa (ro'yxat)     "05.09.2026"
Muddat              "15 daqiqa", "~15 daqiqa", "1 soat 20 daqiqa"  ("min", "daq", "15m" taqiqlanadi)
Navbat              "~3-o'rin"  yoki  "Navbatdagi o'rningiz: 3"
Sana yo'q           "—"  ("N/A" emas)
O'nlik ajratkich    VERGUL — butun promptda bitta qoida
Reyting             bitta kasr xona: "4,8"  (server 4.75 bersa ham UI 4,8 ko'rsatadi)
```
`~` belgisi faqat vaqt va navbat o'rni uchun; narx yonida ishlatilmaydi.
Oy nomlari kichik harf bilan: yanvar, fevral, mart, aprel, may, iyun, iyul, avgust, sentabr, oktabr, noyabr, dekabr.
Hafta kunlari: dushanba, seshanba, chorshanba, payshanba, juma, shanba, yakshanba.

### 8.6. Orfografiya

Barcha o'zbek matnlarida apostrof uchun **aynan `'` (ASCII U+0027)**: o', g', ', ya'ni, ma'lumot, so'm, yo'lda.
`ʻ`, `ʼ`, `'`, `'`, `` ` `` — **taqiqlanadi**. Sababi: server yuboradigan matnlar aynan shu belgi bilan yozilgan va UI da o'zgartirilmasdan ko'rsatiladi; ikki xil apostrof bitta ro'yxatda ko'rinib qoladi. Barcha matnlar lotin yozuvida, kirill yo'q.

Matn ichida iqtibos uchun faqat «…» ishlatiladi; `'` faqat harf sifatida.

---

## 9. KOMPONENTLAR KUTUBXONASI

29 ta komponent, har biri Component Set sifatida. Variantlar Property: `Type`, `State`, `Size`. Ekranlarda faqat shu ro'yxatdagi komponentlar ishlatiladi; yangi variant kerak bo'lsa avval ro'yxatga qo'shiladi.

### 9.1. Tugma — `h=52, radius/md, padding 20, button 16/20/600`

| Variant | Ko'rinishi |
|---|---|
| primary / default | fon `primary`, matn `on-primary` |
| primary / pressed | fon `primary-pressed`, scale 0.98, soya olib tashlanadi |
| primary / disabled | fon `border-strong` 38% opacity, matn `text-disabled` |
| primary / loading | 20px spinner (`on-primary`, 2px stroke) + matn "Yuborilmoqda…"; kenglik o'zgarmaydi |
| secondary | shaffof fon, 1.5px border `primary`, matn `primary` |
| ghost | fon yo'q, matn `primary` |
| destructive | fon `danger-fill`, matn oq (4,83:1) |
| destructive-outline | shaffof fon, 1.5px border `danger`, matn `danger` |
| small | `h=36`, `radius/xs`, matn `button-sm` |

### 9.2. Input — `h=52, radius/md, padding 16`

`empty` (fon `surface-sunken`, 1px `border`, placeholder `text-secondary`) · `filled` · `focus` (2px `primary` border + tashqi 4px `primary` 20% halqa) · `error` (2px `danger` border, ostida 6px pastda `body-sm` `danger` matn) · `disabled`.

**Textarea:** min balandlik 120px, ichida pastki o'ngda belgilar hisoblagichi `caption` `text-secondary`.

### 9.3. Qidiruv paneli
`h=56, radius/md`. Chapda placeholder "Xizmat qidirish", o'ngda 20px lupa ikonasi. Light temada oq to'ldirilgan + e2 soya, turkuaz blok ustida suzadi. Dark temada fon `surface-sunken`.

### 9.4. Karta
`default`: `surface-elevated`, `radius/lg`, 1px `border` · `pressed`: overlay (Light `rgba(4,48,47,0.06)`, Dark `rgba(255,255,255,0.06)`), scale 0.99 · `selected`: 2px `primary` border · `skeleton`: `surface-sunken` bloklar, `radius/xs`, shimmer.

### 9.5. Grid elementi
72px doira + ichida 28px outline ikona, ostida 8px, yorliq `caption`, markazlashgan, maksimum 2 satr.

### 9.6. Xizmat turi kartasi
Chapda 44px doira ikona, o'ngda: nomi (`h3`), ostida tavsif (`body-sm` `text-secondary`, **null bo'lishi mumkin — layout busiz ham buzilmasin**), o'ng chekkada "taxminan 150 000 so'm".

### 9.7. Usta kartasi
64px avatar (9.28-komponent) · ism `h3` · kasbi `body` `text-secondary` · badge "Yangi" yoki "Tajribali" · sertifikat belgisi (shield ikona + "Sertifikatli") agar mavjud bo'lsa · yulduz + reyting "4,8" · "142 ta buyurtma bajargan".
**Kartada "Book Now"/"Buyurtma berish" tugmasi YO'Q** — usta tanlanmaydi.

### 9.8. Buyurtma kartasi (ro'yxat elementi)
Chapda 44px xizmat turi ikonasi · o'ngda: xizmat nomi (`h3`), sana (`caption`), narx (`price`) · yuqori o'ngda status chipi · eng o'ngda shevron.

### 9.9. Status chipi
`h=28, radius/full, padding 12px`, matn `12/16/500`, chapda 6px diametr nuqta. Fon = rang 14% opacity, matn = to'liq rang. 10 ta variant — 10-bo'limga qara.

### 9.10. Toggle ("Shoshilinch")
`w=52 h=32 radius/full`. Off = `border-strong` fon; On = `primary` fon; knob 28px oq + soya `0 1px 2px` `color/shadow` 20%. **Default holati — o'chiq.**

### 9.11. Yulduzli reyting
Read-only: ro'yxatda 14px, usta profilida 18px. Interaktiv (baholash ekrani): 40px, oraliq 8px. To'ldirilgan = `star`, bo'sh = `star-empty` (to'ldirilgan, kontur emas). Reyting raqami — **yulduz rangida emas**, `text-primary`, `numeric-sm`, yulduzdan 4px o'ngda.

### 9.12. Badge
"Yangi" — `border-strong` fon, `text-secondary` matn. "Tajribali" — `success` 14% fon, `success` matn. "Sertifikatli" — `primary` 14% fon, `primary` matn + 14px shield ikona. `h=24, radius/full, padding 10px`, matn `11/14/600`.

### 9.13. Bildirishnoma qatori
Chapda 40px doira ikona (turga mos rang) · o'ngda sarlavha (`body-lg`/600) + matn (`body-sm` `text-secondary`, 2 satrgacha) + nisbiy vaqt (`caption`). O'qilmagan: yengil `primary` 6% fon + chap chekkada 6px `primary` nuqta.

### 9.14. Pastki navigatsiya
`h=56` + 34px home indicator zonasi. 4 element: Bosh sahifa · Buyurtmalarim · Bildirishnomalar · Profil. Ikona 24px + `tab-label`. Bildirishnomalar ikonasida o'qilmaganlar soni badge (`danger-fill` fon, oq matn, 18px doira, 99+ da "99+").

### 9.15. Header
`h=56`. Chapda 44px avatar, yonida 12px, ikki qatorli matn (salomlashuv `body-sm` + ism `h2`), o'ng chekkada 24px qo'ng'iroq ikonasi + badge.
Ichki ekranlarda: chapda 24px orqaga strelka, markazda ekran sarlavhasi (`h3`), o'ngda ixtiyoriy amal.

### 9.16. Stepper (buyurtma bosqichlari) — 10-bo'limga qara

### 9.17. Bottom sheet / modal
`radius/xl` yuqori burchaklar, e3, tepada 36×4px `border-strong` "grabber", padding 20px, ostida `overlay`.

### 9.18. Banner (inline)
`radius/sm`, chapda 4px vertikal chiziq, fon = rang 12% opacity, padding 16px. 3 variant: `info` (`primary`), `warning` (`warning`), `danger` (`danger`).

### 9.19. Taymer/ma'lumot chipi
`h=32, radius/full, padding 12px`, chapda 16px ikona, matn `body-sm`/600. Ishlatilishi: "Taxminiy vaqt: 15 daqiqa", "~3-o'rin", "Shoshilinch".

### 9.20. Bo'sh holat va skeleton bloki — 12-bo'limga qara

### 9.21. OTP kod kataki
`w=48, h=56, radius/md`, matn `h2` markazda, tabular figures. Holatlar: `empty` (fon `surface-sunken`, 1px `border`) · `filled` (2px `border-strong`) · `focus` (2px `primary` + 4px `primary` 20% halqa) · `error` (2px `danger`, shake) · `disabled`. Kataklar orasi 8px, 6 ta katak bitta auto-layout qatorida.

### 9.22. Segment control
`h=40, radius/full`, fon `surface-sunken`, ichida tanlangan segment `surface-elevated` + e1 (Light) / `border-strong` chegara (Dark), matn `body-sm`/600 tanlanganda `text-primary`, tanlanmaganda `text-secondary`/400. Gorizontal scroll agar 4 element sig'masa.

### 9.23. Chiziqli progress bar
`h=6, radius/full`, fon `border`, to'ldirish `primary`. Maksimum 92% (hech qachon 100% emas). Indeterminate varianti: 30% kenglikdagi `primary` blok chapdan o'ngga 1.4s.

### 9.24. Qadam indikatori (3 nuqta)
08–11 ekranlar uchun: 3 ta 8px doira, orasi 8px, bajarilgan/joriy `primary`, kelgusi `border`; ostida 8px, joriy qadam nomi `caption` `text-primary`/600. Bu 9.16 stepperdan ALOHIDA komponent, aralashtirilmaydi.

### 9.25. Toast / snackbar
`h=48, radius/sm`, e3, kenglik = ekran − 40px, tab bar ustida 12px, matn `body-sm`, 3 soniya. Variantlar: `neutral` (`surface-elevated`), `success`, `danger`.

### 9.26. Suzuvchi holat banneri
12.4-band uchun: `h=36`, to'liq kenglik, kontentni surmaydi (ustidan suzadi), chapda 16px ikona/spinner, matn `body-sm`. Variantlar: `reconnecting` (`surface-sunken` fon, `text-secondary`) · `stalled` (`warning` 14% fon, `warning` matn + ghost "Yangilash").

### 9.27. Tanlanadigan chip
28-ekrandagi sabab chiplari: `h=36, radius/full, padding 16px`, matn `body-sm`. Holatlar: `default` (1px `border`, `text-secondary`) · `selected` (2px `primary`, `primary` 12% fon, `primary` matn) · `pressed`.

### 9.28. Avatar
O'lchamlar: 44 (header, karta), 64 (usta kartasi), 80 (profil), 120 (usta profili, 16-ekran). `radius/full`. Variantlar: `image` · `initial` (ism bosh harfi, fon `primary`, matn `on-primary`, shrift = o'lcham/2, weight 600) · `icon` (neytral shaxs ikonasi, fon `surface-sunken`, ikona `text-secondary`).

### 9.29. Radar animatsiya bloki
12-ekran uchun: 88px doira, 3 ta kengayuvchi `primary` halqa (opacity 24% → 0%, 2s, 0.6s siljish bilan), markazda 32px ikona. Statik varianti ham bo'lsin (operator holati uchun: animatsiya yo'q, 64px operator ikonasi).

---

## 10. STATUS TIZIMI

### 10.1. 5 bosqichli stepper

Ekranning yuqorisida, header ostida, gorizontal. Balandligi 56px, gorizontal padding 20px.

Bosqichlar: **Qabul qilindi → Usta topildi → Yo'lda → Ish jarayonida → Yakunlandi**

- Bajarilgan nuqta: 16px, `primary` to'ldirilgan + 10px oq check ikona.
- Joriy nuqta: 16px, `primary` to'ldirilgan + tashqi 4px `primary` 24% halqa, sekin pulsatsiya.
- Kelgusi nuqta: 12px, `border` rangida to'ldirilgan.
- Bog'lovchi chiziq: 2px; bajarilgan qism `primary`, qolgani `border`.
- Yorliq: `caption`, nuqta ostida 8px; joriy bosqich `text-primary`/600, qolganlari `text-secondary`/400.

**Status → stepper xaritasi (to'liq, istisnosiz):**

| Ekran / holat | Joriy bosqich |
|---|---|
| Usta qidirilmoqda (12) | 1 — Qabul qilindi |
| Siz navbatdasiz (13) | 1 — Qabul qilindi |
| Usta topildi (14) | 2 — Usta topildi |
| Usta yo'lda (15) | 3 — Yo'lda |
| Ustani tasdiqlang (16) | **stepper CHIZILMAYDI** — bu bloklovchi ekran, 16-band bo'yicha butunlay alohida vizual til |
| Ish jarayonida (18) | 4 — Ish jarayonida |
| Ishni baholang (19) | 4-bosqich bajarilgan, 5-bosqich JORIY holatda (pulsatsiya bilan), lekin hali bajarilgan emas |
| Chek (20) | 5 — Yakunlandi, barcha bosqichlar bajarilgan |
| Buyurtma bekor qilindi (22) | stepper chizilmaydi |
| Xavfsizlik signali (21) | stepper chizilmaydi |

"Qoralama" hech qachon uchramaydi, "Baholandi" esa "Yakunlandi" bilan bir xil ko'rsatiladi — ikkalasi uchun ham alohida bosqich yoki ekran yasalmaydi. "Bekor qilindi" va "Xavfsizlik tekshiruvida" holatlarida stepper o'rniga terminal holat bloki chiziladi.

### 10.2. Status chiplari — aynan 10 ta

| Chip matni | Rang | Qaysi ekranda |
|---|---|---|
| Usta qidirilmoqda | `warning` | Qidiruv ekrani, tarix |
| Navbatdasiz | `warning` | Navbat ekrani, tarix |
| Usta topildi | `primary` | Usta topildi, tarix |
| Usta yo'lda | `primary` | Usta yo'lda, tarix |
| Usta yetib keldi | `warning` | Tasdiqlash ekrani, tarix |
| Ish jarayonida | `primary` | Ish ekrani, tarix |
| Ish yakunlandi — baholang | `success` | Baholash ekrani, tarix |
| Yakunlandi | `success` | Chek, tarix |
| Bekor qilindi | `danger` | Bekor qilingan ekran, tarix |
| Xavfsizlik tekshiruvida | `danger` | Xavfsizlik ekrani, tarix |

**"Qoralama" holati yasalmaydi** — u hech qachon uchramaydi. **"Baholandi" alohida holat sifatida yasalmaydi** — u "Yakunlandi" bilan bir xil ko'rsatiladi.

---

## 11. EKRANLAR

Har bir ekran **Dark va Light** temada chiziladi.

### A. KIRISH OQIMI

**01 · Sessiyani tiklash**
Ko'rinadi: markazda logotip, ostida 24px, `primary` rangdagi 32px spinner. Fon `surface`.
Holatlar: bitta (yuklanmoqda).
Amallar: yo'q.

**Kirish nuqtalari (maketda 01-ekran tagida izoh sifatida ko'rsatiladi):**
1. Oddiy ochilish → token bor bo'lsa 06 Bosh sahifa, yo'q bo'lsa 02 Kirish taklifi.
2. **Push bosilib ochilish (deep-link):** 01-ekran ko'rsatiladi, keyin to'g'ridan-to'g'ri push ichidagi buyurtma ekraniga o'tiladi — bosh sahifa oraliqda ko'rsatilmaydi, lekin orqaga qaytish bosh sahifaga olib boradi.
3. Deep-link havolasi buzuq, buyurtma o'chirilgan yoki begona bo'lsa → 12.3-banddagi "Buyurtma topilmadi" + "Buyurtmalarimga qaytish" ekrani (xato modali EMAS).
4. Buyurtma "Usta yetib keldi" holatida bo'lsa → istalgan kirish nuqtasidan 16-ekran majburan ochiladi.

**02 · Kirish taklifi**
Ko'rinadi: yuqorida qisqa illyustratsiya, `h1` "Ishonchli ustani 15 daqiqada toping", `body` tushuntirish, ostida xizmat turlari ro'yxatining qisqartirilgan ko'rinishi (narxlari bilan — **login'siz ham ko'rinadi**), pastda sticky `primary` tugma "Davom etish".
Holatlar: yuklanmoqda (skeleton ro'yxat) · xato (offline bloki).
Amallar: "Davom etish" → telefon ekrani. Ro'yxatdagi istalgan element bosilsa ham telefon ekraniga o'tadi.

**03 · Telefon raqami**
Ko'rinadi: `h1` "Telefon raqamingizni kiriting", `body` "Tasdiqlash kodi SMS orqali yuboriladi". Input: chapda qotirilgan `+998` prefiksi (`text-secondary`), keyin maska `90 123 45 67`, faqat raqamli klaviatura. Pastda sticky tugma "Davom etish".
Holatlar: bo'sh (tugma disabled) · to'ldirilgan · xato ("Telefon raqamini +998 XX XXX XX XX formatida kiriting", input ostida `danger` matn) · yuborilmoqda (tugma loading) · **SMS yuborilmadi (server xatosi)** — ekran 04 ga o'tadi va u yerdagi `warning` banner bilan ochiladi; foydalanuvchi telefon ekranida qotib qolmaydi.
Amallar: raqam kiritish; 9 xona to'lmaguncha tugma disabled.

**04 · Tasdiqlash kodi**
Ko'rinadi: `h1` "Tasdiqlash kodi", ostida `body` "+998 90 123 45 67 raqamiga yuborildi" (bu ekranda raqam to'liq ko'rsatiladi) + "O'zgartirish" ghost tugmasi. **6 ta OTP kataki** (9.21-komponent), faqat raqamli klaviatura. Ostida `caption` "Kod 5 daqiqa amal qiladi". Pastda ghost tugma "Kodni qayta yuborish (00:59)" — teskari sanoq bilan.
Holatlar:
- default (kataklar bo'sh)
- to'ldirilmoqda (6-raqamda avtomatik yuborish, tugma loading)
- **kod noto'g'ri** — kataklar `error` holatida, shake, ostida server matni
- **kod muddati tugagan** — ostida matn + `secondary` tugma "Yangi kod so'rash"
- **urinishlar tugadi** — kataklar disabled, faqat "Yangi kod so'rash" qoladi
- **juda ko'p urinish** — "Juda ko'p urinish. 5 daqiqadan keyin qayta urinib ko'ring." + taymer
- **SMS yuborilmadi (server xatosi)** — kataklar `default` holatda va FAOL qoladi (kod baribir kelishi mumkin), tepada `warning` banner: "SMS yuborishda xatolik. Kod kelmasa, taymer tugagach qayta so'rang." · "Kodni qayta yuborish" tugmasi **taymer bilan bloklangan holatda** ko'rsatiladi (00:59 dan sanaydi) — "Qayta urinish" tugmasi CHIZILMAYDI
- taymer tugagan (tugma faol: "Kodni qayta yuborish")

Amallar: kod kiritish; kodni qayta yuborish (faqat taymer tugagach).

**05 · Hisob bloklangan**
Ko'rinadi: markazda 64px `danger` ikona, `h1` "Hisobingiz bloklangan", `body` server matni, pastda **faqat** `secondary` tugma "Qo'llab-quvvatlashga murojaat".
Holatlar: bitta.
Amallar: faqat qo'llab-quvvatlash. **Qayta urinish tugmasi yo'q.**

---

### B. ASOSIY EKRANLAR

**06 · Bosh sahifa**
Ko'rinadi (yuqoridan pastga):
1. Status bar
2. Header (8.3-band bo'yicha)
3. Qidiruv paneli — placeholder "Xizmat qidirish". **Bu server qidiruvi emas, faqat mahalliy filtr:** xizmat turlari ro'yxati bir marta to'liq yuklanadi va shu ro'yxat filtrlanadi.
4. Banner (`radius/lg`, `surface-hero` / `surface-hero-deep`): chap yarmida ishchi illyustratsiyasi, o'ng yarmida `h2` "YORDAM KERAKMI?", ostida `body` "Ishonchli ustani toping", ostida `small` tugma "Ustani chaqirish"
5. `h2` "Xizmat turlari" — 4 ustunli grid, 2 qator. Katakchalar **xizmat guruhlari** (`GET /service-groups`), server bergan `sortOrder` tartibida — UI qayta saralamaydi. Ko'rsatiladi: birinchi **7 ta guruh**, 8-katakcha doimo "Barchasi" (uch nuqta ikonasi). Guruhni bosish → **07a Guruh xizmatlari**; "Barchasi" → **07 Barcha xizmatlar**. Guruhlar 7 tadan kam bo'lsa grid bir qatorga qisqaradi (bo'sh katakcha chizilmaydi), "Barchasi" esa har doim oxirgi bo'lib qoladi
6. **Aktiv buyurtma bloki** — 2.2-bandga muvofiq, referensdagi "Recommended for you" o'rniga:
   - Aktiv buyurtma **bor**: `h2` "Aktiv buyurtmangiz" + sticky karta — status chipi, xizmat nomi, ikkinchi darajali qator, narx, `primary` tugma. Karta **terminal bo'lmagan har bir holat uchun bitta variantda** chiziladi (10.2-banddagi chip ro'yxatiga bog'lanadi) — jami 6 variant:

     | Holat | Ikkinchi darajali qator | Tugma |
     |---|---|---|
     | Usta qidirilmoqda | "Usta qidirilmoqda…" | Kuzatish |
     | Navbatdasiz | "~3-o'rin" | Kuzatish |
     | Usta topildi | "Taxminiy vaqt: 15 daqiqa" (yo'q bo'lsa qator yashiriladi) | Kuzatish |
     | Usta yo'lda | "Taxminiy vaqt: 15 daqiqa" (yo'q bo'lsa qator yashiriladi) | Kuzatish |
     | Ish jarayonida | usta ismi | Kuzatish |
     | Ish yakunlandi — baholang | "Ishingiz yakunlandi" | Ishni baholash |

   - **Istisno — "Usta yetib keldi":** bu holatda bosh sahifa umuman ko'rsatilmaydi. Ilova ochilishi bilan 16-ekran ("Ustani tasdiqlang") majburan ochiladi va u yopilmaguncha boshqa ekranga o'tib bo'lmaydi. Maketda buni 06-ekran tagidagi izoh sifatida yozib qo'y.
   - Aktiv buyurtma **yo'q**: `h2` "So'nggi buyurtmalaringiz" + maksimum 2 ta buyurtma kartasi + ghost tugma "Barchasini ko'rish"
   - Buyurtma umuman **yo'q**: bo'sh holat bloki (12.2-band)
7. Pastki navigatsiya

Holatlar: skeleton (header + qidiruv + banner + 8 ta doira + 2 karta) · to'liq · aktiv buyurtmasiz · buyurtmasiz (bo'sh) · offline banner.
Amallar: qidiruv (mahalliy filtr, natijasi — alohida xizmatlar, guruhlar emas) · guruhni tanlash → 07a · "Barchasi" → 07 · aktiv buyurtmani kuzatish · pull-to-refresh · qo'ng'iroq ikonasi → bildirishnomalar.

**07 · Barcha xizmatlar**
Ko'rinadi: header (orqaga + "Barcha xizmatlar") · qidiruv paneli (mahalliy filtr) · barcha xizmat kartalari **tekis ro'yxat** sifatida (9.6-komponent), guruhga bo'linmasdan. Har bir kartada: nomi, tavsifi (**bo'lmasligi mumkin**), "taxminan N so'm".
Holatlar: skeleton (6 ta karta) · to'liq · filtr natijasi bo'sh ("Hech narsa topilmadi" + ghost tugma "Barcha xizmatlarni ko'rish") · offline/xato.
Amallar: qidirish · xizmat turini tanlash → buyurtma berish.

**07a · Guruh xizmatlari**
Ko'rinadi: header (orqaga + **guruh nomi**, masalan "Elektrik xizmatlari") · shu guruhga tegishli xizmat kartalari ro'yxati (9.6-komponent), server bergan tartibda. Qidiruv paneli **yo'q** — guruh ichidagi ro'yxat qisqa.
Holatlar: skeleton (4 ta karta) · to'liq · offline/xato. **Bo'sh holat chizilmaydi** — server xizmati yo'q guruhni umuman qaytarmaydi, shuning uchun bu ekran hech qachon bo'sh bo'lmaydi.
Amallar: xizmat turini tanlash → buyurtma berish · orqaga.
**Maketda har bir xizmatning narxi HAR XIL bo'lsin** (masalan 80 000 / 120 000 / 150 000 so'm) — bir xil narx qatori yagona tarif taassurotini beradi, holbuki har bir xizmatning o'z narxi bor.
**Kartada "oddiy/murakkab ish" belgisi, murakkablik filtri, sort paneli, "faol" indikatori chizilmaydi** — bu ma'lumot mijozga berilmaydi.

**08 · Buyurtma berish (1-qadam: Muammo tavsifi)**
Ko'rinadi: header · yuqorida qadam indikatori (9.24-komponent: Tavsif · Manzil · Tasdiqlash) · tanlangan xizmat turi kartasi + "O'zgartirish" ghost tugmasi · `h3` "Muammoni tasvirlab bering" · textarea (min balandlik 120px, placeholder "Masalan: oshxonadagi kran oqmoqda…"), pastki o'ngda jonli hisoblagich `0/2000` · surat biriktirish bloki (quyida) · "Shoshilinch" toggle qatori (chapda yorliq + `body-sm` tushuntirish "Usta navbatdan tashqari yuboriladi", o'ngda toggle, **default o'chiq**) · pastda sticky `primary` tugma "Davom etish".

**Surat biriktirish bloki — ikki variantda chiziladi:**
- **Variant A (MVP, asosiy):** blok butunlay yo'q. Formada faqat matnli tavsif.
- **Variant B (kelajak):** gorizontal thumbnail lentasi (72×72, `radius/xs`) + "+" tugmasi; maksimum 10 ta, 10-tadan keyin "+" o'chadi va `caption` "Maksimum 10 ta fayl" chiqadi. Blok ustida `caption` yorliq "Tez orada", butun blok 40% opacity va bosilmaydi.
*Sabab: fayl yuklash servisi hali ulanmagan — API faqat tayyor havolalar massivini qabul qiladi.*

Holatlar: bo'sh (tugma disabled) · 10 belgidan kam (tugma disabled + `caption` "Kamida 10 belgi") · to'g'ri · maksimum (2000/2000, hisoblagich `danger`) · xato (server matni bloki).
Amallar: tavsif kiritish · shoshilinchni yoqish · davom etish (faqat 10 belgi to'lgach).

**09 · Xaritada manzil tanlash (2-qadam)**
Ko'rinadi: to'liq ekran xarita · markazda qotirilgan pin (48px, `primary`) · tepada suzuvchi qidiruv maydoni "Manzilni qidirish" · o'ng pastda dumaloq 48px "Mening joylashuvim" tugmasi (e2/e3) · pastda suzuvchi panel (`radius/xl`, e3): aniqlangan manzil matni (`body-lg`) + `primary` tugma "Shu yerda".
Holatlar: xarita yuklanmoqda (skeleton to'rtburchak + markazda spinner) · manzil aniqlanmoqda (panelda shimmer qator) · **joylashuvga ruxsat berilmagan** (markazda banner: "Joylashuvga ruxsat berilmagan" + `secondary` "Sozlamalarni ochish" + ghost "Manzilni qo'lda kiritish") · xato.
Amallar: xaritani surish · joylashuvni aniqlash · manzil qidirish · tasdiqlash.

**10 · Manzil tafsilotlari (2-qadam davomi)**
Ko'rinadi: yuqorida 120px balandlikdagi kichik xarita preview (`radius/lg`) + pin · quyida forma:
- "Manzil" — input, **majburiy**, kamida 5 belgi, maksimum 300
- Uch qisqa maydon yonma-yon: "Kirish" (placeholder "Masalan: 2-kirish") · "Qavat" · "Xonadon" — har biri **maksimum 20 belgi**, ixtiyoriy
- "Izoh (ixtiyoriy)" — textarea, maksimum 300 belgi, hisoblagich bilan
- pastda sticky `primary` tugma "Saqlash"

Holatlar: bo'sh (tugma disabled) · to'ldirilgan · manzil 5 belgidan qisqa (input `error` holati, ostida "Kamida 5 belgi kiriting").
Amallar: maydonlarni to'ldirish · saqlash.
**Bo'sh qoldirilgan ixtiyoriy maydonlar umuman yuborilmaydi** — bo'sh satr sifatida emas.

**11 · Buyurtmani tasdiqlash (3-qadam)**
Ko'rinadi: header · qadam indikatori (9.24) · `h1` "Buyurtmani tasdiqlang" · xulosa bloklari, har biri yonida "O'zgartirish" ghost tugmasi:
1. Xizmat turi + taxminiy narx
2. Muammo tavsifi (3 satrgacha, keyin "…")
3. Manzil (kichik xarita preview + matn + kirish/qavat/xonadon qatorlari — **bo'lmasa qatorlar yashiriladi**)
4. "Shoshilinch" belgisi (agar yoqilgan bo'lsa — chip)
· Pastda `warning` banner: "Buyurtma berilgandan keyin uni tahrirlab bo'lmaydi." · sticky `primary` tugma "Ustani chaqirish".
Holatlar: default · yuborilmoqda (tugma **darhol disabled + spinner**) · xato: server matni bloki + ro'yxat avtomatik yangilanadi va tanlov tozalanadi · "Juda ko'p urinish. Bir oz kuting va qayta urinib ko'ring." (taymer bilan) · "Server javob bermadi. Qayta urinib ko'ring." + "Qayta urinish".
Amallar: bloklarni tahrirlash · buyurtma berish.

---

### C. BUYURTMA OQIMI

**12 · Usta qidirilmoqda**
Ko'rinadi: header ("Buyurtma" + orqaga) · stepper (1-bosqich joriy) · markazda radar animatsiya bloki (9.29) · ostida `h2` "Usta qidirilmoqda…" · `body` `text-secondary` hisoblagich "0:14" · buyurtma xulosasi kartasi (xizmat turi, manzil, narx) · pastda `secondary` tugma "Bekor qilish".
Holatlar — **uchtasi ham majburiy:**
1. **Qidirilmoqda** (yuqoridagi asosiy ko'rinish)
2. **Operator ko'rib chiqmoqda** — radar animatsiyasi **to'xtaydi**, o'rniga 9.29-komponentning statik varianti (64px operator ikonasi); `h2` "Usta qidirilmoqda", `warning` banner: "Hozircha bo'sh usta yo'q — operatorimiz buyurtmangizni qo'lda ko'rib chiqadi"; **"Bekor qilish" tugmasi albatta faol qoladi** + ghost "Qo'llab-quvvatlashga murojaat". Taxminiy vaqt va navbat raqami ko'rsatilmaydi
3. **Boshqa usta qidirilmoqda** — `h2` "Boshqa usta qidirilmoqda", `body` "Avvalgi usta javob bermadi. Siz uchun boshqa usta qidirilmoqda." Rang neytral/aksent, **qizil emas** — bu xato emas. Usta kartasidan bu ekranga o'tish yumshoq (fade/cross-dissolve), keskin g'oyib bo'lmaydi

Amallar: bekor qilish (28-ekranni ochadi) · qo'llab-quvvatlash.
**Skeleton kartalar chizilmaydi** — bu biznes-holat, texnik yuklanish emas.

**13 · Siz navbatdasiz**
Ko'rinadi: stepper (1-bosqich) · markazda katta raqamli blok: `display` "~3" + `body` "Navbatdagi o'rningiz" · ostida ikkinchi darajali `body-sm` "Taxminiy kutish: 20 daqiqa" (**mavjud bo'lganda**; bo'lmasa "Hisoblanmoqda") · buyurtma xulosasi kartasi · `secondary` tugma "Bekor qilish".
Holatlar:
1. navbat raqami bor
2. kutish vaqti yo'q ("Hisoblanmoqda")
3. **Operator ko'rib chiqmoqda** — navbat raqami bloki butunlay yashiriladi, o'rniga 12-ekrandagi bilan bir xil `warning` banner: "Hozircha bo'sh usta yo'q — operatorimiz buyurtmangizni qo'lda ko'rib chiqadi"; **"Bekor qilish" tugmasi albatta faol qoladi** + ghost "Qo'llab-quvvatlashga murojaat"
4. offline banner

Amallar: bekor qilish · qo'llab-quvvatlash.
**Jonli sanoq animatsiyasi yoki har soniyada yangilanadigan hisoblagich chizilmaydi** — raqam faqat haqiqatan o'zgarganda yangilanadi va uzoq vaqt qotib turishi normal. Bu ekranda **taxminiy vaqt asosiy element emas** — asosiysi navbat o'rni.

**14 · Usta topildi**
Ko'rinadi: stepper (2-bosqich) · usta kartasi (9.7-komponent, to'liq) · chip "Taxminiy vaqt: 15 daqiqa" · buyurtma xulosasi · pastda ikki tugma: `primary` "Qo'ng'iroq qilish" va `secondary` "Bekor qilish".
Holatlar: to'liq · usta rasmisiz (9.28 `initial` varianti) · taxminiy vaqt yo'q (**chip butunlay yashiriladi, "0 daqiqa" yozilmaydi**) · skeleton.
Amallar: qo'ng'iroq · usta profilini ochish (kartani bosish) · bekor qilish.
**Diqqat:** bu ekran istalgan payt 12-ekranning 3-holatiga ("Boshqa usta qidirilmoqda") qaytishi mumkin.

**15 · Usta yo'lda**
Ko'rinadi: stepper (3-bosqich) · usta kartasi · chiziqli progress bar (9.23-komponent, **hech qachon 100% ko'rsatmaydi — maksimum 92%**) · tepasida `h3` "15 daqiqada yetib keladi" · ostida `caption` manzil · pastda `primary` "Qo'ng'iroq qilish" + `secondary` "Bekor qilish" · `body-sm` `text-secondary` ogohlantirish: "Bu — bekor qilishning oxirgi imkoniyati."
Holatlar: to'liq · taxminiy vaqt yo'q (progress bar o'rniga "Hisoblanmoqda") · offline banner.
Amallar: qo'ng'iroq · bekor qilish · usta profili.
**Xarita, ustaning harakatlanuvchi markeri va real-vaqt lokatsiya elementlari chizilmaydi** — bu ma'lumot mijozga berilmaydi. **"Usta yo'lga chiqdi 14:32" kabi vaqt timeline'i chizilmaydi** — bunday vaqtlar mavjud emas.

**16 · Ustani tasdiqlang** — BLOKLOVCHI EKRAN, alohida vizual til
Ko'rinadi: **stepper yo'q, hero blok yo'q, banner yo'q, dekorativ rasm yo'q** — butun ekran neytral `surface` rangida. Bu uni qolgan ekranlardan darhol ajratadi.
1. Markazda usta fotosi: **120px avatar** (9.28), atrofida 3px `primary` halqa, ostida 16px
2. Ism: `h1`; ostida kasbi `body` `text-secondary`
3. Verifikatsiya chiplari qatori: "Tajribali", "Sertifikatli" — `h=28, radius/full`, `success` 12% fon + `success` matn, 14px check ikona
4. Reyting + bajarilgan buyurtmalar soni
5. `warning` banner (12% fon, chapda 4px `warning` chiziq, `radius/sm`): "Kelgan odam suratdagi ustaga o'xshamasa — «Yo'q, bu boshqa odam» tugmasini bosing."
6. Tugmalar **vertikal ustma-ust**, har biri `h=56`, orasi 12px:
   - `primary` — **"Ha, shu usta"**
   - `destructive-outline` — **"Yo'q, bu boshqa odam"**

Ikkala tugma bir xil o'lchamda va bir xil vizual og'irlikda. "Yo'q" hech qachon kichik, kulrang yoki matnli havola ko'rinishida bo'lmasin — dark pattern **taqiqlanadi**.
**Bu ekranda "Bekor qilish" tugmasi umuman yo'q** va orqaga qaytish yopilgan. Sababi: bu holatda bekor qilish tizim darajasida taqiqlangan.
Holatlar: default · "Ha" bosilgan (tugma loading) · "Yo'q" bosilgan → 17-ekran.
Amallar: tasdiqlash yoki xavfsizlik signali.

**17 · Xavfsizlik tasdig'i (modal)**
Ko'rinadi: `overlay` ustida markazda modal (`radius/xl`, e3): 48px `danger` ikona · `h3` "Bu amalni bekor qilib bo'lmaydi" · `body` "Buyurtma to'xtatiladi va operator siz bilan bog'lanadi." · textarea "Izoh (ixtiyoriy)", maksimum 1000 belgi, hisoblagich bilan · ikki tugma vertikal: `destructive` "Tasdiqlash" va `ghost` "Orqaga".
Holatlar: default · yuborilmoqda.
Amallar: tasdiqlash → 21-ekran · orqaga.

**18 · Ish jarayonida**
Ko'rinadi: stepper (4-bosqich) · usta kartasi · `info` banner "Usta ishni boshladi" · buyurtma xulosasi · pastda `primary` "Qo'ng'iroq qilish" + `ghost` "Qo'llab-quvvatlashga murojaat".
Holatlar: to'liq · offline banner.
Amallar: qo'ng'iroq · qo'llab-quvvatlash.
**Bekor qilish tugmasi yo'q. Hech qanday holat o'zgartiruvchi tugma yo'q** — bu sof kuzatuv ekrani, o'zgarishni ilova o'zi kutadi.

**19 · Ishni baholang**
Ko'rinadi: stepper (10.1-xarita bo'yicha) · `h1` "Ishni baholang" · usta kartasi (ixcham) · markazda **5 ta 40px yulduz**, oraliq 8px, tanlanmagan `star-empty` · tanlangan yulduzlar soniga qarab `body` matn ("Yomon" / "Qoniqarli" / "Yaxshi" / "Juda yaxshi" / "Ajoyib") · textarea "Izoh (ixtiyoriy)", maksimum 2000 belgi · pastda sticky `primary` tugma "Bahoni yuborish".
Holatlar: yulduz tanlanmagan (**tugma disabled**) · tanlangan · yuborilmoqda · xato (server matni `info` banner sifatida + ekran avtomatik chek ekraniga o'tadi).
Amallar: yulduz tanlash · izoh yozish · yuborish.
Baholangach ekran **darhol** "Yakunlandi" holatiga o'tadi va chek ekrani ochiladi.

**20 · Chek**
Ko'rinadi: header ("Chek") · kvitansiya bloki (`radius/lg`, `surface-elevated`, punktir ajratgichlar, tabular figures):
- Buyurtma raqami — `caption` `text-secondary` yorliq + `mono` uslubida raqam
- Xizmat nomi
- Usta ismi (**bo'lmasa "—"**)
- Qo'yilgan baho — yulduzlar + raqam (**bo'lmasa "—"**)
- Yakunlangan sana (**bo'lmasa "—"**)
- Punktir ajratgich, ostida katta `display` "Jami: 150 000 so'm"
· Pastda `secondary` tugma "Qayta buyurtma berish".
Holatlar: to'liq · maydonlar bo'sh (layout buzilmaydi) · skeleton.
Amallar: qayta buyurtma berish · orqaga.
**Manzil, ish davomiyligi, to'lov usuli, soliq/xizmat haqi bo'linmasi, "PDF yuklab olish" va "Ulashish" tugmalari chizilmaydi** — bu ma'lumotlar mavjud emas.

**21 · Xavfsizlik signali** — TERMINAL, DEAD-END EKRAN
Ko'rinadi: **stepper yo'q.** Markazda 72px `danger` ikona · `h1` "Signalingiz qabul qilindi" · `body` "Operatorimiz hoziroq siz bilan bog'lanadi" · `surface-sunken` blokda `caption` "Signal raqami" + ostida 4px, `mono` uslubida ID · pastda **faqat ikki tugma**: `primary` "Qo'llab-quvvatlashga murojaat" va `ghost` "Bosh sahifaga".
Holatlar: bitta.
Amallar: qo'llab-quvvatlash · bosh sahifaga.
**Bu ekranda "Qayta qidirish", "Boshqa usta chaqirish", "Bekor qilish", "Ishni baholash", "Chekni ko'rish" tugmalari YO'Q.** Buyurtma qaytarib bo'lmas tarzda yopilgan; foydalanuvchiga faqat yangi buyurtma yaratish taklif qilinadi.

**22 · Buyurtma bekor qilindi** — TERMINAL
Ko'rinadi: **stepper yo'q.** Markazda 64px neytral ikona · `h1` "Buyurtma bekor qilindi" · bekor qilish sababi matni · kim bekor qilgani — **uch xil variant, uch xil rang:**
- "Siz bekor qildingiz" — `text-secondary`
- "Usta bekor qildi" — `warning`
- "Tizim bekor qildi" — `text-secondary`
· Buyurtma xulosasi kartasi · pastda `primary` tugma "Qayta buyurtma berish".
Holatlar: uch variant.
Amallar: qayta buyurtma berish.
**Chek va baholash tugmasi yo'q.**

**23 · Buyurtma tafsiloti** — universal shablon
Ko'rinadi (bloklar tartibi):
1. Status chipi + qisqa izoh matni
2. Usta kartasi — **bo'lmasa** "Usta hali tayinlanmagan" placeholder bloki
3. Xizmat turi va narxi
4. Muammo tavsifi (+ biriktirilgan suratlar galereyasi, agar mavjud bo'lsa)
5. Manzil — kichik xarita preview + matn + kirish/qavat/xonadon qatorlari (**bo'lmasa qatorlar yashiriladi**)
6. "Shoshilinch" chipi (agar yoqilgan bo'lsa)
7. Sanalar: yaratilgan; yakunlangan bo'lsa yakunlangan sana; bekor qilingan bo'lsa sabab va kim bekor qilgani; baholangan bo'lsa qo'yilgan yulduzlar (**read-only, o'zgartirib bo'lmaydi**) va izoh

Pastdagi tugmalar holatga qarab:
| Holat | Tugmalar |
|---|---|
| Qidirilmoqda / Navbatdasiz | Bekor qilish |
| Usta topildi / Usta yo'lda | Qo'ng'iroq qilish · Bekor qilish |
| Usta yetib keldi | Ha, shu usta · Yo'q, bu boshqa odam |
| Ish jarayonida | Qo'ng'iroq qilish · Qo'llab-quvvatlashga murojaat |
| Ish yakunlandi | Ishni baholash · Chekni ko'rish |
| Yakunlandi | Chekni ko'rish · Qayta buyurtma berish |
| Bekor qilindi | Qayta buyurtma berish |
| Xavfsizlik tekshiruvida | Qo'llab-quvvatlashga murojaat |

Kamida **4 ta variantni alohida frame** qilib ko'rsat: aktiv (usta yo'lda) · yakunlangan + baholangan · bekor qilingan · xavfsizlik tekshiruvida.
Holatlar: skeleton · to'liq · topilmadi (12.3-band).
**"Tahrirlash" tugmasi hech qachon qo'yilmaydi.**

---

### D. TABLAR

**24 · Buyurtmalarim**
Ko'rinadi: header ("Buyurtmalarim") · segment control (9.22-komponent): "Barchasi / Aktiv / Yakunlangan / Bekor qilingan" (**bu filtrlar klient tomonda ishlaydi**, server bo'limlari emas) · buyurtma kartalari ro'yxati, yangi-dan-eski tartibda (**UI qayta saralamaydi**) · pastda infinite scroll loaderi.
Holatlar: skeleton (5 ta karta) · to'liq · ko'proq yuklanmoqda · filtr bo'yicha bo'sh · umuman bo'sh (12.2-band) · offline.
Amallar: filtr tanlash · kartani bosish → buyurtma tafsiloti · pull-to-refresh · scroll bilan yuklash.

**25 · Bildirishnomalar**
Ko'rinadi: header ("Bildirishnomalar"); sarlavha ostida chapda `caption` `text-secondary` "3 ta o'qilmagan" (o'qilmagan bo'lmasa bu qator butunlay yashiriladi), o'ngda ghost tugma "Barchasini o'qilgan deb belgilash" — **o'qilmagan bildirishnoma bo'lmasa tugma disabled emas, butunlay yashiriladi** · bildirishnoma qatorlari (9.13-komponent), yangi-dan-eski tartibda.
**9 ta tur uchun ikona va rang xaritasi:**
| Sarlavha | Ikona | Rang |
|---|---|---|
| Usta topildi | shaxs + check | `primary` |
| Usta yo'lga chiqdi | yo'nalish strelkasi | `primary` |
| Usta yetib keldi | eshik/qo'ng'iroq | `warning` |
| Siz navbatdasiz | ro'yxat/navbat | `warning` |
| Ish boshlandi | asboblar | `primary` |
| Ish yakunlandi | check doira | `success` |
| Buyurtma bekor qilindi | X doira | `text-secondary` |
| Signalingiz qabul qilindi | qalqon | `danger` |
| Usta qidirilmoqda (operator) | operator/naushnik | `warning` |

Holatlar: skeleton · to'liq · faqat o'qilganlar · bo'sh (12.2-band) · offline.
Amallar: elementni bosish → tegishli buyurtma ekrani · barchasini o'qilgan deb belgilash (**darhol lokal yangilanadi**) · push bosilganda ilova yopiq bo'lsa ham shu buyurtma ekraniga o'tiladi (deep-link).
Kartadagi sarlavha va matn serverdan tayyor keladi — **UI o'z matnini to'qimaydi**.
Qo'shimcha: ilova ochiq bo'lganda ko'rinadigan **in-app toast/banner** (9.25-komponent) ham chiziladi — sarlavha + matn + bosilganda buyurtmaga o'tish.

**26 · Profil** — read-only
Ko'rinadi: tepada 80px avatar (9.28) · **ism bor:** 1-qator — ism (`h2`), 2-qator — telefon raqami (`body` `text-secondary`, o'zgartirib bo'lmaydi, 8.3-banddagi maska bilan); **ism yo'q:** faqat bitta qator — telefon raqami (`h2`), ikkinchi qator butunlay yashiriladi · ostida ro'yxat elementlari:
- "Buyurtmalar tarixi" → 24-ekran
- "Bildirishnomalar" (tizim ruxsati holati bilan) → sozlamalar
- "Qo'llab-quvvatlash xizmati" → 30-ekran
- "Ilova haqida" (versiya, foydalanish shartlari, maxfiylik siyosati)
- "Chiqish" — `danger` matnli qator

Holatlar: ism bilan · ismsiz · chiqish tasdiqlash dialogi.
Amallar: bo'limlarga o'tish · chiqish.

---

### E. QO'SHIMCHA EKRANLAR VA MODALLAR

**27 · Usta profili** — read-only
Ko'rinadi: header · markazda 120px avatar (9.28) · ism `h1` · badge "Tajribali"/"Yangi" · "Sertifikatli" chipi (agar mavjud bo'lsa) · yulduzlar + reyting "4,8" · "142 ta buyurtma bajargan" · pastda `primary` "Qo'ng'iroq qilish" — **faqat telefon raqami mavjud bo'lganda**; mavjud bo'lmasa tugma o'rniga `body-sm` `text-secondary` matn: "Ish yakunlangan — savol bo'lsa qo'llab-quvvatlash xizmatiga murojaat qiling" + `ghost` "Qo'llab-quvvatlashga murojaat".
Holatlar: telefon bilan · telefonsiz · skeleton.
**Sharhlar ro'yxati, narxlar, ish jadvali, portfolio, "kuzatish"/"yoqtirish"/"saqlash" tugmalari yo'q. Reyting yonida "N ta baho" yozilmaydi.**

**28 · Bekor qilish sababi** (bottom sheet)
Ko'rinadi: sheet (`radius/xl`, e3) · `h3` "Bekor qilish sababi" · sabab chiplari (9.27-komponent, wrap): "Fikrimdan qaytdim" · "Juda uzoq kutdim" · "Muammo o'zi hal bo'ldi" · "Narx to'g'ri kelmadi" · "Boshqa sabab" · "Boshqa sabab" tanlansa erkin matn maydoni ochiladi (**minimum 3, maksimum 500 belgi**, jonli hisoblagich) · pastda `destructive` tugma "Bekor qilish" va `ghost` "Yopish".
Holatlar: sabab tanlanmagan (**tugma disabled**) · chip tanlangan · erkin matn (3 belgidan kam — tugma disabled) · yuborilmoqda.
Amallar: sabab tanlash · bekor qilish.
Tasdiqlash: `destructive` bosilgach kichik dialog — "Buyurtmani rostdan bekor qilasizmi?" + "Ha, bekor qilish" / "Yo'q".

**29 · Bekor qilib bo'lmaydi** (modal)
Ko'rinadi: `overlay` + modal · 48px `warning` ikona · `h3` "Bekor qilib bo'lmaydi" · **server matni** (2 satrgacha blok): "Ish boshlangandan keyin buyurtmani ilova orqali bekor qilib bo'lmaydi — iltimos, qo'llab-quvvatlash xizmatiga murojaat qiling" · `primary` "Qo'llab-quvvatlashga murojaat" + `ghost` "Yopish".
Amallar: qo'llab-quvvatlash · yopish.

**30 · Qo'llab-quvvatlash xizmati**
Ko'rinadi: header ("Qo'llab-quvvatlash xizmati") · `body` qisqa matn · ro'yxat: "Telefon orqali bog'lanish" (tel havolasi) · "Telegram orqali yozish" · buyurtma ekranidan ochilgan bo'lsa `surface-sunken` blokda avtomatik to'ldirilgan buyurtma raqami (`mono`) · ish vaqti ko'rsatkichi (`caption`).
Amallar: qo'ng'iroq · Telegram.
Bu ekranga yo'naltiruvchi tugmalar: 05, 12, 13, 18, 21, 22, 23, 27, 29-ekranlar va profil menyusi.

**31 · Ruxsat so'rash ekranlari** (2 ta)
Har biri: markazda 96px illyustratsiya · `h2` sarlavha · `body` 1–2 qatorli tushuntirish · `primary` "Ruxsat berish" · `ghost` "Keyinroq".
- **Joylashuv:** "Ustani sizga tez yuborishimiz uchun joylashuvingiz kerak"
- **Bildirishnomalar:** "Usta topilganda, yo'lga chiqqanda va yetib kelganda xabar beramiz" (login'dan keyin darhol ko'rsatiladi)

Har biri uchun **rad etilgan holat varianti** ham chiziladi: nima ishlamasligini tushuntiruvchi matn + `secondary` "Sozlamalarni ochish".

---

## 12. UNIVERSAL HOLAT NAQSHLARI

### 12.1. Skeleton (yuklanmoqda)
Kontent shakli takrorlanadi: `surface-sunken` to'ldirish, `radius/xs`, shimmer chapdan o'ngga 1.2s, opacity 0.4 → 0.8 → 0.4.

**Spinner faqat to'rt joyda:** tugma ichida, 01-ekranda (sessiyani tiklash), 09-ekranda xarita yuklanishida va real-vaqt aloqa bannerida. Ro'yxat va kontent yuklanishida faqat skeleton ishlatiladi. 12-ekrandagi radar animatsiyasi spinner hisoblanmaydi — u alohida komponent (9.29).

Majburiy skeleton variantlari: Bosh sahifa · Barcha xizmatlar · Guruh xizmatlari · Buyurtma tafsiloti · Buyurtmalarim (+ pastki "ko'proq yuklanmoqda" loaderi) · Bildirishnomalar · Chek.
Qo'shimcha: pull-to-refresh holati komponenti.

### 12.2. Bo'sh holat
Markazda 96px outline illyustratsiya-ikona (stroke 1.75px, `text-disabled`) · 20px · `h3` sarlavha · 8px · `body-sm` `text-secondary` tushuntirish (maksimum 2 satr) · 24px · `primary` tugma (jadvalda tugma yo'q deb belgilangan holatda bu blok chizilmaydi va matn ostidagi bo'shliq 0 bo'ladi). Blok vertikal markazdan 25% yuqoriga siljigan.

**Bo'sh holat CTA jadvali:**
```
Tarix bo'sh              "Hozircha buyurtmalaringiz yo'q" → primary "Ustani chaqirish"
Bildirishnomalar bo'sh   "Bildirishnomalar yo'q" → tugma YO'Q (blok faqat ikona + matn)
Qidiruv natijasi yo'q    "Hech narsa topilmadi" → ghost "Barcha xizmatlarni ko'rish"
Aktiv buyurtma yo'q      "So'nggi buyurtmalaringiz" bloki bilan almashtiriladi
```

### 12.3. Xato holatlari

**A) Server matni ko'rsatiladi** (o'zbekcha va aniq — o'zgartirilmaydi): bekor qilib bo'lmasligi · xizmat turi mavjud emas · OTP xatolari · hisob bloklangan · baholash taqiqlangan · baho allaqachon mavjud · chek mavjud emas · buyurtma topilmadi · resursga ruxsat yo'q.
Maketda matn o'rnini **2 satrgacha bo'lgan blok** sifatida chiz.

**B) O'z matnimiz** (server matni texnik yoki inglizcha):
| Vaziyat | Ko'rsatiladigan matn |
|---|---|
| Juda ko'p so'rov | "Juda ko'p urinish. Bir oz kuting va qayta urinib ko'ring." |
| So'rov vaqti tugadi | "Server javob bermadi. Qayta urinib ko'ring." + "Qayta urinish" |
| Server xatosi | "Xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring." + "Qayta urinish" |
| Server xatosi (kod yuborishda) | "SMS yuborishda xatolik. Kod kelmasa, taymer tugagach qayta so'rang." — "Qayta urinish" tugmasi QO'YILMAYDI, chunki cooldown allaqachon boshlangan va darhol urinish yangi xato beradi |
| Sessiya tugadi | Matn ko'rsatilmaydi — jimgina kirish ekraniga o'tiladi |
| Sessiya xavfsizlik sababli yopildi | "Xavfsizlik sababli barcha sessiyalar yopildi. Qaytadan kiring." |
| Buzuq havola / topilmadi | "Buyurtma topilmadi" + "Buyurtmalarimga qaytish" — **ikkalasi ham bitta ekran** |
| Internet yo'q | To'liq ekran: "Internetga ulanish yo'q" + "Qayta urinish" |

**C) Xato EMAS — sokin yangilanish:** buyurtma holati boshqa jarayon tomonidan o'zgartirilganda **modal ko'rsatilmaydi**. Ekran jimgina yangilanadi (skeleton → yangi holat), ko'pi bilan kichik toast: "Buyurtma holati yangilandi". Maketda buni "sokin yangilanish" izohi bilan belgila.

**Inline xato:** input ostida 6px pastda, `body-sm` `danger`, chapda 14px ikona.
**Toast/snackbar:** 9.25-komponent.

### 12.4. Real-vaqt aloqa banneri
Kuzatuv ekranlari (12, 13, 14, 15, 18) uchun 9.26-komponent — asosiy kontentni **surmaydi**, ustidan suzadi:
- `reconnecting`: "Aloqa tiklanmoqda…" + 16px spinner
- `stalled`: "Yangilanishlar to'xtadi" + ghost "Yangilash"

---

## 13. BOSQICHLAR BO'YICHA ISHLAB CHIQISH REJASI

Har bir bosqichni alohida bajar. Keyingi bosqichda **faqat oldingi bosqichda tasdiqlangan tokenlar va komponentlar** ishlatiladi — yangi rang, radius, spacing yoki tipografika qiymati kiritilmaydi.

### Bosqich 1 — Dizayn tizimi + 4 ta asosiy ekran
1. **"Dizayn tizimi" varag'i** (2 ta frame: Dark va Light) — rang tokenlari jadvali, tipografika shkalasi, spacing shkalasi, radius shkalasi, elevatsiya namunalari, ikona uslubi namunasi.
2. **"Komponentlar" varag'i** (2 ta frame) — 9-bo'limdagi 29 ta komponent, har biri barcha holatlari bilan.
3. **5 ta asosiy ekran** × 2 tema = 10 frame: **06 Bosh sahifa · 07a Guruh xizmatlari · 07 Barcha xizmatlar · 08 Buyurtma berish · 14 Usta topildi**.

Chiqishda: ishlatilgan tokenlar va yaratilgan komponentlar ro'yxatini chiqar.

### Bosqich 2 — Kirish va manzil oqimi
01, 02, 03, 04, 05, 09, 10, 11 (× 2 tema = 16 frame).

### Bosqich 3 — Buyurtma holatlari
12 (3 holat variantida), 13 (operator holati bilan), 15, 16, 17, 18, 19, 20, 21, 22 (× 2 tema).

### Bosqich 4 — Tablar va tafsilot
23 (4 variantda), 24, 25, 26, 27 (× 2 tema).

### Bosqich 5 — Holatlar, modallar, ruxsatlar
28, 29, 30, 31 · skeleton variantlari · bo'sh holatlar · xato holatlari · toast va bannerlar (× 2 tema).

---

## 14. NIMA QILMASLIK KERAK

Quyidagilarning har biri backend qoidasini buzadi yoki ma'lumot manbai bo'lmagan element yaratadi. **Birortasi ham chizilmasin.**

### 14.1. Ustalar bilan bog'liq
1. Ustalar katalogi, ro'yxati, karuseli, "Barcha ustalar" ekrani.
2. "Ustani tanlang", "Takliflar", "Nomzodlar" ekrani yoki bir nechta usta kartasi.
3. Usta kartasida "Book Now" / "Buyurtma berish" tugmasi.
4. Ustalar bo'yicha qidiruv yoki filtr.
5. Usta profilida: sharhlar ro'yxati, narxlar, ish jadvali, portfolio, "kuzatish"/"yoqtirish"/"saqlash" tugmalari.
6. Reyting yonida "N ta baho" yozuvi.
7. Xaritada ustaning real-vaqt joylashuvi yoki harakatlanuvchi markeri.
8. "Usta yo'lga chiqdi 14:32", "yetib keldi 14:50" kabi server vaqtlariga tayangan timeline.

### 14.2. Aloqa
9. "Xabarlar" / "Chat" tabi yoki har qanday yozishmalar ekrani.
10. Chat ikonasi yoki tugmasi (hech bir ekranda).
11. "Qo'ng'iroq qilish" tugmasini disabled holatda ko'rsatish — telefon raqami mavjud bo'lmagan holatlarda tugma **butunlay yashiriladi**.

### 14.3. Buyurtma va holatlar
12. "Bekor qilish" tugmasini "Usta yetib keldi", "Ish jarayonida" va undan keyingi ekranlarda ko'rsatish.
13. Bekor qilishni sababsiz yuborish imkoniyati.
14. "Ustani tasdiqlang" ekranida bekor qilish tugmasi, stepper yoki orqaga qaytish.
15. Xavfsizlik ekranida "Qayta qidirish", "Boshqa usta chaqirish", "Bekor qilish", "Ishni baholash" yoki "Chekni ko'rish" tugmasi.
16. Buyurtmani tahrirlash formasi yoki "Tahrirlash" tugmasi.
17. "Qoralama" (draft) holati/ekrani.
18. "Baholandi" uchun alohida holat/ekran — u "Yakunlandi" bilan bir xil.
19. Bekor qilingan yoki xavfsizlik tekshiruvidagi buyurtmada "Chekni ko'rish" tugmasi.
20. Bahoni tahrirlash yoki qayta yuborish imkoniyati.
21. Baholash ekranini "Ish yakunlandi" dan boshqa holatda ochish.
22. Usta kartasining keskin g'oyib bo'lishi yoki "Boshqa usta qidirilmoqda" holatini xato ekrani sifatida chizish.
23. Buyurtma holati o'zgarganda xato modali ko'rsatish — bu **sokin yangilanish**.
24. Aktiv buyurtma kartasini terminal bo'lmagan biror holat uchun chizmay qoldirish yoki "Usta yetib keldi" holatida bosh sahifani ko'rsatish.

### 14.4. Ma'lumot mavjud emas
25. Xizmat turida "oddiy/murakkab ish" belgisi, murakkablik filtri yoki "faol" indikatori.
26. "Ommabop", "Eng ko'p buyurtma qilingan", "Tavsiya etilamiz" kabi tartib yoki ommaboplik da'vosi — bunday ma'lumot mavjud emas.
27. Valyuta tanlash, konvertatsiya, ikkinchi valyutada narx.
28. Profilni tahrirlash formasi, avatar yuklash, ism/telefon o'zgartirish.
29. "Manzillarim" ro'yxati, saqlangan manzillar boshqaruvi.
30. To'lov usullari, kartalar, balans, hamyon, promokod.
31. Til tanlash, tema tanlash, sozlamalar ekrani.
32. "Do'stlarni taklif qilish", referal, bonus dasturi.
33. Chekda: manzil, ish davomiyligi, to'lov usuli, soliq/xizmat haqi bo'linmasi, "PDF yuklab olish", "Ulashish".
34. Foydalanuvchi avatari sifatida haqiqiy foto (rasm maydoni mavjud emas — faqat initsial yoki ikona).

### 14.5. Qidiruv va ro'yxatlar
35. Global qidiruv natijalari ekrani, so'nggi qidiruvlar tarixi, qidiruv tavsiyalari.
36. Buyurtmalar bo'yicha qidiruv yoki server filtri/sortlash paneli.
37. Ro'yxatlarni qayta saralash — ular allaqachon to'g'ri tartibda keladi.
38. Sahifa hajmini 100 dan oshirish.

### 14.6. Raqam, matn, format
39. Har qanday inglizcha matn: Home, Book Now, Search, Rating, Receipt, **ETA**, Loading, Popular Services, Recommended for you va h.k.
40. `UZS`, `сум`, `150,000`, `150.000`, `150K`, tiyin/kasr qismli narx.
41. AM/PM formatidagi vaqt (status bardagi "9:41" istisno).
42. `ʻ`, `ʼ`, `'`, `'`, `` ` `` apostroflari yoki kirill yozuvi.
43. Taxminiy vaqt mavjud bo'lmaganda "0 daqiqa" yozish — element **yashiriladi** yoki "Hisoblanmoqda" qo'yiladi.
44. Navbat raqami uchun jonli sanoq yoki har soniyada yangilanadigan hisoblagich.
45. Bosh sahifa va xizmat turlari ro'yxatida narxni aniq summa sifatida yozish — faqat "taxminan 150 000 so'm" yoki "150 000 so'mdan" shakli. Narx yonida "~" belgisi ishlatilmaydi; "~" faqat vaqt va navbat o'rni uchun.
46. 8.2 jadvalida yo'q yozuvni maketga qo'yish.

### 14.7. Vizual tizim
47. Token jadvalida yo'q hex rang.
48. Yorqin teal (`#1EC8C8`, `#2DD4BF`, `#10A3A0`) ustida oq matn.
49. Turkuaz yulduz — yulduz **har doim amber**.
50. Yulduz rangini reyting tashqarisidagi elementlarda ishlatish.
51. 20px yoki 22px karta radiusi — faqat 6.2-banddagi shkala.
52. Spacing shkalasidan tashqari padding/margin/gap qiymati (13, 15, 18, 22px).
53. Tipografika shkalasidan tashqari shrift qiymati.
54. Dark temada elevatsiya uchun soya — o'rniga fon zinapoyasi + ingichka chegara.
55. Fill va outline ikonalarni aralashtirish; bir nechta ikona oilasi.
56. Ikki tema o'rtasida struktura farqi — element qo'shish yoki olib tashlash. **Yagona ruxsat etilgan farq:** Light temadagi tepa dekorativ turkuaz blok va uning ustida suzuvchi oq qidiruv paneli.
57. Detach qilingan komponent nusxasi; Auto-layout'siz karta/ro'yxat/forma.
58. 9-bo'lim ro'yxatida yo'q komponentni ekranda o'zicha yasash.
59. Frame raqamini 11-bo'limdagidan boshqacha qo'yish yoki Dark/Light juftlariga turli raqam berish.
60. "Yo'q, bu boshqa odam" tugmasini kichik, kulrang yoki matnli havola ko'rinishida chizish.