# Hizmat24 — usta ilovasi TZ

Bitta APK ichida ikki rejim: mijoz va usta. Usta rejimi — toʻrt tabli alohida qobiq (Ishlar · Tarix · Daromad · Profil), oʻz marshrutlari, oʻz pastki paneli va oʻz ovozi bilan.
Takliflar hech qayerdan toʻqilmaydi: usta shu qurilmada, mijoz rejimida berilgan haqiqiy buyurtmalarni koʻradi va ularni qabul qiladi.
Usta ishni qabul qilgan zahoti `SERVER_STEPS` taymeri oʻsha buyurtmaga tegmaydi — beshta soxta oʻtishdan toʻrttasini endi tirik odam tugma bilan bajaradi.
Har bir raqam izlanadigan boʻladi: narx — mijoz kelishgan muzlatilgan `invoice`, daromad — yopilgan ishlarning yigʻindisi, baho — shu telefonda mijoz qoʻygan yulduz, ETA — ustaning oʻzi tanlagan daqiqa.
Ilova qila olmaydigan narsa (yozishuv, jonli xarita, push, pul oʻtkazish, foto, komissiya foizi) qilinmaydi va har biri ekranda bitta rost jumla bilan aytiladi.

---

## 0. Qarorlar

### 0.1 Takliflar maʼlumot modeli — BITTA QURILMA, BITTA DUNYO

Usta uchun yagona maʼlumot manbai — `useApp().orders`. Parallel «demo ish» obyektlari, soxta mijozlar, soxta `shortId`lar YARATILMAYDI.

| Roʻyxat | Shart |
|---|---|
| Takliflar | `status ∈ {SEARCHING, SEARCHING_QUEUED}` · `!handledByMaster` · `!declinedOrderIds.includes(id)` · `profile.isAvailable` |
| Faol ish | `handledByMaster && !isTerminal(status)` |
| Tarix | `handledByMaster && isTerminal(status)` |

Ekran boʻsh qolmasligi uchun **soxta yozuv emas, haqiqiy buyurtma** yaratiladi: boʻsh holatdagi ghost tugma `createDemoOrder()` ni chaqiradi va u `createOrder` yoʻlidan oʻtib chinakam `LiveOrder` yasaydi (ikkala rejimda ham koʻrinadi).

UI jumlasi (Ishlar tabida, doimiy `Banner variant="info"`):
> «Server ulanmagan. Takliflar shu telefonda mijoz rejimida berilgan buyurtmalardan keladi; boshqa odamlarning buyurtmalari ilovaga tushmaydi.»

### 0.2 Taymer topshirigʻi

`SERVER_STEPS` va `waitMsFor` `store.tsx` dan sof `src/lib/orderSimulation.ts` ga koʻchiriladi. Yangi predikat `simulationStep(order, masterTakeover)` `null` qaytaradi, agar:
1. `order.handledByMaster === true` (har qanday holatda), yoki
2. `masterTakeover === true` va status `SEARCHING | SEARCHING_QUEUED` (`masterTakeover = isMasterProfileComplete(profile) && profile.isAvailable`).

Predikat **ikki joyda** tekshiriladi: rejalashtirish effektida va `applyServerStep` ichidagi `setState` da (kutayotgan eski `setTimeout` oʻq uzishi mumkin). Effekt endi keraksiz kalitlarni `clearTimeout` qiladi — bugun u faqat qoʻshadi.

UI jumlasi (Smena bloki):
> «Smena ochiq boʻlsa, shu qurilmadagi buyurtmani taymer emas, siz bosgan tugmalar yuritadi.»

### 0.3 Komissiya modeli — RAQAM YOʻQ

`MASTER_COMMISSION_PERCENT: number | null = null`. Sof daromad hisoblanmaydi va koʻrsatilmaydi; Daromad ekrani faqat **naqd qoʻlga tekkan** summani koʻrsatadi. Egasi foizni aytgan kunda faqat shu konstanta oʻzgaradi.

UI jumlasi (Daromad ekranida, eng katta raqamdan TEPADA):
> «Bu — mijozlar sizga naqd bergan summa. Ilova pulni saqlamaydi va oʻtkazmaydi. Platforma komissiyasi foizi hali belgilanmagan, shuning uchun sof daromad hisoblanmaydi.»

### 0.4 Rol kirishi

Bitta raqam, bitta OTP, bitta sessiya, ikki REJIM. Kirish ekranida ikkita tugma boʻlmaydi.
- `/app` index marshruti rolga qarab ayriladi: `master` → `/app/master/jobs`, `client` → `/app/home`, `role === null` (eski sessiya) → `/app/mode`.
- Yangi ekran `/app/mode` — rejim tanlash/almashtirish/gvardiya tushiradigan yagona joy.
- Yangi gvardiya `RequireRole`; usta marshrutlari `role: "master"` bayrogʻini oladi.
- Yangi amal `setRole(role)`; `completeOnboarding` faqat tanishtiruvda qoladi.

UI jumlasi (LoginScreen, tugma tagida):
> «Mijoz ham, usta ham shu raqam orqali kiradi — rejimni keyingi qadamda tanlaysiz.»

UI jumlasi (`/app/mode`, Banner):
> «Ikki rejim ham bitta telefon raqamiga bogʻlangan — alohida hisob ochilmaydi. Rejimni almashtirganda buyurtmalaringiz ham, usta profilingiz ham qurilmada saqlanib qoladi.»

### 0.5 Ataylab QURILMAYDIGAN narsalar

Har biri `/app/master/limits` sahifasida bitta roʻyxat boʻlib turadi va oʻz joyida `DashedChip "Tez orada"` bilan takrorlanadi. Hech biri uchun bosiladigan tugma chizilmaydi.

| Narsa | Ekrandagi aynan shu jumla |
|---|---|
| Yozishuv (chat) | «Yozishuv yoʻq — mijoz bilan faqat telefon orqali gaplashasiz.» |
| Jonli xarita, GPS, masofa | «Ilova joylashuvingizni bilmaydi. Mijoz sizning yoʻlda ekaningizni siz tugmani bosganingizda koʻradi.» |
| Push bildirishnoma | «Yangi taklif kelganda telefon ovoz chiqarmaydi: bildirishnoma serverdan keladi, server ulanmagan.» |
| Pul oʻtkazish, yechish, hisob raqami | «Pulni mijozdan naqd olasiz. Ilovada hisob ham, pul yechish ham yoʻq.» |
| Ish fotosi | «Ish surati hozircha yuklanmaydi: qurilmada kamera moduli ulanmagan. Ishni matn bilan tasvirlaysiz.» |
| Hujjat/sertifikat tekshiruvi | «Sertifikat ilovada tekshirilmaydi. U hamma joyda «oʻzim aytdim, tekshirilmagan» deb belgilanadi.» |
| Boshqa odamlarning buyurtmalari | «Server ulanmagan — boshqa mijozlarning buyurtmalari ilovaga tushmaydi.» |
| Narxni oʻzgartirish | «Narxni oʻzgartirish yoʻq: summa buyurtma berilganda kelishilgan va chekda shu turadi.» |
| Komissiya foizi va sof daromad | «Platforma komissiyasi foizi hali belgilanmagan — sof daromad koʻrsatilmaydi.» |
| Tumanlar boʻyicha filtr | «Tumanlar arizada koʻrsatiladi. Buyurtma manzilida tuman maydoni yoʻq, shuning uchun roʻyxat tuman boʻyicha filtrlanmaydi.» |

### 0.6 Bahsli nuqtalar — qaror va sababi (bitta qator)

| Savol | QAROR | Sabab |
|---|---|---|
| 4-chi tab «Jadval» boʻlsinmi? | YOʻQ — oʻrniga **Tarix** | `schedule.ts` bandlik maʼlumoti yoʻqligini yozib qoʻygan, demak jadval tabi hech qachon toʻlmaydi; tarix esa birinchi kundan toʻladi. |
| `Master.ratingAvg` tipini `number \| null` qilinsinmi? | YOʻQ — tip qoladi, `masterRatingLabel()` qorovuli qoʻyiladi | 26 ta havola va 3 ta test fixture oʻzgaradi, halollik natijasi esa bir xil: `completedOrdersCount === 0` boʻlsa yulduz emas, matn chiziladi. |
| Smena holati sessiyaga qoʻshilsinmi? | YOʻQ — `hizmat24:master:v1` ichida qoladi | Sessiya sxemasi oʻzgarsa har bir oʻrnatilgan qurilmada migratsiya boʻladi; «ishga tayyorman» allaqachon usta slice ichida. |
| Ekranni toʻldirish uchun demo yozuvlar ekilsinmi? | YOʻQ — faqat haqiqiy buyurtma yaratadigan tugma | Parallel model har bir amalni ikki yoʻlga boʻladi va bir kun kelib soxta summa mijoz hamyoniga sizib oʻtadi. |
| `IN_PROGRESS` da usta bekor qila oladimi? | YOʻQ — faqat `ASSIGNED` va `MASTER_EN_ROUTE` da | Mijoz eshik oldida tasdiqlagandan keyin ish boshlangan; chiqish yoʻli — qoʻllab-quvvatlash, bekor qilish emas. |
| Narx kelishuvi (qoʻshimcha summa) kirsinmi? | YOʻQ (v1 da) | Yarim yechim chekdagi summani ustaning qoʻlidagi puldan ajratadi; toʻliq yechim mijoz ekranlarini ham qayta ochadi. |
| Yangi status (OFFERED/DECLINED/EXPIRED) qoʻshilsinmi? | YOʻQ | 10 ta statusli grafik ikkala tomon uchun yagona; ustaning tugmalari mavjud beshta oʻtishni almashtiradi, koʻpaytirmaydi. |
| Taklif muddati (countdown) boʻlsinmi? | YOʻQ | Muddat tugagach buyurtmani qayta taqsimlaydigan dispetcher yoʻq — sanoq ilovaning birinchi ochiq yolgʻoni boʻlardi. |
| Alohida provider/localStorage slice qoʻshilsinmi? | YOʻQ | `declinedOrderIds` va `availableSince` mavjud `MasterProvider` ichiga sigʻadi; oltinchi slice qoʻshimcha revive va test yuki. |
| `master/:masterId` nomi oʻzgarsinmi? | HA — `masters/:masterId` | `master/*` butunlay usta rejimiga tegishli boʻladi; hozir 3 ta chaqiruv joyi, keyin 12 ta boʻladi. |

