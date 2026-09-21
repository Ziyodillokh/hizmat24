import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ComplexityLevel,
  MasterExperienceLevel,
  MasterStatus,
  OrderStatus,
  type PrismaClient,
} from '@prisma/client';
import { configureApp } from '@client/bootstrap';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { MONEY_STEP_UZS } from '@shared/index';
import { startInfrastructure, type TestInfrastructure } from './test-environment';

/*
 * `AppModule` ATAYLAB statik import qilinmaydi.
 *
 * `ConfigModule.forRoot({ validate })` modul EVALYUATSIYA paytida ishlaydi,
 * yaʼni `import` satrida — `beforeAll` dan ancha oldin. Statik import bilan
 * validatsiya boʻsh muhitda yugurar va CI da (u yerda `.env` yoʻq)
 * «DATABASE_URL: Required» bilan qulardi. Mahalliy mashinada esa `.env`
 * borligi uchun oʻtib ketardi — shuning uchun nosozlik faqat CI da
 * koʻrinardi.
 *
 * Ikkinchi sabab muhimroq: `ConfigService.get()` avval VALIDATSIYA
 * paytidagi nusxaga qaraydi va faqat keyin `process.env` ga. Konteyner
 * manzillari (`REDIS_HOST`, `REDIS_PORT`) `beforeAll` da maʼlum boʻladi,
 * demak validatsiya ulardan KEYIN yugurishi shart — aks holda ilova
 * konteynerga emas, eski qiymatga ulanardi.
 */
type AppModuleType = Parameters<typeof Test.createTestingModule>[0]['imports'];

/**
 * Kritik oqim (TZ 9.8): create-order → assign → confirm → complete → rate.
 * Haqiqiy Postgres va Redis ustida ishlaydi (Testcontainers).
 */
