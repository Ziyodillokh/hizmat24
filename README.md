# Hizmat24

Santexnik/elektrik xizmatlari platformasi — Toshkent uchun on-demand usta chaqirish ilovasi.

| Papka | Nima |
|---|---|
| `apps/client-api` | Mijoz ilovasi backendi — NestJS 11 (Fastify) + Prisma + PostgreSQL 16 + Redis 7 + BullMQ |
| `apps/client-app` | Mijoz mobil ilovasi — React 18 + TypeScript + Vite + Tailwind, Capacitor orqali Android APK |
| `libs/shared-kernel` | Ikkala ilova uchun umumiy tiplar va konstantalar |
| `prisma` | Ma'lumotlar modeli va migratsiyalar |

Usta ilovasi va admin panel backendlari alohida `apps/` ilovalari sifatida qo'shiladi —
ma'lumotlar modeli va `libs/shared-kernel` umumiy bo'ladi.

> Mobil ilova hozircha mock ma'lumotlarda ishlaydi — backendga ulanish keyingi bosqichda.

## Mijoz ilovasi (`apps/client-app`)

```bash
cd apps/client-app
npm ci
npm run dev                   # brauzerda: http://localhost:5173
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
```

## Tez boshlash

```bash
cp .env.example .env          # JWT secretlarni almashtiring
docker compose up -d postgres redis
npm ci
npx prisma generate
npx prisma migrate deploy     # yoki: npm run prisma:migrate
npm run seed                  # demo kategoriyalar va ustalar
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs` (production'da o'chirilgan)
- Health: `/health/live`, `/health/ready` · Metrics: `/metrics`
- WebSocket: `ws://localhost:3000/ws/client` (`auth.token` — access JWT)

## Skriptlar

| Buyruq | Vazifasi |
|---|---|
| `npm run start:dev` | Watch rejimida ishga tushirish |
| `npm run lint` | ESLint (0 warning siyosati) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `npm run test:cov` | Unit testlar / qamrov bilan |
| `npm run test:e2e` | E2E (Testcontainers — Docker kerak) |
| `npm run build` | Production build |
| `npm run audit` | Bog'liqliklar xavfsizlik tekshiruvi (high+) |
| `npm run seed` | Boshlang'ich ma'lumotlar |

## API endpointlar

Barcha javoblar yagona konvertda: `{ "success": bool, "data": {...}, "error": {...} }`.

### Autentifikatsiya
| Method | Path | Izoh |
|---|---|---|
| POST | `/api/v1/auth/request-otp` | SMS-OTP yuborish (1 daq/1 marta) |
| POST | `/api/v1/auth/verify-otp` | Tokenlar olish |
| POST | `/api/v1/auth/refresh` | Rotation + reuse detection |
| POST | `/api/v1/auth/logout` | Sessiya oilasini bekor qilish |