---

## 1. Axborot arxitekturasi

### 1.1 Usta pastki paneli (4 tab)

`MasterTabKey = "jobs" | "history" | "earnings" | "profile"`. Mijozning `TabKey` i **kengaytirilmaydi** (uchta mavjud test aynan 4 ta mijoz tabini qulflagan); `BottomNav` generik qilinadi va ikkita konfiguratsiya (`CLIENT_TABS`, `MASTER_TABS`) unga uzatiladi.

| Tab | Yorliq | Ikona (Phosphor, duotone/fill) | Marshrut | Badge |
|---|---|---|---|---|
| `jobs` | Ishlar | `Wrench` | `/app/master/jobs` | faqat HAQIQIY takliflar soni |
| `history` | Tarix | `ClockCounterClockwise` | `/app/master/history` | yoʻq |
| `earnings` | Daromad | `Money` | `/app/master/earnings` | yoʻq |
| `profile` | Profil | `User` | `/app/master/profile` | yoʻq |

Yorliq «Ishlar», «Buyurtmalar» EMAS — mijoz paneli allaqachon «Buyurtma» soʻziga egalik qiladi va bitta APK ichida ikki bir xil soʻz ikki rejimni bitta qilib koʻrsatadi. Toʻrt yorliq ham ≤ 7 belgidan iborat (360px).

### 1.2 Marshrutlar jadvali

| Marshrut | Ekran | `role` gvardiyasi | Maqsad (bir qator) |
|---|---|---|---|
| `/app` (index) | ayrilish | — | Rolga qarab `/app/master/jobs` yoki `/app/home` ga yuboradi. |
| `/app/mode` | `ModeScreen` | yoʻq (hech qachon!) | Rejim tanlash, almashtirish va gvardiya sababini aytish. |
| `/app/master` | `<Navigate replace>` | `master` | Eski havolalar uchun `/app/master/jobs` ga yoʻnaltirish. |
| `/app/master/jobs` | `MasterJobsTab` | `master` | Smena boshqaruvi, takliflar va faol ish — usta uyi. |
| `/app/master/jobs/:orderId` | `MasterJobScreen` | `master` | Bitta ishning tafsiloti va holatga mos yagona asosiy tugma. |
| `/app/master/jobs/:orderId/finish` | `MasterFinishScreen` | `master` | Ish izohi bilan `IN_PROGRESS → COMPLETED_BY_MASTER`. |
| `/app/master/history` | `MasterHistoryTab` | `master` | Yakunlangan va bekor qilingan ishlar, sana boʻyicha guruhlangan. |
| `/app/master/earnings` | `MasterEarningsTab` | `master` | Yopilgan ishlardan naqd qoʻlga tekkan summa va lokal baho. |
| `/app/master/profile` | `MasterProfileTab` | `master` | Shaxs, profil toʻliqligi, ariza, rejim almashtirish, yordam. |
| `/app/master/limits` | `MasterLimitsScreen` | `master` | Ilova hozir nimani qila olmasligining yagona rost roʻyxati. |
| `/app/master/setup` | `MasterSetup` (mavjud) | `master` | 5 qadamli usta profili — oʻzgarmaydi. |
| `/app/master/settings` | `MasterSettings` (mavjud) | `master` | Profil maydonlarini tahrirlash va profilni oʻchirish. |
| `/app/master/apply` | `MasterApply` (mavjud) | `master` | Ariza matnini tayyorlash va qoʻlda yuborish. |
| `/app/masters/:masterId` | `MasterProfile` (mijoz) | yoʻq | Mijozga koʻrinadigan usta profili — `master/:masterId` dan koʻchirildi. |

`ROOT_ROUTES` ga toʻrtta usta tab marshruti qoʻshiladi; `/app/master/jobs` da apparat «orqaga» `false` qaytaradi (ilovadan chiqish), xuddi `/app/home` kabi. `/app/mode` `ROOT_ROUTES` ga QOʻSHILMAYDI — u alohida qoida bilan ishlanadi.

### 1.3 Oʻzgaradigan mijoz ekranlari

| Ekran | Nima oʻzgaradi |
|---|---|
| `OrderTracking` | `handledByMaster` buyurtmada dashed «Demo ·» chiplari chizilmaydi; bekor qilish matni `cancelledBy` boʻyicha tarmoqlanadi. |
| `MasterEnRoute` | ETA manbai matni: «Vaqtni usta oʻzi koʻrsatdi»; `etaMinutes === null` boʻlsa vaqt qatori umuman chizilmaydi. |
| `WorkProof` | Ustaning `workNote` matni koʻrsatiladi; foto bloki oʻzgarmaydi. |
| `ProfileTab` (mijoz) | «Rol» qatori → «Rejim», `onSelect` → `/app/mode`; `completeOnboarding` chaqiruvi olib tashlanadi. |
| `OnboardingScreen` | Yakunda `HOME_ROUTE_FOR[role]` ga oʻtadi; rol kartalari `ModeChoiceCards` komponentidan keladi. |
| `LoginScreen` | Tugma ostiga bitta tushuntiruvchi qator qoʻshiladi. |

---

## 2. Holatlar jadvali

| ORDER_STATUS | Usta ekrani | Usta amali | Yangi holat | Mijoz nimani koʻradi |
|---|---|---|---|---|
| `SEARCHING` | Ishlar → Takliflar | «Qabul qilish» (ETA majburiy) | `ASSIGNED` | Stepper 2-qadam, usta kartasi (baho oʻrniga «Hali baho yoʻq»), «Taxminiy yetib kelish: ~20 daqiqa», demo chip yoʻqoladi |
| `SEARCHING` | Ishlar → Takliflar | «Rad etish» | oʻzgarmaydi (faqat `declinedOrderIds`) | Hech narsa oʻzgarmaydi; taymer yana ishlaydi va mock usta tayinlanadi |
| `SEARCHING_QUEUED` | Ishlar → Takliflar | «Qabul qilish» / «Rad etish» | `ASSIGNED` / oʻzgarmaydi | Yuqoridagidek; navbat qatori oʻrnini usta kartasi egallaydi |
| `ASSIGNED` | Ish kartasi | «Yoʻlga chiqdim» (ETA tuzatilishi mumkin) | `MASTER_EN_ROUTE` | Chip «Usta yoʻlda», `/app/order/:id/map` ochiladi, ETA ustaning raqami |
| `ASSIGNED` | Ish kartasi | «Ishni bekor qilish» (sabab majburiy) | `CANCELLED` (`cancelledBy: "MASTER"`) | «Usta bekor qildi. Sabab: …» + «Hech qanday pul yechilmagan» |
| `MASTER_EN_ROUTE` | Ish kartasi | «Yetib keldim» | `ARRIVED_PENDING_CONFIRMATION` | Bloklovchi ekran `/confirm-master` majburan ochiladi |
| `MASTER_EN_ROUTE` | Ish kartasi | «Ishni bekor qilish» | `CANCELLED` (`MASTER`) | Yuqoridagidek |
| `ARRIVED_PENDING_CONFIRMATION` | Ish kartasi (kutish) | Davom ettirish tugmasi YOʻQ; «Mijoz rejimiga oʻtish» va «Qoʻllab-quvvatlash» | — | Shaxsni tasdiqlash ekrani: «Ha, shu usta» / «Bu men chaqirgan usta emas» |
| `IN_PROGRESS` | Ish kartasi | «Ishni yakunlash» → `/finish` | `COMPLETED_BY_MASTER` | Baholash ekraniga oʻtadi; `/proof` da ustaning izohi paydo boʻladi |
| `IN_PROGRESS` | Ish kartasi | «Qoʻllab-quvvatlash» (bekor qilish YOʻQ) | — | Oʻzgarmaydi |
| `COMPLETED_BY_MASTER` | Ish kartasi (kutish) | Tugma yoʻq | — | Baho beradi; baho buyurtmani `CLOSED` qiladi |
| `CLOSED` | Tarix · Daromad | Faqat oʻqish (baho, teglar, izoh, chek summasi) | — | Chek, baho, qayta buyurtma |
| `CANCELLED` | Tarix | Faqat oʻqish + «Qoʻllab-quvvatlash» | — | Kim bekor qilgani va sababi |
| `SAFETY_FLAGGED` | Tarix | «Qoʻllab-quvvatlash» | — | Xavfsizlik natijasi ekrani |

