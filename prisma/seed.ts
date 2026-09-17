/**
 * Boshlangʻich maʼlumotlar: xizmat guruhlari, xizmat turlari va sinov ustalari.
 *
 * Katalog ILOVA bilan bir xil: platforma hozircha faqat santexnika
 * (egasining qarori, 2026-09-13). Nom, narx va `iconKey` ilovadagi
 * `src/mocks/serviceGroups.ts` bilan mos — aks holda server ulanganda
 * bosh sahifadagi rasmlar ham, ikonalar ham yoʻqolardi.
 *
 * Narxlar bu yerda faqat DEMO uchun — productionʼda admin panel orqali kiritiladi.
 */
import { ComplexityLevel, MasterExperienceLevel, MasterStatus, PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

/** `iconKey` — ilova ikonani shu kalit bo'yicha tanlaydi (vektor, temaga moslashadi). */
const CATALOG = [
  {
    name: 'Santexnika',
    iconKey: 'plumber',
    categories: [
      {
        name: 'Santexnika taʼmiri',
        iconKey: 'plumbing-repair',
        description: 'Oqish, shovqin, buzilgan jihoz',
        basePrice: 120_000,
        complexityLevel: ComplexityLevel.SIMPLE,
      },
      {
        name: 'Suv isitgich xizmatlari',
        iconKey: 'water-heater',
        description: 'Oʻrnatish va taʼmirlash',
        basePrice: 300_000,
        complexityLevel: ComplexityLevel.COMPLEX,
      },
      {
        name: 'Unitaz va kanalizatsiya',
        iconKey: 'toilet',
        description: 'Oʻrnatish, almashtirish, tiqilish',
        basePrice: 250_000,
        complexityLevel: ComplexityLevel.SIMPLE,
      },
      {
        name: 'Rakovina va smesitel',
        iconKey: 'tap',
        description: 'Kran, sifon, oqish',
        basePrice: 100_000,
        complexityLevel: ComplexityLevel.SIMPLE,
      },
      {
        name: 'Quvurlarni oʻrnatish',
        iconKey: 'pipes',
        description: 'Suv va isitish quvurlari',
        basePrice: 400_000,
        complexityLevel: ComplexityLevel.COMPLEX,
      },
      {
        name: 'Kanalizatsiya tozalash',
        iconKey: 'drain',
        description: 'Tiqilib qolgan quvur',
        basePrice: 200_000,
        complexityLevel: ComplexityLevel.SIMPLE,
      },
      {
        name: 'Isitish tizimini ulash',
        iconKey: 'heating',
        description: null,
        basePrice: 900_000,
        complexityLevel: ComplexityLevel.COMPLEX,
      },
    ],
  },
] as const;

const MASTERS = [
  {
    fullName: 'Akmal Rahimov',
    phoneNumber: '+998901112233',
    experienceLevel: MasterExperienceLevel.EXPERIENCED,
    hasGovCertificate: true,
    lastLat: 41.311081,
    lastLng: 69.240562,
  },
  {
    fullName: "Bekzod To'raev",
    phoneNumber: '+998901112234',
    experienceLevel: MasterExperienceLevel.NEW,
    hasGovCertificate: false,
    lastLat: 41.325,
    lastLng: 69.2285,
  },
  {
    fullName: 'Dilshod Ergashev',
    phoneNumber: '+998901112235',
    experienceLevel: MasterExperienceLevel.EXPERIENCED,
    hasGovCertificate: true,
    lastLat: 41.2995,
    lastLng: 69.2401,
  },
] as const;

async function seedCatalog() {
  const categories = [];

  for (const [groupIndex, group] of CATALOG.entries()) {
    const savedGroup = await prisma.serviceGroup.upsert({
      where: { name: group.name },
      update: { iconKey: group.iconKey, sortOrder: groupIndex },
      create: { name: group.name, iconKey: group.iconKey, sortOrder: groupIndex },
    });

    for (const [categoryIndex, category] of group.categories.entries()) {
      categories.push(
        await prisma.serviceCategory.upsert({
          where: { name: category.name },
          update: {
            basePrice: category.basePrice,
            complexityLevel: category.complexityLevel,
            iconKey: category.iconKey,
            description: category.description,
            groupId: savedGroup.id,
            sortOrder: categoryIndex,
          },
          create: { ...category, groupId: savedGroup.id, sortOrder: categoryIndex },
        }),
      );
    }
  }

  /*
   * Katalogda QOLMAGAN yozuvlar oʻchirilmaydi — ular eski buyurtmalarga
   * bogʻlangan (`onDelete: Restrict`). Ular faqat `isActive: false` boʻladi:
   * mijoz ularni koʻrmaydi, tarix esa butun qoladi.
   */
  const keptCategoryNames = CATALOG.flatMap((group) => group.categories.map((c) => c.name));
  const keptGroupNames = CATALOG.map((group) => group.name);

  const [hiddenCategories, hiddenGroups] = await Promise.all([
    prisma.serviceCategory.updateMany({
      where: { name: { notIn: keptCategoryNames }, isActive: true },
      data: { isActive: false },
    }),
    prisma.serviceGroup.updateMany({
      where: { name: { notIn: keptGroupNames }, isActive: true },
      data: { isActive: false },
    }),
  ]);

  if (hiddenCategories.count > 0 || hiddenGroups.count > 0) {
    console.log(
      `Katalogdan chiqarildi: ${hiddenGroups.count} guruh, ${hiddenCategories.count} xizmat (oʻchirilmadi, faqat yashirildi)`,
    );
  }

  return categories;
}

/**
 * Katalog keshini tozalaydi.
 *
 * Seed bazani oʻzgartiradi, API esa katalogni Redisʼdan oʻqiydi — kesh
 * tozalanmasa server eski katalogni koʻrsatib turaveradi. Admin panel
 * uchun ham AYNAN shu kanal ishlatiladi (`CatalogCacheService`).
 */
async function invalidateCatalogCache(): Promise<void> {
  const url = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST ?? 'localhost';
  const port = Number(process.env.REDIS_PORT ?? 6379);

  const redis = url ? new Redis(url) : new Redis({ host, port });
  try {
    await redis.del('service-categories:active', 'service-groups:active');
    await redis.publish('service-categories:invalidate', 'seed');
  } finally {
    redis.disconnect();
  }
}

async function main(): Promise<void> {
  const categories = await seedCatalog();

  for (const master of MASTERS) {
    const created = await prisma.master.upsert({
      where: { phoneNumber: master.phoneNumber },
      update: { status: MasterStatus.AVAILABLE, ...master },
      create: { ...master, status: MasterStatus.AVAILABLE },
    });

    // Tajribali ustalar barcha kategoriyalarga, yangilar — faqat oddiylariga (5.3).
    const allowed = categories.filter(
      (category) =>
        master.experienceLevel === MasterExperienceLevel.EXPERIENCED ||
        category.complexityLevel === ComplexityLevel.SIMPLE,
    );

    await prisma.masterServiceCategory.createMany({
      data: allowed.map((category) => ({ masterId: created.id, categoryId: category.id })),
      skipDuplicates: true,
    });
  }

  await invalidateCatalogCache();

  console.log(
    `Seed tayyor: ${CATALOG.length} guruh, ${categories.length} xizmat, ${MASTERS.length} usta`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