### Xizmat turlari va buyurtmalar
| Method | Path | Izoh |
|---|---|---|
| GET | `/api/v1/service-groups` | Guruhlar + ichidagi xizmatlar (bosh sahifa va guruh ekrani uchun bitta so'rov) |
| GET | `/api/v1/service-categories` | Xizmatlarning tekis ro'yxati — qidiruv va "Barchasi" ekrani uchun |
| POST | `/api/v1/orders` | Buyurtma yaratish + qidiruvni ishga tushirish (`Idempotency-Key` qo'llab-quvvatlanadi) |
| GET | `/api/v1/orders/history` | Tarix (pagination) |
| GET | `/api/v1/orders/:id` | Buyurtma + **bitta** usta obyekti |
| GET | `/api/v1/orders/:id/eta` | Real-vaqt ETA / navbat pozitsiyasi |
| GET | `/api/v1/orders/:id/receipt` | Chek |
| POST | `/api/v1/orders/:id/cancel` | Bekor qilish (ish boshlanmaguncha) |
| POST | `/api/v1/orders/:id/confirm-master` | **Xavfsizlik nazorati** |
| POST | `/api/v1/orders/:id/rating` | Baholash (1–5) |

### Qo'shimcha
| Method | Path | Izoh |
|---|---|---|
| GET | `/api/v1/masters/:id` | Tayinlangan usta profili (read-only) |
| GET | `/api/v1/notifications` | Yetkazilmagan push'lar shu yerda ko'rinadi |
| POST | `/api/v1/notifications/:id/read`, `/read-all` | O'qilgan deb belgilash |
| POST | `/api/v1/notifications/device-tokens` | FCM token ro'yxatdan o'tkazish |

## Buyurtma holatlar mashinasi

```
DRAFT → SEARCHING → (ASSIGNED | SEARCHING_QUEUED) → MASTER_EN_ROUTE
  → ARRIVED_PENDING_CONFIRMATION → IN_PROGRESS → COMPLETED_BY_MASTER
  → RATED → CLOSED
```

Yon holatlar: `CANCELLED`, `SAFETY_FLAGGED` (ikkalasi ham terminal).

Grafik [`order-state-machine.ts`](apps/client-api/src/modules/orders/domain/order-state-machine.ts)
da qattiq belgilangan. Holat o'zgarishi faqat `OrderEntity.transitionTo()` orqali bo'ladi —
controller/service qatlamida `if (status === ...)` ko'rinishidagi tekshiruv yo'q.

> **TZ 9.4 jadvaliga nisbatan bitta qo'shimcha o'tish:** `ASSIGNED → SEARCHING`.
> Sababi — TZ 3.4 "avtomatik qayta ishga tushirish" bandi: usta 3 daqiqa ichida javob
> bermasa buyurtma 1-bandga (qidiruvga) qaytadi. Mos usta topilmasa, u yerdan
> `SEARCHING_QUEUED` ga o'tadi — bu 9.4 jadvalidagi yo'l.

## Usta qidiruv (matching)

1. `POST /orders` → order yoziladi, BullMQ `matching` navbatiga job qo'yiladi, HTTP darhol javob beradi.
2. `MatchingProcessor` mos ustani `SELECT ... FOR UPDATE SKIP LOCKED` bilan tanlaydi —
   ikkita buyurtma bitta ustaga tushmaydi.
3. `COMPLEX` kategoriyada `NEW` darajali ustalar **SQL darajasida** chiqarib tashlanadi.
4. Usta topilsa: bitta tranzaksiyada usta `BUSY` bo'ladi + order `ASSIGNED` + ETA hisoblanadi;
   3 daqiqalik `delayed job` qo'yiladi.
5. Usta javob bermasa: usta bo'shatiladi, order `SEARCHING` ga qaytadi va **shu usta chetlab
   o'tilgan holda** qayta qidiriladi. `MAX_ASSIGNMENT_ATTEMPTS = 5` dan keyin admin panelga eskalatsiya.
6. Usta topilmasa: Redis Sorted Set navbatiga qo'yiladi
   (`score = created_at − (is_urgent ? 10 yil : 0)` — shoshilinchlar oldinda, ular ichida FIFO).
7. Navbat ikki manbadan tekshiriladi: har 10 soniyada `@Interval` sweep + usta bo'shagan
   zahoti `MasterBecameAvailableEvent` listener.

## Xizmatlar katalogi

Ikki qavatli tuzilma: `ServiceGroup` ("Elektrik xizmatlari") → `ServiceCategory`
("Rozetka o'rnatish — 80 000 so'm"). Buyurtma har doim **kategoriyaga** beriladi,
guruhga emas — narx va `complexity_level` kategoriya darajasida yashaydi.

- `group_id` nullable: guruhga biriktirilmagan xizmat ham ishlayveradi, guruh
  o'chirilsa xizmatlar `SET NULL` bilan saqlanib qoladi.
- `icon_key` — URL emas, kalit: ikona ilova ichida vektor bo'lib qoladi, dark/light
  temada rangi almashadi va har bir plitka uchun tarmoq so'rovi ketmaydi.
- Taksonomiya to'liq admin panel qo'lida — ilovada hardcode qilingan guruhlash yo'q,
  shuning uchun yangi xizmat qo'shish app update talab qilmaydi.
- Ikkala endpoint ham bitta cache egasidan (`CatalogCacheService`) foydalanadi:
  admin o'zgartirganda `service-categories:invalidate` kanaliga xabar yuboriladi va
  ikkala kalit birga tozalanadi.

## Xavfsizlik

- Global `JwtAuthGuard`; `@Public()` faqat auth, health va ochiq katalog endpointlarida.
- Har bir endpointda resurs egaligi tekshiriladi (`OrderEntity.assertOwnedBy` → 403).
- Usta telefon raqami faqat `ASSIGNED | MASTER_EN_ROUTE | ARRIVED_PENDING_CONFIRMATION | IN_PROGRESS`
  holatlarida qaytariladi — boshqa hollarda `null`.
- `confirm-master` da `confirmed: false` → `SAFETY_FLAGGED` (terminal), `SafetyAlert` yozuvi,
  Redis `admin:safety-alerts` kanaliga kritik signal va o'chirilmaydigan audit yozuvi (IP + User-Agent bilan).
- `audit_logs` append-only: `UPDATE`/`DELETE` DB trigger orqali bloklangan
  ([migratsiya](prisma/migrations/20260101000100_audit_log_immutable/migration.sql)).
- Rate limiting: OTP — 5 daqiqada 3 marta + 1 daqiqalik cooldown; buyurtma yaratish — daqiqada 5 marta.
- OTP urinishlarini sanash va refresh tokenni bekor qilish **atomar** (`updateMany` + `WHERE` sharti):
  parallel so'rovlar brute-force chegarasini chetlab o'ta olmaydi va o'g'irlangan refresh token
  reuse-detection'ni aylanib o'tolmaydi.
- OTP hashi JWT siridan **alohida** `OTP_HASH_SECRET` bilan hisoblanadi va doimiy vaqtda solishtiriladi.
- WebSocket handshake ham REST kabi foydalanuvchi holatini tekshiradi — bloklangan foydalanuvchi
  ulanolmaydi.
- CORS faqat `CORS_ORIGINS` ro'yxatidagi manzillarga ochiladi (bo'sh bo'lsa umuman yoqilmaydi).
- `/metrics` `METRICS_TOKEN` bilan himoyalangan; `/health/ready` xatolarning ichki tafsilotini
  qaytarmaydi (ular faqat serverda loglanadi).
- Env o'zgaruvchilari Zod bilan boot vaqtida tekshiriladi; noto'g'ri bo'lsa ilova ko'tarilmaydi.
  Production'da `OTP_DEBUG_RETURN_CODE=true`, `SMS_PROVIDER=console` yoki JWT siri bilan bir xil
  `OTP_HASH_SECRET` — ilovani ataylab ishga tushirmaydi.

## Ishonchlilik invariantlari

Tarmoq/navbat uzilishlari holat divergensiyasiga olib kelmasligi uchun:

- **Usta bo'sh/band invarianti bitta joyda.** `MasterAvailabilityService.reconcile()` har 10 soniyada
  aktiv buyurtmasiz `BUSY` ustalarni bo'shatadi. Shu sababli mijoz ishni baholamay ketsa ham usta
  navbatga qaytadi, va hech bir kod yo'li ustani "yetim band" holatda qoldirolmaydi.
- **Tayinlash tranzaksiyasi rollback qiladi.** Usta band qilingandan keyin buyurtma holati o'zgargan
  bo'lsa, `StaleOrderError` tashlanadi — Prisma callback'idan `return null` qilinsa tranzaksiya
  COMMIT bo'lib, usta band bo'lib qolardi.
- **Sweep manbai — DB, Redis emas.** BullMQ ga job yozish tushib qolsa ham, qidiruv kutayotgan
  buyurtmalar DB dan topiladi. `ASSIGNED` holatida javob taymeri yo'qolgan buyurtmalar ham shu
  sweep orqali tiklanadi.
- **Holat + tarix + audit bo'linmas.** `applyTransition` chaqiruvchi tranzaksiya bermasa, o'zi ochadi.

## Biznes-qoidalar qayerda bajariladi

| TZ bandi | Joyi |
|---|---|
| 5.1 Faqat so'm (UZS) | `order.presenter.ts`, `CURRENCY` konstantasi — `currency` maydoni literal `"UZS"` |
| 5.2 Bitta usta, tanlov emas | `OrderView.master` — obyekt yoki `null`, hech qachon massiv |
| 5.3 Murakkab ish → tajribali usta | `master-finder.service.ts` SQL `WHERE` sharti |
| 5.4 Past reyting avtomatik chetlatmaydi | Tanlovda `rating_avg` faqat tartiblash uchun; `is_active` — admin qo'lida |
| 5.5 `IN_PROGRESS` dan keyin bekor qilish yo'q | `OrderEntity.cancelByClient()` → 403 |
| 5.6 Idempotentlik | `orders(client_id, idempotency_key)` unique; `ratings(order_id)` unique → 409 |
| 6.2 Telefon ko'rinishi | `MASTER_PHONE_VISIBLE_STATUSES` |
| 7.3 Atomarlik | `OrdersRepository.applyTransition` — `updateMany where status = <joriy>` |

## Arxitektura

```
apps/client-api/src/
  modules/
    auth/            OTP, JWT rotation, reuse detection
    orders/          domain (entity + state machine) / application (CQRS) / infrastructure
    matching/        usta qidiruv, BullMQ processor, navbat, 10s sweep
    masters/         read-model
    ratings/         baholash + fonda reyting qayta hisobi
    notifications/   WS gateway + FCM + domain event listener
    catalog/         guruhlar + xizmatlar, umumiy Redis cache va pub/sub invalidatsiya
    audit/           append-only audit
    health/          liveness/readiness + Prometheus
  common/            filters, interceptors, decorators, exceptions, utils
  infra/             prisma, redis, config (Zod)
libs/shared-kernel/  konstantalar, domain event'lar, API konverti
```

Modullar bir-birini to'g'ridan-to'g'ri chaqirmaydi — aloqa `EventEmitter2` domain event'lari
orqali. Har bir holat o'zgarishi `OrdersRepository` dan bitta `order.status_changed` event
chiqaradi; WS va FCM shu manbadan oziqlanadi (controller darajasida push chaqirilmaydi).

## Testlar

```bash
npm run test:cov     # unit + integration (mock'lar bilan)
npm run test:e2e     # Testcontainers: haqiqiy Postgres + Redis
```

- Domain qatlami (state machine, `OrderEntity`) — 100% qamrov, tashqi bog'liqliksiz.
- Umumiy qamrov chegarasi — 80% (jest `coverageThreshold` orqali majburlangan).
- E2E kritik oqimni tekshiradi: `create-order → assign → confirm → complete → rate`,
  xavfsizlik signali, murakkab ish filtri, navbatdan avtomatik tayinlash, idempotentlik,
  avtorizatsiya va audit immutability.

## Qamrovdan tashqari (TZ 8-bo'lim)

To'lov integratsiyasi, AI tashxis va to'liq "aqlli" matching v1 ga kirmaydi.
Fayl yuklash uchun `attachment_urls` maydoni tayyor — S3-compatible storage endpointi
alohida qo'shiladi.