Ikki oʻtish ustaga HECH QACHON berilmaydi: `ARRIVED_PENDING_CONFIRMATION → IN_PROGRESS` (mijozning shaxs tasdigʻi) va `COMPLETED_BY_MASTER → CLOSED` (mijozning bahosi). Ikkalasi ham ekranda sababi bilan yoziladi.

---

## 3. Maʼlumot modeli

### 3.1 Yangi maydonlar

`src/app/types.ts` — `LiveOrder` ga ikkita maydon:

```ts
// Buyurtmani kim yuritadi. true boʻlgach hech qanday SERVER_STEPS taymeri
// rejalashtirilmaydi va mijoz ekranidagi dashed "Demo" chip chizilmaydi.
handledByMaster: boolean;   // default false
// Usta yakunlashda yozgan izoh. Mijoz uni /app/order/:id/proof da koʻradi.
workNote: string | null;    // default null, trim + 300 belgi
```

`src/lib/masterProfile.ts` — `MasterProfile` ga bitta maydon:

```ts
// Smena qachon ochilgani. isAvailable=false boʻlsa doim null.
availableSince: Date | null;   // EMPTY_MASTER_PROFILE da null
```

`src/app/master-persistence.ts` — `MasterState` ga bitta maydon:

```ts
declinedOrderIds: string[];    // default [], faqat string, 200 tagacha kesiladi
```

Yangi `localStorage` kaliti YOʻQ. Ikkala kengaytma mavjud kalitlarga tushadi:
- `hizmat24:session:v1` → `handledByMaster`, `workNote` (order ichida)
- `hizmat24:master:v1` → `declinedOrderIds`, `profile.availableSince`

Revive qoidalari (maydonma-maydon, bitta buzuq qiymat butun yozuvni oʻldirmaydi):

| Maydon | Buzuq/yoʻq boʻlsa |
|---|---|
| `handledByMaster` | `false` |
| `workNote` | `null`; 300 belgidan uzun boʻlsa kesiladi |
| `availableSince` | `null`; `isAvailable === false` boʻlsa majburan `null` |
| `declinedOrderIds` | `[]`; string boʻlmagan element tashlanadi, dublikat olib tashlanadi, 200 ta bilan cheklanadi |

### 3.2 `AppProvider` ning yangi amallari (`src/app/store.tsx`)

```ts
setRole(role: UserRole): void;
masterAcceptOrder(orderId: string, input: { master: Master; etaMinutes: number }): boolean;
masterDepart(orderId: string, etaMinutes: number): void;
masterArrive(orderId: string): void;
masterFinish(orderId: string, workNote: string): void;
masterCancelOrder(orderId: string, reason: string): void;
createDemoOrder(): string | null;
setMasterTakeover(on: boolean): void;   // MasterProvider dan yuqoriga koʻtariladi
```

Qoidalar:
- Har bir amal `setState` ICHIDA statusni qayta tekshiradi va mos kelmasa no-op qiladi (taymer bilan poyga xavfsiz).
- Har bir amal patchni `src/app/masterActions.ts` dagi sof quruvchidan oladi; `buildStepPatch` yagona manba boʻlib qoladi.
- `masterAcceptOrder` `handledByMaster: true` yozadi va `etaMinutes` ni ustaning tanlovi bilan almashtiradi (qattiq yozilgan `15` usta yoʻlida OʻLADI).
- `masterCancelOrder` — ilovadagi birinchi joy, u `cancelledBy: "MASTER"` yozadi.
- `advanceOrder` boshiga qorovul: `handledByMaster === true` boʻlsa hech narsa qilmaydi.
- `createDemoOrder` mavjud `createOrder` quvuridan oʻtadi: kategoriya `c-tap`, manzil yorligʻi «Demo manzil», `paymentMethod: "CASH"`.

`store.tsx` bugun **485 qator** (chegara 500). Shu sababli `SERVER_STEPS`, `waitMsFor` va barcha patch quruvchilar fayldan chiqariladi — bu ixtiyoriy emas.

### 3.3 `MasterProvider` ning yangi amallari (`src/app/master-store.tsx`)

```ts
declineOffer(orderId: string): void;
undeclineOffer(orderId: string): void;
openShift(): void;    // updateProfile({ isAvailable: true, availableSince: new Date() })
closeShift(): void;   // updateProfile({ isAvailable: false, availableSince: null })
```

`resetMaster()` `declinedOrderIds` ni ham tozalaydi. Bitta effekt: `setMasterTakeover(isComplete && profile.isAvailable)`.

### 3.4 Yangi sof modullar va testlari

| Fayl | Eksportlar | Majburiy test holatlari |
|---|---|---|
| `src/lib/orderSimulation.ts` | `SERVER_STEPS`, `SimulationStep`, `simulationStep(order, masterTakeover)`, `waitMsFor(order, delayMs, now)`, `simulationTimerKey(order)`, `demoActionLabel(order, masterTakeover)`, `etaSourceLine(order)` | `SEARCHING` + takeover=false → `{ASSIGNED, 3500}`; `SEARCHING`/`SEARCHING_QUEUED` + takeover=true → null; `ASSIGNED` + takeover=true + `handledByMaster:false` → qadam QAYTADI; `handledByMaster:true` → beshta statusda ham null; terminal statuslar → null; `waitMsFor` rejalashtirilgan buyurtmada faqat birinchi qadamni suradi va manfiy qaytarmaydi; `demoActionLabel` `handledByMaster` da null; matnlarda ASCII apostrof yoʻq |
| `src/lib/masterJobs.ts` | `MasterJobFilter = "offers" \| "active"`, `MASTER_FILTER_LABELS`, `adjacentMasterFilter`, `MASTER_STEPPER_LABELS`, `MASTER_STATUS_CHIPS`, `MasterAction`, `MASTER_ACTION_LABELS`, `getMasterActions(status)`, `masterWaitingCopy(status)`, `isOffer(order, declinedIds, isAvailable)`, `isMyJob(order)`, `splitMasterJobs(...)`, `countMasterJobs(...)`, `masterJobFactLine(order, now)`, `canAcceptOffer({isComplete, hasActiveJob})`, `ETA_OPTIONS`, `etaOptionLabel`, `MASTER_CANCEL_REASONS`, `masterEmptyStateFor(...)` | `MASTER_ACTIONS` barcha 10 statusni qamraydi (kalitlar `ORDER_STATUS` bilan solishtiriladi); `ARRIVED_PENDING_CONFIRMATION` va `COMPLETED_BY_MASTER` da holatni suradigan amal YOʻQ, lekin `masterWaitingCopy` bor; `cancel` faqat `ASSIGNED` va `MASTER_EN_ROUTE` da; `handledByMaster:false` ish hech qachon `active` da emas; rad etilgan id `offers` da yoʻq; `isAvailable:false` → nol taklif; `MASTER_STATUS_CHIPS[s].tone === STATUS_CHIPS[s].tone` har bir status uchun, lekin hech bir label mijoz labeli bilan bir xil emas; fakt qatori `etaMinutes` ni faqat `ASSIGNED`/`MASTER_EN_ROUTE` da koʻrsatadi; ASCII apostrof taqiqi |
| `src/lib/masterShift.ts` | `shiftDurationMinutes(profile, now)`, `shiftSinceLine(profile, now)`, `shiftStateLine(profile)`, `shiftHintLine(profile, now)`, `canOpenShift(profile)`, `isWithinWorkHours(profile, now)` | Yopiq smenada davomiylik 0 va `shiftSinceLine` null; `canOpenShift` toʻliq boʻlmagan profilda false; ish vaqtidan tashqarida ochiq smena uchun alohida matn; funksiyalar `new Date()` chaqirmaydi; ASCII apostrof taqiqi |
| `src/lib/masterIdentity.ts` | `SELF_MASTER_ID = "m-self"`, `buildSelfMaster(input)`, `isSelfMaster(master)`, `masterJobStats(orders)`, `masterRatingLabel(master, stats)` | `hasGovCertificate` `claimsCertificate:true` boʻlsa ham DOIM false; `isPremium` doim false, `photoUrl` doim undefined; `completedOrdersCount` faqat `handledByMaster && CLOSED` dan; baho yoʻq boʻlsa `ratingAvg: 0` + `masterRatingLabel` «Hali baho yoʻq»; `fullName` boʻsh boʻlsa `formatPhone(phoneNumber)`; `isSelfMaster(MASTERS.akmal) === false` |
| `src/lib/masterEarnings.ts` | `MASTER_COMMISSION_PERCENT: number \| null = null`, `MasterEarningsView`, `buildMasterEarnings(orders, now, months?)`, `masterMonthlySeries(orders, now, months)`, `COLLECTED_CAPTION`, `COMMISSION_HINT` | Faqat `handledByMaster && CLOSED` sanaladi (`COMPLETED_BY_MASTER`, `CANCELLED`, mock usta ishi — nol); summa muzlatilgan `invoice.total` dan, `basePrice` dan qayta hisoblanmaydi; baho yoʻq boʻlsa `ratingAvg: null` (0 emas); boʻsh roʻyxatda hamma qiymat 0 va `NaN` yoʻq; belgilangan `now` bilan natija determinstik |
| `src/app/masterActions.ts` | `buildAcceptPatch(order, master, etaMinutes)`, `buildDepartPatch(order, etaMinutes)`, `buildArrivePatch(order)`, `buildFinishPatch(order, workNote, now)`, `buildMasterCancelPatch(order, reason)` | `buildAcceptPatch` `ASSIGNED` + `handledByMaster:true` + tanlangan ETA (15 EMAS); `buildMasterCancelPatch` `cancelledBy:"MASTER"` va `etaMinutes:null`; `buildFinishPatch` `completedAt` yozadi va `etaMinutes` ni tozalaydi (`buildStepPatch` bilan bir xil); `workNote` trim + 300 belgi; har bir quruvchi kirish obyektini oʻzgartirmaydi |
| `src/app/masterTabRoutes.ts` | `MasterTabKey`, `MASTER_TAB_ROUTES`, `MASTER_TABS` | Aynan 4 ta kalit; har bir qiymat `/app/master/` bilan boshlanadi; har biri `PROTECTED_ROUTES` da bor; har biri `ROOT_ROUTES` da bor; mijoz `TAB_ROUTES` qiymatlari bilan kesishmaydi |
| `src/lib/appMode.ts` | `MODE_LABELS`, `MODE_SHORT_LABELS`, `MODE_DESCRIPTIONS`, `MASTER_ROUTES`, `HOME_ROUTE_FOR`, `modeHome(role)`, `landingRoute(input)`, `entryRouteFor(role, opts)`, `parseNextRoute(raw, target)`, `parseModeReason(raw)`, `switchToastFor(mode)` | `landingRoute` toʻrt holatni qaytaradi, `hasOnboarded && role===null` → `/app/mode`; `modeHome(null)` → `/app/mode`; `entryRouteFor("master", {hasMasterSteps:false})` → `/app/master/setup?step=profession`; `parseNextRoute` rad etadi: `https://…`, `//x`, mijoz marshruti, `MASTER_ROUTES` da yoʻq yoʻl, 100 belgidan uzun search; ASCII apostrof taqiqi |

