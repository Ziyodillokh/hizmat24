# Hizmat24 — xarita va jonli kuzatuv TZ

Mijoz ustaning qayerda ekanini xaritada koʻrishi kerak (Yandex Taksidagi kabi):
usta yoʻlga chiqqanda nuqta harakatlanadi, yetib kelish vaqti qayta hisoblanadi,
yetib kelganda kuzatuv toʻxtaydi.

Bu hujjat [backend-ulash-tz.md](backend-ulash-tz.md) ning ichiga kiradi: K-bosqichlar
B-bosqichlarga bogʻlangan va ularsiz ishlamaydi.

---

## 0. Qarorlar

### 0.1 Xarita provayderi — MapLibre + OpenStreetMap, Yandex EMAS

Yandex Maps bepul shartlari **aynan bizning holatni taqiqlaydi**:

> «transport yoki mobil xodimlarni real vaqtda kuzatish uchun xaritadan foydalanib boʻlmaydi»

Ikkinchi taqiq: API javoblarini saqlash mumkin emas — geokoder qaytargan koordinatani
buyurtma yozuvida saqlash ham shu taqiq ostida. Jonli kuzatuv uchun Yandexʼning tijorat
litsenziyasi shart (narxi eʼlon qilinmagan, shartnoma talab qiladi).

Shuning uchun: **MapLibre GL JS** (xarita), **OpenStreetMap** plitkalari (Geofabrik/MapTiler
yoki oʻz tile-serverimiz), **OSRM** (marshrut va ETA — oʻzimizda, soʻrov cheksiz).
Xarita qatlami BITTA komponentda (`src/components/map/MapCanvas.tsx`) boʻladi —
provayder almashtirish shu faylni almashtirish demak.

### 0.2 ETA — OSRM marshruti boʻyicha, lekin ustaning soʻzi bilan birga

Ikkita raqam ikki xil narsa: **usta aytgan vaqt** (u oʻz ishini biladi) va **marshrut vaqti**
(OSRM hisoblaydi). Ekranda asosiysi — marshrut vaqti; usta aytgani ostida kichik qatorda.
Ular bir-biridan 10 daqiqadan koʻp farq qilsa, mijozga kattasi koʻrsatiladi — kutish vaqtini
kam koʻrsatish ishonchni yoʻqotadi.

ETA har joylashuv yangilanishida emas, **har 60 soniyada** qayta hisoblanadi (OSRM soʻrovini
tejaydi va raqam sakramaydi).

### 0.3 Nima kuzatiladi va qachon

| Holat | Ustaning joylashuvi yuboriladimi | Mijoz koʻradimi |
|---|---|---|
| `SEARCHING`, `SEARCHING_QUEUED` | Yoʻq | — |
| `ASSIGNED` | Yoʻq (usta hali yoʻlga chiqmagan) | — |
| `MASTER_EN_ROUTE` | **Ha**, har 15 soniyada | **Ha**, xaritada |
| `ARRIVED_PENDING_CONFIRMATION` | Yoʻq (toʻxtaydi) | Oxirgi nuqta, «yetib keldi» |
| `IN_PROGRESS` va keyingilari | Yoʻq | Yoʻq |

Kuzatuv **faqat bitta buyurtma davomida** va **faqat yoʻlda** boʻlgan vaqtda. Smena ochiq
boʻlsa ham, faol ish boʻlmasa hech narsa yuborilmaydi.

### 0.4 Saqlanadigan maʼlumot

Serverda faqat **oxirgi nuqta** (`masters.last_lat/last_lng/last_location_at` — ustunlar
allaqachon bor). Yoʻl izi (trail) saqlanmaydi: u kerak emas va u shaxsiy maʼlumotning eng
ogʻir turi. Buyurtma yopilgach oxirgi nuqta tozalanadi.

### 0.5 Ataylab QILINMAYDI

- Ustani doimiy kuzatish (smena davomida, ishsiz paytda) — hech qachon.
- Yoʻl izini saqlash va koʻrsatish.
- Mijozning joylashuvini ustaga uzatish (ustaga manzil matni va nuqtasi yetarli).
- Navigatsiya (burilishlar) ilova ichida — usta tugmani bosib Yandex Navigator yoki
  Google Mapsʼni ochadi (bu ruxsat etilgan: shunchaki tashqi ilovaga havola).