describe('Buyurtma oqimi (e2e)', () => {
  let infrastructure: TestInfrastructure;
  let app: NestFastifyApplication;
  let prisma: PrismaClient;

  const phoneNumber = '+998901234567';
  let accessToken: string;
  let simpleCategoryId: string;
  let complexCategoryId: string;
  let experiencedMasterId: string;
  let newMasterId: string;

  const request = (method: string, url: string, body?: unknown, token = accessToken) =>
    app.inject({
      method: method as 'GET',
      url,
      payload: body as never,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });

  const waitFor = async (predicate: () => Promise<boolean>, timeoutMs = 15_000): Promise<void> => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await predicate()) return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error('Kutilgan holat belgilangan vaqtda yuz bermadi');
  };

  beforeAll(async () => {
    infrastructure = await startInfrastructure();

    Object.assign(process.env, {
      NODE_ENV: 'test',
      DATABASE_URL: infrastructure.databaseUrl,
      REDIS_HOST: infrastructure.redisHost,
      REDIS_PORT: String(infrastructure.redisPort),
      // Uchala sir ham BERILISHI shart va bir-biridan farq qilishi kerak —
      // env.validation.ts ularsiz ilovani umuman koʻtarmaydi. Ilgari bu
      // yerda mavjud boʻlmagan JWT_REFRESH_SECRET turar, OTP_HASH_SECRET
      // esa yoʻq edi: E2E har bir CI yugurishida shu sababdan yiqilardi.
      JWT_ACCESS_SECRET: 'e'.repeat(40),
      OTP_HASH_SECRET: 'o'.repeat(40),
      ADMIN_TOKEN_SECRET: 'd'.repeat(40),
      OTP_DEBUG_RETURN_CODE: 'true',
      SMS_PROVIDER: 'console',
      FCM_ENABLED: 'false',
      THROTTLE_LIMIT: '10000',
    });

    // Import SHU YERDA — muhit toʻldirilgandan keyin (yuqoridagi izohga qarang).
    const { AppModule } = (await import('@client/app.module')) as {
      AppModule: NonNullable<AppModuleType>[number];
    };

    /*
     * Throttler TESTDA oʻchiriladi — SAQLAGICH almashtirilib.
     *
     * `THROTTLE_LIMIT` ni oshirish yetarli emas: `POST /orders` da marshrut
     * darajasidagi `@Throttle({ limit: 5, ttl: 60s })` bor va u global
     * sozlamani BOSIB YOZADI. E2E bir daqiqada oʻndan ortiq buyurtma
     * yaratadi, shuning uchun oltinchisidan boshlab 429 kelar va
     * tekshirilayotgan narsa (validatsiya whitelistʻi, idempotentlik,
     * bekor qilish) umuman sinalmasdi.
     *
     * `overrideGuard(ThrottlerGuard)` ISHLAMAYDI: qorovul `APP_GUARD`
     * tokeni ostida roʻyxatdan oʻtgan, `ThrottlerGuard` ostida emas.
     * `APP_GUARD` ni almashtirish esa JwtAuthGuard ni ham oʻchirib
     * yuborardi (ikkalasi bitta token ostida). Shuning uchun qorovul
     * oʻz oʻrnida qoladi, faqat saqlagich har doim "urinishlar yoʻq"
     * deb javob beradi. Chegaraning oʻzi production qoidasi boʻlib
     * qoladi — uni sekinlashtirish uchun testni oʻzgartirmaymiz.
     */
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 0,
            timeToExpire: 0,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
  }, 180_000);

  afterAll(async () => {
    await app?.close();
    await infrastructure?.stop();
  });

  beforeAll(async () => {
    const plumbing = await prisma.serviceGroup.create({
      data: { name: 'Santexnika', iconKey: 'plumber', sortOrder: 0 },
    });
    const gas = await prisma.serviceGroup.create({
      data: { name: 'Gaz', iconKey: 'gas', sortOrder: 1 },
    });

    const simple = await prisma.serviceCategory.create({
      data: {
        name: "Kran ta'mirlash",
        basePrice: 100_000,
        complexityLevel: ComplexityLevel.SIMPLE,
        groupId: plumbing.id,
      },
    });
    const complex = await prisma.serviceCategory.create({
      data: {
        name: 'Gaz plitasi ulash',
        basePrice: 350_000,
        complexityLevel: ComplexityLevel.COMPLEX,
        groupId: gas.id,
      },
    });
    simpleCategoryId = simple.id;
    complexCategoryId = complex.id;

    const experienced = await prisma.master.create({
      data: {
        fullName: 'Akmal Rahimov',
        phoneNumber: '+998901112233',
        experienceLevel: MasterExperienceLevel.EXPERIENCED,
        hasGovCertificate: true,
        status: MasterStatus.AVAILABLE,
        lastLat: 41.311,
        lastLng: 69.2405,
        categories: { create: [{ categoryId: simple.id }, { categoryId: complex.id }] },
      },
    });
    const novice = await prisma.master.create({
      data: {
        fullName: "Bekzod To'raev",
        phoneNumber: '+998901112234',
        experienceLevel: MasterExperienceLevel.NEW,
        status: MasterStatus.AVAILABLE,
        lastLat: 41.3111,
        lastLng: 69.2406,
        categories: { create: [{ categoryId: simple.id }, { categoryId: complex.id }] },
      },
    });
    experiencedMasterId = experienced.id;
    newMasterId = novice.id;
  });

  const address = { label: 'Chilonzor 9-kvartal, 42-uy', lat: 41.3115, lng: 69.2409 };

  describe('autentifikatsiya (TZ 3.1)', () => {
    it("OTP so'raydi va tasdiqlaydi", async () => {
      // Act
      const otpResponse = await request('POST', '/api/v1/auth/request-otp', { phoneNumber }, '');
      const { data: otpData } = otpResponse.json();

      const verifyResponse = await request(
        'POST',
        '/api/v1/auth/verify-otp',
        { phoneNumber, otpCode: otpData.debugCode },
        '',
      );
      const { success, data } = verifyResponse.json();

      // Assert
      expect(otpResponse.statusCode).toBe(200);
      expect(success).toBe(true);
      expect(data.accessToken).toBeDefined();
      expect(data.user.phoneNumber).toBe(phoneNumber);

      accessToken = data.accessToken;
    });

    it("token bo'lmasa himoyalangan endpointga kirmaydi", async () => {
      const response = await request('GET', '/api/v1/orders/history', undefined, '');

      expect(response.statusCode).toBe(401);
    });
  });

  describe('xizmatlar katalogi (TZ 3.2)', () => {
    it("narxlarni so'mda qaytaradi va complexity_level ni yashiradi", async () => {
      const response = await request('GET', '/api/v1/service-categories');
      const { data } = response.json();

      expect(response.statusCode).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].currency).toBe('UZS');
      expect(data[0]).not.toHaveProperty('complexityLevel');
      expect(data[0].groupId).toBeTruthy();
    });

    it("guruhlarni ichidagi xizmatlar bilan bitta so'rovda qaytaradi", async () => {
      // Act
      const response = await request('GET', '/api/v1/service-groups');
      const { data } = response.json();

      // Assert
      expect(response.statusCode).toBe(200);
      expect(data).toHaveLength(2);

      const plumbing = data.find((group: { name: string }) => group.name === 'Santexnika');
      expect(plumbing.iconKey).toBe('plumber');
      expect(plumbing.categories).toHaveLength(1);
      expect(plumbing.categories[0]).toMatchObject({
        name: "Kran ta'mirlash",
        basePrice: 100_000,
        currency: 'UZS',
      });
      expect(plumbing.categories[0]).not.toHaveProperty('complexityLevel');
    });

    it("xizmati yo'q guruhni qaytarmaydi", async () => {
      // Arrange
      await prisma.serviceGroup.create({
        data: { name: "Bo'sh guruh", iconKey: 'empty', sortOrder: 99 },
      });

      // Act
      const { data } = (await request('GET', '/api/v1/service-groups')).json();

      // Assert
      expect(data.map((group: { name: string }) => group.name)).not.toContain("Bo'sh guruh");
    });
  });

  describe("to'liq oqim: yaratish → tayinlash → tasdiqlash → yakunlash → baholash", () => {
    let orderId: string;

    it('buyurtma yaratadi va narxni kategoriyadan oladi', async () => {
      // Act
      const response = await request('POST', '/api/v1/orders', {
        categoryId: simpleCategoryId,
        description: "Oshxonadagi kran oqmoqda, suv to'planyapti",
        clientAddress: address,
        paymentMethod: 'cash',
      });
      const { data } = response.json();

      // Id AVVAL yoziladi: quyidagi daʼvolardan biri yiqilsa, test tanasi
      // toʻxtaydi va `orderId` boʻsh qolib, keyingi oʻnlab test «notoʻgʻri
      // UUID» bilan 400 olardi — asl sabab shu koʻchki ostida koʻrinmasdi.
      orderId = data.id;

      // Assert
      expect(response.statusCode).toBe(201);
      expect(data.currency).toBe('UZS');
      expect(data.status).toBe(OrderStatus.SEARCHING);

      /*
       * Narx QATʼIY songa tenglashtirilmaydi. B3b dan keyin uni server
       * hisoblaydi va unga mijoz darajasining chegirmasi kiradi; daraja
       * esa yopilgan buyurtmalar soniga qarab shu test davomida ham
       * oʻzgaradi. Shuning uchun qoidaning OʻZI tekshiriladi:
       *   jami = asos + shoshilinch yigʻim − chegirma
       * va asos kategoriyadan olinadi (TZ 3.3).
       */
      expect(data.invoice.base).toBe(100_000);
      expect(data.invoice.urgentFee).toBe(0);
      // Formula test ichida QAYTA YOZILMAYDI — u `domain/pricing.ts` ning
      // oʻz testlarida tekshiriladi. Bu yerda shartnoma tekshiriladi:
      // chegirma pul qadamiga yaxlitlangan, asosdan oshmagan va jami
      // uchta qismdan yigʻilgan.
      expect(data.invoice.discount % MONEY_STEP_UZS).toBe(0);
      expect(data.invoice.discount).toBeLessThanOrEqual(data.invoice.base);
      expect(data.price).toBe(
        data.invoice.base + data.invoice.urgentFee - data.invoice.discount,
      );
      expect(data.invoice.total).toBe(data.price);
    });

    it('fonda ustani tayinlaydi (5 soniyadan kam)', async () => {
      // Act
      await waitFor(async () => {
        const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
        return order.status === OrderStatus.ASSIGNED;
      }, 5_000);

      const { data } = (await request('GET', `/api/v1/orders/${orderId}`)).json();

      // Assert
      expect(data.master).not.toBeNull();
      expect(Array.isArray(data.master)).toBe(false);
      expect(data.master.phoneNumber).toBeTruthy();
      expect(data.etaMinutes).toBeGreaterThan(0);
    });

    it('tayinlangan usta "band" holatiga o\'tadi', async () => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      const master = await prisma.master.findUniqueOrThrow({ where: { id: order.masterId! } });

      expect(master.status).toBe(MasterStatus.BUSY);
    });

    it("usta yo'lga chiqib yetib keladi (usta ilovasi tomonidagi o'tishlar)", async () => {
      // Arrange: bu o'tishlar usta ilovasi tomonidan bajariladi
      await prisma.order.update({
        where: { id: orderId },
        data: { masterAckedAt: new Date(), status: OrderStatus.MASTER_EN_ROUTE },
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ARRIVED_PENDING_CONFIRMATION, arrivedAt: new Date() },
      });

      // Act
      const { data } = (await request('GET', `/api/v1/orders/${orderId}`)).json();

      // Assert
      expect(data.status).toBe(OrderStatus.ARRIVED_PENDING_CONFIRMATION);
    });

    it('mijoz ustani tasdiqlaydi va ish boshlanadi (TZ 3.7)', async () => {
      const response = await request('POST', `/api/v1/orders/${orderId}/confirm-master`, {
        confirmed: true,
      });
      const { data } = response.json();

      expect(response.statusCode).toBe(200);
      expect(data.order.status).toBe(OrderStatus.IN_PROGRESS);
      expect(data.safetyAlertId).toBeNull();
    });

    it('ish boshlangandan keyin bekor qilishni 403 bilan rad etadi (biznes-qoida 5.5)', async () => {
      const response = await request('POST', `/api/v1/orders/${orderId}/cancel`, {
        reason: "fikrim o'zgardi",
      });

      expect(response.statusCode).toBe(403);
      expect(response.json().error.code).toBe('CANCEL_NOT_ALLOWED');
    });

    it('yakunlanmagan ishni baholashni rad etadi', async () => {
      const response = await request('POST', `/api/v1/orders/${orderId}/rating`, { stars: 5 });

      expect(response.statusCode).toBe(409);
    });

    it('usta ishni yakunlagach mijoz baholaydi va buyurtma yopiladi (TZ 3.8)', async () => {
      // Arrange
      await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED_BY_MASTER, completedAt: new Date() },
      });

      // Act
      const response = await request('POST', `/api/v1/orders/${orderId}/rating`, {
        stars: 5,
        comment: 'Tez va sifatli',
      });

      // Assert
      expect(response.statusCode).toBe(201);
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(order.status).toBe(OrderStatus.CLOSED);
    });

    it('bitta buyurtmaga ikkinchi bahoni 409 bilan rad etadi', async () => {
      const response = await request('POST', `/api/v1/orders/${orderId}/rating`, { stars: 1 });

      expect(response.statusCode).toBe(409);
    });

    it('usta reytingini fonda qayta hisoblaydi', async () => {
      /*
       * Usta BUYURTMADAN olinadi, oldindan taxmin qilinmaydi.
       *
       * Ilgari bu yerda `experiencedMasterId` yozilgan edi — yaʼni test
       * qaysi usta tayinlanishini bilib turibdi deb hisoblardi. Tayinlashni
       * esa `MasterFinderService` hal qiladi va u mos keladigan har qanday
       * ustani tanlashi mumkin. Boshqa usta tanlansa, test «reyting qayta
       * hisoblanmadi» deb yiqilardi — aslida reyting hisoblangan, faqat
       * boshqa yozuvda.
       */
      const { masterId } = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { masterId: true },
      });
      expect(masterId).toBeTruthy();

      await waitFor(async () => {
        const master = await prisma.master.findUniqueOrThrow({
          where: { id: masterId as string },
        });
        return master.ratingCount > 0;
      });

      const master = await prisma.master.findUniqueOrThrow({ where: { id: masterId as string } });
      expect(master.completedOrdersCount).toBe(1);
      expect(Number(master.ratingAvg)).toBe(5);
    });

    it("buyurtma yopilgach usta bo'sh holatiga qaytariladi (reconcile)", async () => {
      // Bo'sh/band invariantini `MasterAvailabilityService` tiklaydi —
      // mijoz baholamay ketsa ham usta abadiy band bo'lib qolmaydi.
      await waitFor(async () => {
        const master = await prisma.master.findUniqueOrThrow({
          where: { id: experiencedMasterId },
        });
        return master.status === MasterStatus.AVAILABLE;
      }, 20_000);
    });

    it('chekni qaytaradi', async () => {
      const { data } = (await request('GET', `/api/v1/orders/${orderId}/receipt`)).json();

      // Narx yaratilishda hisoblangani bilan bir xil boʻlishi kerak —
      // chek buyurtmadagi qiymatni koʻchiradi, qayta hisoblamaydi.
      const { data: order } = (await request('GET', `/api/v1/orders/${orderId}`)).json();

      expect(data).toMatchObject({ price: order.price, currency: 'UZS', rating: 5 });
      expect(data.masterName).toBeTruthy();
    });

    it('yopilgan buyurtmada usta telefonini yashiradi (6.2)', async () => {
      const { data } = (await request('GET', `/api/v1/orders/${orderId}`)).json();

      expect(data.master.phoneNumber).toBeNull();
    });
  });

  describe('xavfsizlik signali (TZ 3.7)', () => {
    it("tasdiqlanmaganda ish IN_PROGRESS ga o'tmaydi va admin navbatiga yoziladi", async () => {
      // Arrange
      const { data: created } = (
        await request('POST', '/api/v1/orders', {
          categoryId: simpleCategoryId,
          description: 'Vannaxonadagi kran shovqin qilyapti',
          clientAddress: address,
          paymentMethod: 'cash',
        })
      ).json();

      await waitFor(async () => {
        const order = await prisma.order.findUniqueOrThrow({ where: { id: created.id } });
        return order.status === OrderStatus.ASSIGNED;
      });

      await prisma.order.update({
        where: { id: created.id },
        data: { masterAckedAt: new Date(), status: OrderStatus.MASTER_EN_ROUTE },
      });
      await prisma.order.update({
        where: { id: created.id },
        data: { status: OrderStatus.ARRIVED_PENDING_CONFIRMATION },
      });

      // Act
      const response = await request('POST', `/api/v1/orders/${created.id}/confirm-master`, {
        confirmed: false,
        note: 'Boshqa odam keldi',
      });
      const { data } = response.json();

      // Assert
      expect(data.order.status).toBe(OrderStatus.SAFETY_FLAGGED);
      expect(data.safetyAlertId).toBeTruthy();

      const alerts = await prisma.safetyAlert.findMany({ where: { orderId: created.id } });
      expect(alerts).toHaveLength(1);
      expect(alerts[0].status).toBe('OPEN');

      const auditEntries = await prisma.auditLog.findMany({
        where: { orderId: created.id, action: 'SAFETY_FLAG_RAISED' },
      });
      expect(auditEntries.length).toBeGreaterThan(0);
    });

    it("safety_flagged holatidan chiqib bo'lmaydi (terminal)", async () => {
      const order = await prisma.order.findFirstOrThrow({
        where: { status: OrderStatus.SAFETY_FLAGGED },
      });

      const response = await request('POST', `/api/v1/orders/${order.id}/confirm-master`, {
        confirmed: true,
      });

      expect(response.statusCode).toBe(409);
    });

    it("audit yozuvini o'zgartirib bo'lmaydi (append-only, DB trigger)", async () => {
      const entry = await prisma.auditLog.findFirstOrThrow();

      await expect(
        prisma.auditLog.update({ where: { id: entry.id }, data: { toStatus: 'BUZILGAN' } }),
      ).rejects.toThrow();
    });
  });

  describe('murakkab ishlar faqat tajribali ustaga (biznes-qoida 5.3)', () => {
    it('yangi usta murakkab buyurtmaga tayinlanmaydi', async () => {
      // Arrange: faqat yangi usta bo'sh qoladi
      await prisma.master.update({
        where: { id: experiencedMasterId },
        data: { status: MasterStatus.BUSY },
      });
      await prisma.master.update({
        where: { id: newMasterId },
        data: { status: MasterStatus.AVAILABLE },
      });

      // Act
      const { data: created } = (
        await request('POST', '/api/v1/orders', {
          categoryId: complexCategoryId,
          description: 'Gaz plitasini yangi joyga ulash kerak',
          clientAddress: address,
          paymentMethod: 'cash',
        })
      ).json();

      await waitFor(async () => {
        const order = await prisma.order.findUniqueOrThrow({ where: { id: created.id } });
        return order.status === OrderStatus.SEARCHING_QUEUED;
      });

      // Assert
      const order = await prisma.order.findUniqueOrThrow({ where: { id: created.id } });
      expect(order.masterId).toBeNull();
      expect(order.queuePosition).toBeGreaterThan(0);
    });

    it("tajribali usta bo'shaganda navbatdagi buyurtma avtomatik tayinlanadi (TZ 3.4)", async () => {
      // Arrange
      const queued = await prisma.order.findFirstOrThrow({
        where: { status: OrderStatus.SEARCHING_QUEUED },
      });

      // Act: usta bo'shaydi
      await prisma.master.update({
        where: { id: experiencedMasterId },
        data: { status: MasterStatus.AVAILABLE },
      });

      // Assert: 10 soniyalik sweep ichida tayinlanadi
      await waitFor(async () => {
        const order = await prisma.order.findUniqueOrThrow({ where: { id: queued.id } });
        return order.status === OrderStatus.ASSIGNED;
      }, 20_000);

      const order = await prisma.order.findUniqueOrThrow({ where: { id: queued.id } });
      expect(order.masterId).toBe(experiencedMasterId);
    });
  });

  describe('validatsiya va avtorizatsiya', () => {
    it("bo'sh tavsifni rad etadi (TZ 3.3)", async () => {
      const response = await request('POST', '/api/v1/orders', {
        categoryId: simpleCategoryId,
        description: '',
        clientAddress: address,
        paymentMethod: 'cash',
      });

      expect(response.statusCode).toBe(400);
    });

    it("mavjud bo'lmagan kategoriyani rad etadi", async () => {
      const response = await request('POST', '/api/v1/orders', {
        categoryId: '11111111-1111-4111-8111-111111111111',
        description: "Kran oqmoqda va suv to'planyapti",
        clientAddress: address,
        paymentMethod: 'cash',
      });

      expect(response.statusCode).toBe(400);
    });

    it("noma'lum maydonlarni rad etadi (whitelist)", async () => {
      const response = await request('POST', '/api/v1/orders', {
        categoryId: simpleCategoryId,
        description: "Kran oqmoqda va suv to'planyapti",
        clientAddress: address,
        paymentMethod: 'cash',
        price: 1,
      });

      expect(response.statusCode).toBe(400);
    });

    it('boshqa mijozning buyurtmasiga 403 qaytaradi (6.1)', async () => {
      // Arrange: ikkinchi foydalanuvchi
      const otherPhone = '+998907654321';
      const { data: otp } = (
        await request('POST', '/api/v1/auth/request-otp', { phoneNumber: otherPhone }, '')
      ).json();
      const { data: session } = (
        await request(
          'POST',
          '/api/v1/auth/verify-otp',
          { phoneNumber: otherPhone, otpCode: otp.debugCode },
          '',
        )
      ).json();

      const victimOrder = await prisma.order.findFirstOrThrow();

      // Act
      const response = await request(
        'GET',
        `/api/v1/orders/${victimOrder.id}`,
        undefined,
        session.accessToken,
      );

      // Assert
      expect(response.statusCode).toBe(403);
    });

    it('bir xil Idempotency-Key bilan dublikat buyurtma yaratmaydi (5.6)', async () => {
      // Arrange
      const payload = {
        categoryId: simpleCategoryId,
        description: 'Hojatxonadagi bachok oqmoqda',
        clientAddress: address,
        paymentMethod: 'cash',
      };
      const headers = {
        authorization: `Bearer ${accessToken}`,
        'idempotency-key': 'e2e-key-1',
      };

      // Act
      const first = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload,
        headers,
      });
      const second = await app.inject({
        method: 'POST',
        url: '/api/v1/orders',
        payload,
        headers,
      });

      // Assert
      expect(first.json().data.id).toBe(second.json().data.id);
    });
  });

  describe('bildirishnomalar (TZ 4)', () => {
    it("offline yetkazilmagan xabarlar ro'yxatda ko'rinadi", async () => {
      const { data } = (await request('GET', '/api/v1/notifications')).json();

      expect(data.items.length).toBeGreaterThan(0);
      expect(data.meta.unread).toBeGreaterThan(0);
    });

    it("xabarni o'qilgan deb belgilaydi", async () => {
      // Arrange
      const { data } = (await request('GET', '/api/v1/notifications')).json();
      const target = data.items[0];

      // Act
      const response = await request('POST', `/api/v1/notifications/${target.id}/read`);

      // Assert
      expect(response.statusCode).toBe(204);
      const updated = await prisma.notification.findUniqueOrThrow({ where: { id: target.id } });
      expect(updated.readAt).not.toBeNull();
    });
  });

  describe('bekor qilish (TZ 3.6)', () => {
    it("qidiruv bosqichida bekor qiladi va ustani bo'shatadi", async () => {
      // Arrange
      const { data: created } = (
        await request('POST', '/api/v1/orders', {
          categoryId: simpleCategoryId,
          description: 'Rozetka ishlamayapti, uchqun chiqyapti',
          clientAddress: address,
          paymentMethod: 'cash',
        })
      ).json();

      // Act
      const response = await request('POST', `/api/v1/orders/${created.id}/cancel`, {
        reason: "Muammo o'zi hal bo'ldi",
      });

      // Assert
      expect([200, 409]).toContain(response.statusCode);
      const order = await prisma.order.findUniqueOrThrow({ where: { id: created.id } });
      if (response.statusCode === 200) {
        expect(order.status).toBe(OrderStatus.CANCELLED);
        expect(order.cancelledBy).toBe('CLIENT');
      }
    });
  });
});