### 3.5 Yangi komponentlar (testsiz — sof mantiq libda)

| Fayl | Props | Eslatma |
|---|---|---|
| `src/app/MasterTabBar.tsx` | `{ active: MasterTabKey; badges?: Partial<Record<MasterTabKey, number>> }` | `AppTabBar` ning aynan nusxasi, `MASTER_TAB_ROUTES` ustida |
| `src/components/BottomNav.tsx` (refaktor) | `<K extends string>({ items, active, onSelect, badges, className })` | Geometriya (h-tab-bar, `weight="fill"`, `UnreadBadge`) oʻzgarmaydi; `TabKey` va `CLIENT_TABS` shu faylda qoladi |
| `src/components/master/ShiftHero.tsx` | `{ profile, now, onOpen, onClose, disabled, disabledHint }` | `.banner-field` sathi, Toggle EMAS — toʻliq kenglikdagi `Button` |
| `src/components/master/MasterJobCard.tsx` | `{ order, now, variant: "offer" \| "active" \| "compact", onOpen, onAction }` | `OrderListCard` geometriyasi: `ServicePhoto h-[56px] w-[84px]`, `line-clamp-2`, `.tabular` shortId, `splitFormattedPrice` |
| `src/components/master/MasterHistoryRow.tsx` | `{ order, now, onOpen }` | `OrderHistoryRow` geometriyasi: 56×56 foto, inline `StatusChip`, `.tabular` summa |
| `src/components/ModeChoiceCards.tsx` | `{ value: UserRole \| null; onChoose: (mode: UserRole) => void; masterHint?: string }` | `/app/mode` va `OnboardingScreen` bitta manbadan oʻqiydi |

---

## 4. Ekranlar

Umumiy qoidalar (har bir ekranga tegishli, quyida takrorlanmaydi):
- Har bir ekran `ScreenShell` ichida; gorizontal padding (20px) `ScreenShell` dan keladi, ekran uni takrorlamaydi.
- Tab ekranlari oxirida `<div className="h-bottom-reserve" aria-hidden />`.
- **Skeleton yoʻq**: butun maʼlumot `localStorage` dan sinxron tiklanadi, kutish holati mavjud emas. Yagona kutish — `AppLaunch` splash (550 ms), u oʻzgarmaydi.
- **Dark tema**: rang faqat tokenlardan; qoʻlda yasalgan sath chizilmaydi — `Card` ishlatiladi (u `[[data-theme='dark']_&]:border-border` ni oʻzi beradi). `.banner-field` ustidagi matn `text-on-primary-deep`.
- «Hozir» vaqti `useMinuteClock()` dan; komponent ichida `new Date()` chaqirilmaydi.

### 4.1 `/app` — kirish ayrilishi

UI yoʻq. `AppRoutes` index elementi `landingRoute({ isAuthenticated, hasOnboarded, role })` natijasini chizadi: autentifikatsiyasiz → `LoginScreen`; `!hasOnboarded` → `/app/onboarding`; `role === null` → `/app/mode`; aks holda `modeHome(role)`. Halollik: rolsiz sessiya «mijoz» deb TAXMIN QILINMAYDI.

### 4.2 `/app/mode` — «Rejim»

Sarlavha: `Header variant="inner" title="Rejim"`, `onBack` faqat `role !== null` boʻlganda (rolsiz holatda orqaga strelka umuman chizilmaydi).

| # | Blok | Aynan matn |
|---|---|---|
| 1 | `h1` + `p` | «Qaysi tomondan kirasiz?» / «Bitta hisob — ikki rejim. Istalgan vaqt qaytib almashtirasiz.» |
| 2 | `Banner variant="warning"` (faqat `?kerak=usta`) | «Bu boʻlim usta rejimida ochiladi. Quyidan usta rejimini tanlang — sahifa oʻsha zahoti ochiladi.» |
| 3 | `ModeChoiceCards` | Mijoz kartasi (`UserCircle`): «Mijoz rejimi» / «Usta chaqirasiz, buyurtma berasiz va ishni koʻrib turib naqd toʻlaysiz.» · Usta kartasi (`Wrench`): «Usta rejimi» / «Ish takliflarini qabul qilasiz, ishni yuritasiz va yigʻilgan pulni koʻrasiz.» + `masterHint` |
| 4 | `InfoChip tone="primary"` joriy kartada | «Hozirgi rejim» |
| 5 | `Banner variant="info"` | «Ikki rejim ham bitta telefon raqamiga bogʻlangan — alohida hisob ochilmaydi. Rejimni almashtirganda buyurtmalaringiz ham, usta profilingiz ham qurilmada saqlanib qoladi.» |
| 6 | `p.text-caption` | «Usta rejimida takliflar shu telefonda berilgan buyurtmalardan keladi — server ulanmagan.» |

`masterHint`: `isComplete ? "Profil toʻliq" : done === 0 ? "Profil hali boshlanmagan" : "Profil: N/4 qadam"`.
Amal: joriy rejim tanlansa — toast yoʻq, `modeHome(role)` ga `replace` bilan oʻtadi (oʻlik tugma qolmaydi). Boshqa rejim — `setRole(next)` + toast («Usta rejimiga oʻtdingiz» / «Mijoz rejimiga oʻtdingiz») + `parseNextRoute(...) ?? entryRouteFor(next, …)`, doim `replace: true`.
Boʻsh holat yoʻq. Halollik: ekran nima oʻzgarishini (rejim) va nima oʻzgarmasligini (maʼlumot) aytadi.

### 4.3 `/app/master/jobs` — «Ishlar» (usta uyi)

Sarlavha: `Header variant="inner" title="Ishlar"` (orqaga tugmasi yoʻq — ildiz tab). Footer: `<MasterTabBar active="jobs" badges={{ jobs: counts.offers }} />`.

