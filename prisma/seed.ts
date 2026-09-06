/**
 * Boshlang'ich ma'lumotlar: xizmat guruhlari, xizmat turlari va sinov ustalari.
 * Narxlar bu yerda faqat DEMO uchun — production'da admin panel orqali kiritiladi.
 */
import { ComplexityLevel, MasterExperienceLevel, MasterStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** `iconKey` — ilova ikonani shu kalit bo'yicha tanlaydi (vektor, temaga moslashadi). */
const CATALOG = [
  {
    name: 'Elektrika',
    iconKey: 'electrician',
    categories: [
      { name: "Rozetka o'rnatish", basePrice: 80_000, complexityLevel: ComplexityLevel.SIMPLE },
      { name: "Lyustra o'rnatish", basePrice: 120_000, complexityLevel: ComplexityLevel.SIMPLE },
      { name: 'Avtomat almashtirish', basePrice: 150_000, complexityLevel: ComplexityLevel.SIMPLE },
      {
        name: "To'liq elektr simlarini almashtirish",
        basePrice: 1_500_000,
        complexityLevel: ComplexityLevel.COMPLEX,
      },
    ],
  },
  {
    name: 'Santexnika',
    iconKey: 'plumber',
    categories: [
      { name: "Kran ta'mirlash", basePrice: 100_000, complexityLevel: ComplexityLevel.SIMPLE },
      { name: "Unitaz o'rnatish", basePrice: 250_000, complexityLevel: ComplexityLevel.SIMPLE },
      {
        name: 'Kanalizatsiya tozalash',
        basePrice: 200_000,
        complexityLevel: ComplexityLevel.SIMPLE,
      },
      {
        name: 'Isitish tizimini ulash',
        basePrice: 900_000,
        complexityLevel: ComplexityLevel.COMPLEX,
      },
    ],
  },
  {
    name: 'Gaz',
    iconKey: 'gas',
    categories: [
      { name: 'Gaz plitasi ulash', basePrice: 350_000, complexityLevel: ComplexityLevel.COMPLEX },
      { name: 'Gaz kolonkasi ulash', basePrice: 500_000, complexityLevel: ComplexityLevel.COMPLEX },
    ],
  },
  {
    name: 'Texnika',
    iconKey: 'appliance',
    categories: [
      {
        name: 'Kir yuvish mashinasini ulash',
        basePrice: 150_000,
        complexityLevel: ComplexityLevel.SIMPLE,
      },
      {
        name: "Konditsioner o'rnatish",
        basePrice: 400_000,
        complexityLevel: ComplexityLevel.SIMPLE,
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
            groupId: savedGroup.id,
            sortOrder: categoryIndex,
          },
          create: { ...category, groupId: savedGroup.id, sortOrder: categoryIndex },
        }),
      );
    }
  }

  return categories;
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