---

## 1. Texnik zanjir

```
Usta telefoni                Server                     Mijoz telefoni
─────────────                ──────                     ──────────────
Geolocation (15 s)  ──►  POST /master/orders/:id/location
                              │  masters.last_* yangilanadi
                              │  WS: order.master_location
                              ▼
                         OSRM (60 s da bir)  ──►  eta_minutes yangilanadi
                                                        │
                                                        ▼
                                              MapLibre xaritasi:
                                              usta nuqtasi + manzil pini
```

### 1.1 Usta tomoni (Capacitor)

- `@capacitor/geolocation` — ilova ochiq boʻlganda.
- `@capacitor-community/background-geolocation` — ilova fonda boʻlganda: Androidʼda
  **foreground service** va doimiy bildirishnoma («Hizmat24 — yoʻldasiz»). Bu Play Store
  talab qiladigan yagona toʻgʻri naqsh.
- Yuborish: har 15 soniya YOKI 50 metrdan ortiq siljiganda (qaysi biri avval boʻlsa).
- Ulanish yoʻqolsa: oxirgi 5 nuqta navbatda saqlanadi va ulanish tiklanganda bittasi
  (eng yangisi) yuboriladi — eski nuqtalar tashlanadi.
- Aniqlik past boʻlsa (`accuracy > 100 m`) nuqta yuborilmaydi va ekranda «Signal zaif» deb yoziladi.

### 1.2 Server

- `POST /master/orders/:id/location` — `{lat, lng, accuracy, recordedAt}`; faqat ish egasi
  usta va faqat `MASTER_EN_ROUTE` holatida qabul qilinadi, aks holda `409`.
- Rate limit: daqiqada 10 marta.
- WS hodisasi `order.master_location` — faqat oʻsha buyurtma mijoziga.
- OSRM soʻrovi (60 soniyada bir): `eta_minutes` va `distance_m` yangilanadi, ular ham
  WS orqali ketadi.
- OSRM oʻzimizning konteynerda (`docker-compose`): `osrm-backend` + Oʻzbekiston OSM
  ekstrakti (Geofabrik). Yangilanish oyiga bir marta.

### 1.3 Mijoz tomoni

- `MapCanvas` — MapLibre GL JS; plitkalar oʻz tile-serverimizdan yoki MapTilerʼdan.
- Ikkita marker: manzil (pin) va usta (doira). Usta nuqtasi **silliq** harakatlanadi
  (`requestAnimationFrame` bilan interpolatsiya, 15 soniyada sakrash emas).
- Kamera: ikkala nuqta koʻrinadigan qilib moslashadi; foydalanuvchi xaritani surgach
  avtomatik moslash toʻxtaydi (kichik «Markazga qaytish» tugmasi chiqadi).
- Xarita yuklanmasa yoki plitka kelmasa: ekran hozirgi matnli koʻrinishga tushadi
  («qachon keladi, kim keladi, qanday bogʻlanaman») — bu regressiya emas, zaxira.

---

## 2. Bosqichlar

### K1 — Manzilda koordinata (B3 bilan birga)

**Maqsad:** buyurtma manzilida `lat/lng` paydo boʻladi — usiz xarita maʼnosiz.

- Buyurtma oqimining manzil qadamiga **xaritadan nuqta tanlash** qoʻshiladi: xarita ochiladi,
  markazdagi pin — tanlangan nuqta; foydalanuvchi uni suradi. Matn maydoni qoladi (uy, podez).
- Boshlangʻich markaz: qurilma joylashuvi (ruxsat berilsa) yoki Toshkent markazi.
- Saqlangan manzillarga ham `lat/lng` qoʻshiladi (eski yozuvlarda `null` — ular ishlayveradi).
- Server: `orders.address_lat/lng` nullable boʻlib qoladi (koordinatasiz eski buyurtmalar uchun).