| # | Blok | Komponent | Aynan matn |
|---|---|---|---|
| 1 | Smena | `ShiftHero` (`.banner-field`) | Overline «SMENA»; holat `h2`: «Smenadasiz» / «Smena yopiq»; ochiq boʻlsa `.tabular` qator: «09:14 dan beri · 2 soat 11 daqiqa»; ish vaqti: «Ish vaqtingiz: 09:00 — 18:00»; ish vaqtidan tashqarida ochiq boʻlsa: «Hozir ish vaqtingizdan tashqarisiz — smena baribir ochiq.»; toʻliq kenglikdagi `Button`: yopiq → primary «Smenani boshlash», ochiq → secondary «Smenani yakunlash» |
| 2 | Profil qorovuli (faqat `!isComplete`) | `Card` + `Button variant="secondary"` | «Usta profili toʻldirilmagan» / «N / 4 qadam toʻldirildi. Profil toʻliq boʻlgunicha smena ochilmaydi va taklifni qabul qila olmaysiz.» + «Profilni toʻldirish» → `/app/master/setup?step=<firstIncompleteStep>`; Smena tugmasi `disabled` |
| 3 | Manba bayonoti | `Banner variant="info"` | «Server ulanmagan. Takliflar shu telefonda mijoz rejimida berilgan buyurtmalardan keladi; boshqa odamlarning buyurtmalari ilovaga tushmaydi.» |
| 4 | Filtr | `FilterTabs<MasterJobFilter>` | «Takliflar · N» / «Faol · N» (sanoqlar `countMasterJobs`, `formatTabCount`) |
| 5 | Swipe | `SwipeSurface` + `useSwipe` + `adjacentMasterFilter` | Mijozning «Buyurtma» tabi bilan bir xil jest shartnomasi |
| 6 | Roʻyxat | `MasterJobCard` | Taklif: foto · kategoriya · `.tabular` shortId · `timingLabel` · `InfoChip tone="warning"` «Shoshilinch» · manzil qatori · «Mijoz toʻlaydi: 96 000 soʻm · Naqd» · `Button` «Qabul qilish» + `Button variant="ghost"` «Rad etish». Faol: statusga qarab bitta asosiy tugma — `ASSIGNED` «Yoʻlga chiqdim», `MASTER_EN_ROUTE` «Yetib keldim», `IN_PROGRESS` «Ishni yakunlash»; `ARRIVED_PENDING_CONFIRMATION` tugmasiz + `ring-2 ring-warning` + fakt qatori «Mijoz tasdigʻini kutyapsiz»; `COMPLETED_BY_MASTER` tugmasiz + «Mijoz baholashini kutmoqda» |
| 7 | Bugun | ikkita `StatTile` | «Bugungi ish» (son) va «Bugun olingan naqd» (summa), ikkalasi ham `onSelect` → `/app/master/earnings` |
| 8 | Keyingi reja | `DetailRow` (`CalendarBlank`) | «Ertaga, 14:00 · Chilonzor» → `/app/master/jobs/:id` (rejalashtirilgan faol ish boʻlsa) |

Boʻsh holatlar (`masterEmptyStateFor`), `EmptyState` komponenti bilan:

| Shart | Sarlavha | Tavsif | Amal |
|---|---|---|---|
| Smena yopiq | «Smena yopiq» | «Smenani boshlang — shu qurilmadagi buyurtmalar taklif boʻlib shu yerda chiqadi.» | «Smenani boshlash» |
| Taklif yoʻq | «Hozircha taklif yoʻq» | «Mijoz rejimiga oʻtib bitta buyurtma bering — smena ochiq boʻlsa, u shu yerda taklif boʻlib chiqadi.» | «Mijoz rejimiga oʻtish» (`setRole("client")` + `/app/home`) |
| Faol ish yoʻq | «Faol ish yoʻq» | «Taklifni qabul qilsangiz, ish shu yerda kuzatiladi.» | «Takliflarga oʻtish» |

Boʻsh takliflar holati ostida, IKKINCHI darajali qator: `DashedChip "Demo"` + «Sinab koʻrish uchun shu qurilmada haqiqiy buyurtma yaratiladi.» + `Button variant="ghost"` «Demo · sinov buyurtmasi yaratish» (`createDemoOrder()`).

Halollik belgilari: (a) 3-blokdagi Banner hech qachon yashirilmaydi; (b) tab badge faqat haqiqiy takliflarni sanaydi; (c) masofa, «sizga yaqin», «N ta usta koʻrmoqda», taklif muddati YOʻQ; (d) rad etishdan keyin toast: «Rad etdingiz — buyurtma shu qurilmada boshqa ustaga qoladi.»

### 4.4 `/app/master/jobs/:orderId` — «Ish kartasi»

Sarlavha: `Header variant="inner"` + `MASTER_STATUS_CHIPS[status].label` + `onBack`. Buyurtma topilmasa yoki `!isMyJob && !isOffer` boʻlsa → `<Navigate to="/app/master/jobs" replace />` (hech qachon yiqilmaydi: rol almashtirilganda buyurtma `CANCELLED` boʻlib ketishi mumkin).

| # | Blok | Komponent / matn |
|---|---|---|
| 1 | Bosh karta | `ServicePhoto` + kategoriya + `StatusChip` + `.tabular` shortId |
| 2 | Stepper | `Stepper compact` + `MASTER_STEPPER_LABELS` = «Taklif · Qabul qildim · Yoʻldaman · Ish jarayonida · Yakunladim» |
| 3 | Muammo | `StepSection title="Mijoz yozgani"` → `order.description` |
| 4 | Manzil | `DetailRow` (`MapPin`) → `address.label` + podez/qavat/xonadon; ostida caption: «Manzil mijoz kiritgan matn. Xarita va masofa yoʻq.» |
| 5 | Vaqt | `DetailRow` (`Clock`) → `timingLabel({ scheduledAt, isUrgent }, now)` |
| 6 | Narx | `PriceBreakdown` + caption: «Narx buyurtma berilganda belgilangan va oʻzgarmaydi.» + `DashedChip size="compact"` «Tez orada» + «Platforma komissiyasi foizi hali belgilanmagan — sof daromad koʻrsatilmaydi.» |
| 7 | Mijoz | `Avatar` + ism/raqam + caption: «Bu qurilmada mijoz ham, usta ham — bitta raqam. Shuning uchun qoʻngʻiroq tugmasi chizilmaydi.» (qoʻngʻiroq qatori UMUMAN chizilmaydi) |
| 8 | Kutish kartalari | `ARRIVED_PENDING_CONFIRMATION`: «Mijozning tasdigʻini kutyapsiz» / «Mijoz eshik oldida shaxsingizni tasdiqlaydi. Tasdiqlamaguncha bu yerda tugma boʻlmaydi — bu uning xavfsizlik qadami.» · `COMPLETED_BY_MASTER`: «Mijoz baholaydi» / «Buyurtma mijoz baho bergach yopiladi. Naqd pulni olganingizga ishonch hosil qiling.» |
| 9 | Terminal koʻrinishlar | `CLOSED`: `StarRating` + teglar + izoh, sarlavha «Mijoz bahosi» (baho yoʻq boʻlsa blok chizilmaydi) · `CANCELLED`: `Banner variant="warning"` «Buyurtma bekor qilindi» + «Sabab: …» + kim bekor qilgani · `SAFETY_FLAGGED`: `Banner variant="danger"` «Mijoz eshik oldida ishni toʻxtatdi» + «Bu holatni ilova hal qila olmaydi — qoʻllab-quvvatlashga qoʻngʻiroq qiling.» + `SupportPhoneBlock` |
| 10 | `StickyFooter` | `getMasterActions(status)` boʻyicha tugmalar (2-boʻlimdagi jadval) |

Sheetlar:
- **ETA sheet** — `Sheet` title «Qancha vaqtda yetib borasiz?»; `SelectableChip` qatori `ETA_OPTIONS = [10, 15, 20, 30, 45, 60]` («10 daqiqa» …); hint: «Mijoz aynan shu vaqtni koʻradi. Aniq boʻlmasa, koʻproq vaqt tanlang.»; tugma taklifda «Qabul qilaman», `ASSIGNED` da «Yoʻlga chiqdim».
- **Bekor qilish sheeti** — title «Ishni bekor qilasizmi?»; `SelectableChip` sabablari: «Manzilga yetib bora olmadim» · «Kerakli ehtiyot qism yoʻq» · «Mijoz javob bermadi» · «Ish mening yoʻnalishimda emas» · «Boshqa sabab»; caption: «Bekor qilsangiz, mijoz buni koʻradi va buyurtma yopiladi. Boshqa ustaga oʻtmaydi — server yoʻq.»; tugmalar «Ha, bekor qilaman» (`destructive`) / «Yoʻq» (bir xil oʻlchamda).
- `ARRIVED_PENDING_CONFIRMATION` da `StickyFooter` da ikkita tugma: `Button` «Mijoz rejimiga oʻtish» (`setRole("client")` + `navigate("/app/order/:id/confirm-master")`) va `Button variant="ghost"` «Qoʻllab-quvvatlash». Bu boshi berk koʻchani ochadi: bitta qurilmada mijoz — bu ham siz.

Halollik belgilari: xarita/masofa yoʻq, mijoz raqami yoʻq, narx maydoni yoʻq, «ishni boshlash» tugmasi yoʻq va har uchtasining sababi ekranda yozilgan.

### 4.5 `/app/master/jobs/:orderId/finish` — «Ishni yakunlash»

`status !== IN_PROGRESS` boʻlsa → `<Navigate to="/app/master/jobs/:orderId" replace />`.

| # | Blok | Matn |
|---|---|---|
| 1 | `Header variant="inner" title="Ishni yakunlash" onBack` | — |
| 2 | Xulosa `Card` | `ServicePhoto` + kategoriya + `.tabular` shortId |
| 3 | `Textarea` | Label «Nima qildingiz?», placeholder «Masalan: smesitel almashtirildi, prokladka yangilandi», 0–300 belgi, hisoblagich; hint: «Mijoz buni «Ish isboti» sahifasida koʻradi.» (ixtiyoriy) |
| 4 | Foto qatori (bosilmaydigan `div`, `PaymentMethodRow` namunasi) | Ikona `Camera` (soʻnik plitka) + «Ish suratlari» + `DashedChip "Tez orada"` + «Surat yuklash uchun kamera moduli hali ulanmagan.» |
| 5 | Narx `Card` (faqat oʻqish) | «Mijoz toʻlaydi: 96 000 soʻm · Naqd» + «Narxni oʻzgartirish yoʻq: summa buyurtma berilganda kelishilgan va chekda shu turadi.» |
| 6 | `Banner variant="info"` | «Yakunlagach mijoz ishni baholaydi. Baho kelgach buyurtma yopiladi va Daromad boʻlimiga tushadi. Naqd pulni oʻzingiz olasiz — ilova pul oʻtkazmaydi.» |
| 7 | `StickyFooter` | `Button` «Ishni yakunladim» + `Modal` tasdigʻi: «Mijozda baholash ekrani ochiladi. Bu amalni qaytarib boʻlmaydi.» → «Ha, yakunladim» / «Yoʻq» |

Amal: `masterFinish(orderId, note)` → toast «Ish yakunlandi — mijoz baholashini kutamiz» → `navigate("/app/master/jobs", { replace: true })`.
Halollik: foto bloki `span`, tugma emas; «pul oldim» kabi hech kim tekshira olmaydigan belgi YOʻQ (saqlanmaydigan boshqaruv chizilmaydi).

### 4.6 `/app/master/history` — «Tarix»

| # | Blok | Matn |
|---|---|---|
| 1 | `Header variant="inner" title="Tarix"` | — |
| 2 | `FilterTabs<HistoryFilter>` | «Barchasi · N» / «Yakunlangan» / «Bekor» (`countByHistoryFilter` + `formatTabCount`, mijozdagi bilan bir xil lugʻat) |
| 3 | `SwipeSurface` | `adjacentHistoryFilter` bilan — mijozdagi jest |
| 4 | Sana guruhlari | `groupOrdersByDate` overline («SENTABR», «Bugun») |
| 5 | Qatorlar | `MasterHistoryRow`: 56×56 foto · kategoriya · `.tabular` shortId · sana · `.tabular` summa · `StarRating size="sm"` (baho bor boʻlsa) yoki `EMPTY_VALUE` |
| 6 | Yakuniy caption | «Roʻyxatda faqat siz qabul qilgan ishlar bor. Demo taymer mock ustaga bergan buyurtmalar bu yerga tushmaydi.» |

Boʻsh holat: «Yakunlangan ish yoʻq» / «Siz bajargan ishlar shu yerda va Daromad boʻlimida koʻrinadi.» + amal «Ishlarga oʻtish».
Halollik: baholanmagan ish yulduzsiz `EMPTY_VALUE` bilan chiziladi, hech qachon «5,0» taxmin qilinmaydi.

### 4.7 `/app/master/earnings` — «Daromad»

| # | Blok | Matn |
|---|---|---|
| 1 | `Header variant="inner" title="Daromad"` | — |
| 2 | `Banner variant="info"` (eng katta raqamdan TEPADA) | «Bu — mijozlar sizga naqd bergan summa. Ilova pulni saqlamaydi va oʻtkazmaydi. Platforma komissiyasi foizi hali belgilanmagan, shuning uchun sof daromad hisoblanmaydi.» |
| 3 | Hero `Card` (`.banner-field`) | Overline «NAQD QOʻLGA OLINGAN»; `splitFormattedPrice(totalEarned)` `text-h1 tabular` + `text-currency` «soʻm»; caption: «Shu qurilmada siz yakunlagan N ta ishdan.» |
| 4 | `StatTile` × 2 | «Yakunlangan ish» → son (→ Tarix); «Oʻrtacha baho» → `ratingAvg === null ? EMPTY_VALUE : formatRating(...)`, hint «N ta bahodan» yoki «Hali baho yoʻq» (→ Tarix) |
| 5 | Oylik ustunlar (faqat `completedCount > 0`) | 6 oy, `masterMonthlySeries` + `ShareBar` geometriyasi |
| 6 | «Soʻnggi ishlar» | 5 tagacha `MasterHistoryRow` + `Button variant="ghost"` «Barchasini koʻrish» → `/app/master/history` |
| 7 | `MenuGroup "Hisob"` | Bosilmaydigan qator (chevron yoʻq): `SealPercent` + «Komissiya» + hint «Hali belgilanmagan» |

Boʻsh holat: `EmptyState` «Hali daromad yoʻq» / «Ish yakunlanib, mijoz uni baholagach summa shu yerda koʻrinadi.» + «Ishlarga oʻtish».
Halollik: `MASTERS` mockidan bironta raqam OʻQILMAYDI; faqat `CLOSED` sanaladi; «balans», «hisobim», «pul yechish», «qarz» soʻzlari ekranda yoʻq.

### 4.8 `/app/master/profile` — «Profil»

| # | Blok | Matn |
|---|---|---|
| 1 | `Header variant="inner" title="Profil"` | — |
| 2 | Shaxs `Card` | `Avatar size={56}` + ism (yoki `formatPhone`) + `profile.profession ?? "Soha tanlanmagan"` + `InfoChip tone="warning"` «Tekshirilmagan» (HAR DOIM) + qator: «Yakunlangan: N · Baho: —» + caption «Faqat shu qurilmadagi ishlardan hisoblandi.» |
| 3 | Toʻliqlik `Card` (mavjud `MasterHub` bloki) | «Profil hali toʻliq emas» / «N / 4 qadam toʻldirildi. Profil toʻliq boʻlgach ariza matnini tayyorlaysiz.» + «Boshlash»/«Davom etish» |
| 4 | Ariza `Card` (mavjud blok) | «Ariza matni tayyor» / «Ariza hali tayyorlanmagan» + «Arizani ochish»/«Ariza tayyorlash» + `CHANNEL_OPENED_LABELS` qatori («Telegram ochildi», hech qachon «Yuborildi») |
| 5 | `MenuGroup "Usta rejimi"` | Sozlamalar (`GearSix`, hint «Ishga tayyor»/«Tayyor emas») · Ariza (`PaperPlaneTilt`) · Hududlar (`MapPin`, hint «N ta», → `setup?step=area`) |
| 6 | `MenuGroup "Ilova"` | «Nimalar hali ishlamaydi» (`Info`) → `/app/master/limits` · «Mavzu» (Toggle) |
| 7 | `MenuGroup "Rejim"` | «Mijoz rejimiga oʻtish» (`ArrowsLeftRight`, hint «Xizmat buyurtma qilish») → `/app/mode` |
| 8 | `MenuGroup "Yordam"` | «Qoʻllab-quvvatlash» → `/app/support` · «Kafolat» → `/app/guarantee` |
| 9 | `Banner variant="info"` | «Bu qurilmada mijoz ham, usta ham — bitta raqam. Takliflar shu telefonda berilgan buyurtmalardan keladi; boshqa odamlarning buyurtmalari server ulangandan keyin koʻrinadi.» |
| 10 | `Button variant="ghost"` | «Chiqish» (`signOut`) |

Halollik: «Sertifikatli» belgisi HECH QACHON chizilmaydi; baho yoʻq boʻlsa yulduz emas, «—» va «Hali baho yoʻq»; 9-blok qisqartirilmaydi.

### 4.9 `/app/master/limits` — «Nimalar hali ishlamaydi»

`Header variant="inner"` + kirish xatboshisi: «Ilova hozir serversiz ishlaydi. Quyidagilar yoʻq va biz ularni yoʻqdek koʻrsatamiz:». Soʻng 0.5-boʻlimdagi oʻnta qator: 36px ikona plitkasi (`bg-neutral-surface`) + sarlavha + bitta jumla + `DashedChip "Tez orada"` (`span`, tugma emas). Oxirida `SupportPhoneBlock` (`supportStatusLine` bilan). Boʻsh holat yoʻq.

### 4.10 `/app/master/setup` — oʻzgarishlar

Struktura oʻzgarmaydi (5 qadam, `StepDots`, sertifikat banneri aynan qoladi). Ikki tuzatish:
1. Yakuniy qadamdagi footer hintiga qoʻshiladi: «Profil toʻliq boʻlgach Ishlar boʻlimida smenani ochib, takliflarni qabul qila olasiz.»
2. Saqlashdan keyin `navigate("/app/master/profile", { replace: true })`; birinchi qadamdagi `onBack` → `/app/master/jobs` (yangi foydalanuvchida tarix boʻsh boʻlishi mumkin).

### 4.11 `/app/master/settings` — oʻzgarishlar

«Ishga tayyorman» `Toggle` kartasi VA uning banneri OLIB TASHLANADI — endi bitta boshqaruv bor va u Ishlar tabida. Oʻrniga caption + `Button variant="ghost"`:
> «Ishga tayyorlik endi «Ishlar» ekranidagi smena tugmasi bilan boshqariladi.» + «Ishlarga oʻtish»

Qolgan hamma narsa (6 qatorli `MenuGroup`, oʻchirish `Modal` i va uning matni) oʻzgarmaydi. Sabab: bitta maʼnoga ikkita kalit — ilovadagi eng yomon chalkashlik.

### 4.12 `/app/master/apply` — oʻzgarishsiz

`PreparedMessageText`, `CopyMessageButton`, `SupportPhoneBlock`, `ChannelLog`, `TelegramFooter` va yakuniy caption aynan qoladi. Bu ekran «qoʻlda yuborish» naqshining etaloni; unga yaqin joyda ikkinchi, kamroq halol naqsh paydo boʻlmasligi kerak.