**Qabul:** yangi buyurtmada koordinata bor; eski saqlangan manzil bilan buyurtma berish ham
ishlaydi, faqat xaritasiz.
**APK:** `hizmat24-xarita-1-manzil.apk`

### K2 — Ustaning joylashuvi serverga (B5 dan keyin)

**Maqsad:** usta yoʻlga chiqqanda telefon joylashuvni yuboradi.

- Capacitor plaginlari, Android ruxsatlari (`ACCESS_FINE_LOCATION`, `FOREGROUND_SERVICE_LOCATION`),
  foreground service va bildirishnoma matni.
- Ruxsat soʻrash ekrani: **nima uchun** kerakligi bitta jumlada, rad etilsa ish davom etadi
  (kuzatuvsiz) — majburlash yoʻq.
- Server endpointi + WS hodisasi.
- Usta ekranida kichik holat qatori: «Joylashuv yuborilmoqda» / «Signal zaif» / «Oʻchirilgan».

**Qabul:** ikkinchi telefonda usta yoʻlga chiqqanda serverda `last_location_at` yangilanadi;
ilova fonga oʻtsa ham yangilanish davom etadi; ish yakunlangach toʻxtaydi.
**APK:** `hizmat24-xarita-2-joylashuv.apk`

### K3 — Mijozdagi jonli xarita

**Maqsad:** «Usta yoʻlda» ekrani haqiqiy xaritaga aylanadi.

- `MapCanvas` komponenti, MapLibre + plitkalar; ikkita marker, silliq harakat, kamera.
- OSRM ETA va masofa; «~12 daqiqa · 3,4 km» qatori.
- Halol holatlar: «Signal yoʻq — oxirgi maʼlumot 2 daqiqa oldin», «Usta joylashuvni
  yoqmagan — faqat vaqt koʻrsatiladi».
- `/app/master/limits` roʻyxatidan «Jonli xarita, GPS, masofa» qatori olib tashlanadi.

**Qabul:** ikki telefon: usta harakatlanadi — mijozda nuqta siljiydi va ETA yangilanadi;
usta telefonida internet oʻchirilsa, mijozda «oxirgi maʼlumot …» deb yoziladi.
**APK:** `hizmat24-xarita-3-jonli.apk`

### K4 — Sayqal va siyosat

- Batareya oʻlchovi: 30 daqiqalik yoʻlda qancha sarflanadi (maqsad < 5%).
- Play Console: foreground service turi eʼlon qilinadi; maxfiylik siyosati matni
  (qanday maʼlumot, qancha saqlanadi, kim koʻradi).
- Ilova ichida: Profil → «Maxfiylik» sahifasi, joylashuv boʻlimi bilan.
- Oʻchirish: usta joylashuvni oʻchira oladi; bu ish olishga taʼsir qilmaydi
  (faqat mijoz xaritani koʻrmaydi).

**APK:** `hizmat24-xarita-4-reliz.apk`

---

## 3. Xarajat va xavflar

| Narsa | Xarajat | Izoh |
|---|---|---|
| MapLibre | 0 | Ochiq kod |
| OSM plitkalari | 0 — oʻzimizda | Yoki MapTiler bepul limiti (oyiga ~100k) |
| OSRM | ~5–10 $/oy VPS | Oʻzbekiston ekstrakti ~150 MB, 1 GB RAM yetarli |
| Geokoding (manzil qidiruvi) | 0 | Nominatim oʻzimizda; sifat pastroq — shuning uchun K1 da xaritadan nuqta tanlash |

| Xavf | Nima qilamiz |
|---|---|
| Toshkentda OSM uy raqamlari toʻliq emas | K1 da manzil **xaritadan** tanlanadi, qidiruvga tayanmaymiz |
| Android background location Play tekshiruvi | Foreground service + bildirishnoma; deklaratsiya K4 da |
| Batareya shikoyati | 15 soniyalik interval, faqat yoʻlda, ish tugagach darhol toʻxtash |
| Yandexʼga oʻtish kerak boʻlsa | Xarita bitta komponentda; tijorat litsenziyasi kelsa almashtiriladi |
| Usta joylashuvni bermasa | Ekran buni aytadi va ish oqimi buzilmaydi |