### 4.13 Mijoz tomonidagi majburiy tuzatishlar

| Ekran | Oʻzgarish | Aynan matn |
|---|---|---|
| `OrderTracking` | `handledByMaster` boʻlsa `DemoAction` chiplari CHIZILMAYDI | «Bu buyurtmani shu qurilmadagi usta rejimi boshqarmoqda.» + `Button variant="ghost"` «Usta kabinetiga oʻtish» |
| `OrderTracking` | `CANCELLED` matni tarmoqlanadi | `CLIENT` → «Siz bekor qildingiz» · `MASTER` → «Usta bekor qildi. Sabab: …» + «Hech qanday pul yechilmagan.» · `SYSTEM` → «Tizim bekor qildi» |
| `OrderTracking` | `SEARCHING` + `masterTakeover` | Radar ostida: «Shu qurilmada usta rejimi yoqilgan — taklif sizning usta kabinetingizda turibdi.» |
| `MasterEnRoute` | ETA manbai | `handledByMaster` → «Vaqtni usta oʻzi koʻrsatdi.»; `etaMinutes === null` → vaqt qatori chizilmaydi va «Usta hali vaqt koʻrsatmadi.» |
| `WorkProof` | Yangi `Card` | Overline «USTA YOZGAN IZOH» + `workNote`; izoh yoʻq boʻlsa bitta qator «Usta izoh yozmagan» (uydirma matn yoʻq). Foto bloki va GPS banneri oʻzgarmaydi; baholash hali ham bloklanmaydi |
| Mijoz `ProfileTab` | «Rol» qatori | Label «Rejim», hint «Mijoz»/«Usta», `onSelect` → `/app/mode`; `completeOnboarding` chaqiruvi olib tashlanadi |
| `LoginScreen` | Bitta qator | «Mijoz ham, usta ham shu raqam orqali kiradi — rejimni keyingi qadamda tanlaysiz.» |
| Mijoz usta kartalari (`MasterCard`, `OrderListCard`, `MasterProfile`, `SafetyFlow`, `ConfirmMasterFlow`, `RateAndReceipt`, `Favorites`) | `masterRatingLabel(master, stats)` qorovuli | `completedOrdersCount === 0` boʻlsa yulduz oʻrniga «Hali baho yoʻq»; yashil «Sertifikatli» belgisi self usta uchun chizilmaydi |

---

## 5. Bosqichlar

Har bir bosqich mustaqil joʻnatiladi. Umumiy qabul buyrugʻi (hammasi yashil boʻlmasa bosqich tugamagan):

```
cd apps/client-app
npm run typecheck && npm run lint && npm run test && npm run build
npm run build && npx cap sync android && (cd android && ./gradlew assembleDebug)
cp android/app/build/outputs/apk/debug/app-debug.apk ~/Desktop/hizmat24-<nom>.apk
```

Playwright/CDP tekshiruvi har bosqichda: `scratchpad/master-shot.mjs` nusxasi bilan, `localStorage.hizmat24:session:v1` ga `{isAuthenticated:true, hasOnboarded:true, role:"master"}` qoʻyilgan holda, **360×730 va 412×915**, **light va dark** — bosqich ekranlarining shotlari olinadi va `pageerror` roʻyxati BOʻSH boʻlishi shart.

### M1 — Rejim va usta qobigʻi

**Maqsad:** ilova ochilganda tanlangan tomon ochiladi; usta oʻz pastki paneliga ega boʻladi; mijoz paneli usta ekranlaridan yoʻqoladi.

**Fayllar (yangi):** `src/lib/appMode.ts`, `src/app/masterTabRoutes.ts`, `src/app/MasterTabBar.tsx`, `src/components/ModeChoiceCards.tsx`, `src/app/screens/ModeScreen.tsx`, `src/app/screens/master/MasterProfileTab.tsx`, `src/app/screens/master/MasterLimitsScreen.tsx`, `src/app/screens/master/MasterJobsTab.tsx` (shu bosqichda faqat smena bloki + rost `EmptyState`).
**Fayllar (oʻzgaradi):** `src/components/BottomNav.tsx` (generik), `src/app/appRoutes.tsx` (usta qatorlari + `mode` + `masters/:masterId`), `src/app/AppRouter.tsx` (`landingRoute` + `RequireRole`), `src/app/useBackButton.ts` (`ROOT_ROUTES` + rolga qarab uy), `src/app/store.tsx` (`setRole`), `src/app/screens/Tabs.tsx`, `src/app/screens/OnboardingScreen.tsx`, `src/app/screens/LoginScreen.tsx`, `src/app/screens/HomeTab.tsx:107`, `src/app/screens/OrderTracking.tsx:213`, `src/app/screens/Favorites.tsx:81` (marshrut nomi), `MasterHub.tsx` → oʻchiriladi (mazmuni `MasterProfileTab` ga koʻchadi).
**Lib + testlar:** `appMode.test.ts`, `masterTabRoutes.test.ts`; `tabRoutes.test.ts` va `appRoutes.test.ts` mijoz toʻplamiga qayta yoziladi + `mode` marshrutida `role` bayrogʻi YOʻQligi testi (cheksiz yoʻnaltirish qorovuli).
**Demo urugʻ:** yoʻq.
**Qoʻlda tekshirish (telefonda):** «Ustaman» tanlanadi → usta uyi; ilova butunlay yopilib qayta ochiladi → yana usta uyi; Profil → «Mijoz rejimiga oʻtish» → mijoz uyi va mijoz paneli; mijoz Profil → «Rejim» → qaytish; usta ekranlarida «Karta» tabi hech qachon koʻrinmaydi; apparat «orqaga» usta uyida ilovadan chiqadi; mijoz sifatida `/app/master/jobs` ga kirishga urinish → sabab bilan `/app/mode`.
**APK:** `~/Desktop/hizmat24-usta-qobiq.apk`

### M2 — Smena, takliflar va taymer topshirigʻi

**Maqsad:** usta shu qurilmadagi buyurtmani taklif sifatida koʻradi, ETA bilan qabul qiladi yoki rad etadi; qabul qilingan buyurtmaga taymer tegmaydi.

**Fayllar (yangi):** `src/lib/orderSimulation.ts`, `src/lib/masterJobs.ts`, `src/lib/masterShift.ts`, `src/lib/masterIdentity.ts`, `src/app/masterActions.ts`, `src/components/master/ShiftHero.tsx`, `src/components/master/MasterJobCard.tsx`.
**Fayllar (oʻzgaradi):** `src/app/types.ts` (`handledByMaster`, `workNote`), `src/app/persistence.ts` (revive/serialize), `src/lib/masterProfile.ts` (`availableSince`), `src/app/master-persistence.ts` (`declinedOrderIds`), `src/app/master-store.tsx` (`declineOffer`, `openShift`, `closeShift`, takeover effekti), `src/app/store.tsx` (`masterAcceptOrder`, `createDemoOrder`, `setMasterTakeover`, taymer effekti bekor qilish bilan), `MasterJobsTab.tsx` (toʻliq), `MasterSettings.tsx` (Toggle olib tashlanadi), `OrderTracking.tsx` (demo chip qorovuli + `masterTakeover` qatori).
**Lib + testlar:** `orderSimulation.test.ts`, `masterJobs.test.ts`, `masterShift.test.ts`, `masterIdentity.test.ts`, `masterActions.test.ts`, **`master-persistence.test.ts` (yangi — bugun bu slice testsiz)**, `persistence.test.ts` ga: eski buyurtma `handledByMaster:false` va `workNote:null` bilan tiklanadi.
**Demo urugʻ:** faqat tugma — `createDemoOrder()` (kategoriya `c-tap`, manzil «Demo manzil»). Avtomatik ekiladigan yozuv YOʻQ.
**Qoʻlda tekshirish:** mijoz rejimida buyurtma beriladi → usta rejimida smena ochiladi → taklif chiqadi va **3,5 soniyadan keyin ham yoʻqolmaydi** → «20 daqiqa» bilan qabul qilinadi → mijoz ekranida ETA 20 (15 emas) va dashed «Demo» chip yoʻq; smena yopilsa taklif roʻyxati boʻshaydi va oʻsha buyurtma yana taymer bilan yuradi; «Demo · sinov buyurtmasi» tugmasi ikkala rejimda ham koʻrinadigan haqiqiy buyurtma yaratadi.
**APK:** `~/Desktop/hizmat24-usta-takliflar.apk`

### M3 — Faol ish

**Maqsad:** taymer haydagan toʻrt qadamni tirik odam bosadi; mijoz tomonidagi bekor qilish matni rostga aylanadi.

**Fayllar (yangi):** `src/app/screens/master/MasterJobScreen.tsx`.
**Fayllar (oʻzgaradi):** `src/app/store.tsx` (`masterDepart`, `masterArrive`, `masterCancelOrder`), `src/app/masterActions.ts`, `src/lib/masterJobs.ts` (kutish matnlari, bekor sabablari), `MasterJobsTab.tsx` (faol karta tugmalari), `OrderTracking.tsx` (`cancelledBy` tarmogʻi), `MasterEnRoute.tsx` (ETA manbai matni).
**Lib + testlar:** `masterJobs.test.ts` kengaytiriladi (amallar jadvali toʻliq, `ARRIVED` da amal yoʻq), `masterActions.test.ts` (`cancelledBy:"MASTER"`).
**Demo urugʻ:** yoʻq (M2 tugmasi yetarli).
**Qoʻlda tekshirish:** bitta buyurtma boshidan oxirigacha ikki rejim orasida olib oʻtiladi: «Yoʻlga chiqdim» → mijozda «Usta yoʻlda»; «Yetib keldim» → mijozda tasdiqlash ekrani majburan ochiladi; usta ekranidagi «Mijoz rejimiga oʻtish» toʻgʻridan-toʻgʻri tasdiqlash ekraniga olib boradi; usta bekor qilgan buyurtmada mijoz «Usta bekor qildi» matnini koʻradi.
**APK:** `~/Desktop/hizmat24-usta-ish.apk`

### M4 — Yakunlash va ish izohi

**Maqsad:** usta ishni yakunlaydi va yozgan izohi mijozning «Ish isboti» sahifasida chiqadi.

**Fayllar (yangi):** `src/app/screens/master/MasterFinishScreen.tsx`.
**Fayllar (oʻzgaradi):** `src/app/store.tsx` (`masterFinish`), `src/app/masterActions.ts` (`buildFinishPatch`), `src/app/screens/WorkProof.tsx` (izoh bloki), chek ekranlari (izoh qatori ixtiyoriy).
**Lib + testlar:** `masterActions.test.ts` (`workNote` trim + 300 belgi, `completedAt` yoziladi, `etaMinutes` tozalanadi), `persistence.test.ts` (600 belgi kesiladi).
**Demo urugʻ:** yoʻq.
**Qoʻlda tekshirish:** usta izoh yozib yakunlaydi → mijoz rejimida `/app/order/:id/proof` da aynan shu matn koʻrinadi; izohsiz yakunlansa «Usta izoh yozmagan» chiziladi; baholash izohga bogʻlanmaydi.
**APK:** `~/Desktop/hizmat24-usta-yakun.apk`

### M5 — Tarix va Daromad

**Maqsad:** usta oʻz ishlari tarixini va naqd qoʻlga tekkan summani koʻradi; hech bir raqam toʻqilmaydi.

**Fayllar (yangi):** `src/app/screens/master/MasterHistoryTab.tsx`, `src/app/screens/master/MasterEarningsTab.tsx`, `src/components/master/MasterHistoryRow.tsx`, `src/lib/masterEarnings.ts`.
**Fayllar (oʻzgaradi):** `masterTabRoutes.ts` (toʻrt tab toʻliq faollashadi), `MasterProfileTab.tsx` (lokal statistika qatori), mijoz usta kartalari (`masterRatingLabel` qorovuli).
**Lib + testlar:** `masterEarnings.test.ts`, `masterIdentity.test.ts` kengaytiriladi (`masterJobStats`, `masterRatingLabel`).
**Demo urugʻ:** yoʻq.
**Qoʻlda tekshirish:** ikkita ish toʻliq yopiladi → Daromad summasi ikkala `invoice.total` yigʻindisiga teng; baholanmagan yopilgan ish «Oʻrtacha baho» ga taʼsir qilmaydi va «—» chiziladi; `COMPLETED_BY_MASTER` holatidagi ish summaga QOʻSHILMAYDI; Tarix filtrlari sanoqlari toʻgʻri.
**APK:** `~/Desktop/hizmat24-usta-daromad.apk`

### M6 — Sayqal va reliz

**Maqsad:** usta tomoni mijoz tomoni bilan bir xil pishiqlikda.

**Ishlar:** barcha usta ekranlari 360×730 da tekshiriladi (birinchi ekranda smena bloki va faol ish kartasi sigʻishi shart); dark tema oʻtishi; `h-bottom-reserve` auditi; `Sheet` ning pastki panel ustidan tushishi va apparat «orqaga» sheetni yopishi tekshiriladi; `useBackButton` ga `/app/master/jobs/:id/finish` dan tasdiqsiz chiqmaslik qoidasi; `src/preview/registry.ts` dagi `ScreenEntry.stage` birligi 1..8 gacha kengaytiriladi va usta ekranlari 8-guruhda roʻyxatga olinadi; doktrina auditi (quyidagi 6-boʻlim).
**Qabul:** toʻrtta buyruq + toʻliq shot toʻplami (12+ ekran × 2 oʻlcham × 2 tema) + egasining telefonida toʻliq ikki tomonlama ssenariy: buyurtma berish → qabul qilish → yoʻlga chiqish → yetib kelish → tasdiqlash → yakunlash → baholash → Daromadda summani koʻrish.
**APK:** `~/Desktop/hizmat24-usta.apk`

---

## 6. Taqiqlar

1. **Soxta yozuv yoʻq.** Soxta mijoz, soxta buyurtma obyekti, soxta `shortId`, soxta reyting, soxta pul — hech biri. Ekranni toʻldirish kerak boʻlsa, haqiqiy buyurtma yaratadigan tugma qoʻyiladi.
2. **Soxta pul yoʻq.** Komissiya foizi, sof daromad, «balans», «hisobim», «pul yechish», «platformaga qarz», «toʻlandi» — kodda raqam yoʻq ekan, ekranda ham boʻlmaydi.
3. **Push va bildirishnoma vaʼdasi yoʻq.** Telefon ovoz chiqarmaydi; «sizga xabar yuboramiz» degan jumla yozilmaydi.
4. **«Yuborildi» soʻzi yoʻq.** Faqat `CHANNEL_OPENED_LABELS`: «Telegram ochildi» / «Qoʻngʻiroq qilindi». Ariza raqami, SLA, «koʻrib chiqilmoqda» yozilmaydi.
5. **Oʻlik tugma yoʻq.** Ishlamaydigan imkoniyat — `span` + `DashedChip "Tez orada"`, hech qachon bosiladigan element emas. Saqlanmaydigan yoki hech kimga koʻrinmaydigan boshqaruv ham chizilmaydi.
6. **Yangi rang yoʻq.** Faqat `src/tokens/colors.ts` dagi 34 ta token; usta rejimi farqi tarkib va `.banner-field` sathi bilan beriladi, yangi palitra bilan emas.
7. **Boʻshliq faqat shkaladan:** `[2,4,8,12,16,20,24,32,40,48,64]`. `py-10` kabi qiymat jimgina 40px boʻlib ketadi.
8. **Dark tema faqat `[[data-theme='dark']_&]` orqali.** Qoʻlda yasalgan oq sath chizilmaydi — `Card` ishlatiladi.
9. **ASCII apostrof yoʻq.** Faqat U+02BB (ʻ) va U+02BC (ʼ). Har bir yangi lib testiga `masterProfile.test.ts` dagi taqiq regexi koʻchiriladi; yakunda `grep -rn "[a-z]'[a-z]" src` boʻsh boʻlishi shart.
10. **Har bir fayl < 500 qator.** `store.tsx` bugun 485 — barcha patch quruvchilar `masterActions.ts` ga, `SERVER_STEPS` `orderSimulation.ts` ga chiqadi.
11. **Sof mantiq `src/lib` da va testlangan.** Komponent ichida status tekshiruvi, matn jadvali yoki hisob yozilmaydi; vitest node muhitida ishlaydi, demak lib fayllari `localStorage` va `new Date()` ga tegmaydi (`now` — parametr).
12. **Mijoz `TabKey` i kengaytirilmaydi** va mijoz ekranlariga `role` shoxi qoʻshilmaydi; usta uchun yangi komponent yoziladi.
13. **Yangi buyurtma statusi yaratilmaydi.** 10 ta status ikkala tomon uchun yagona; usta amallari mavjud oʻtishlarni almashtiradi.
14. **Bitta buyurtmani ikki aktyor surmaydi.** `handledByMaster` boʻlsa: taymer yoʻq, `advanceOrder` yoʻq, mijozda demo chip yoʻq. Uchtasi bitta commitda.
15. **Mock `MASTERS` maʼlumoti usta tomonida oʻqilmaydi.** Reyting va bajarilgan ish soni faqat shu qurilmadagi `CLOSED` ishlardan; nol boʻlsa «Hali baho yoʻq», hech qachon «0,0».
16. **Oʻzi aytgan sertifikat belgiga aylanmaydi.** `hasGovCertificate` self usta uchun doim `false`; yashil tasdiq chipi chizilmaydi.
17. **Kamera, xarita, GPS, yozishuv v1 da yoʻq.** Agar keyinchalik foto qoʻshilsa — ALOHIDA `localStorage` slice ichida; `saveSession` xatoni jim yutadi, demak kvota toʻlsa butun buyurtma tarixi yoʻqoladi.
18. **Saqlangan maʼlumot tashlanmaydi.** Har bir yangi maydon revive da default oladi va bunga test yoziladi; bitta buzuq maydon butun yozuvni oʻldirmaydi.
19. **Tugma nomi natijani emas, amalni aytadi.** «Matnni tayyorlash», «Telegramni ochish», «Ishni yakunladim» — «yuborildi», «tasdiqlandi» emas.
20. **Ekran 360×730 da ishlaydi.** Birinchi ekranda smena bloki va faol ish kartasi koʻrinishi shart; qolgani skroll.
