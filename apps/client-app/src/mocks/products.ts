import type { ShopCategory } from './shops';

/**
 * Doʻkon mahsulotlari.
 *
 * Katalog KATEGORIYA boʻyicha saqlanadi, doʻkon boʻyicha emas: bitta
 * kategoriyadagi ikki doʻkon deyarli bir xil assortimentga ega boʻladi va
 * har biriga alohida roʻyxat yozish maʼlumotni ikkilantirardi. Doʻkonga xos
 * farq — narx: `shopProducts()` uni doʻkon identifikatoridan hosil qilingan
 * barqaror koeffitsient bilan hisoblaydi.
 */
export interface Product {
  id: string;
  name: string;
  /** Soʻmdagi butun narx. */
  price: number;
  /** dona, m, m2, kg, qop, toʻplam, litr. */
  unit: string;
  description: string;
  /** `productIcon()` uchun kalit — rasm URL emas. */
  iconKey: string;
}

export const PRODUCTS_BY_CATEGORY: Record<ShopCategory, Product[]> = {
  'Qurilish mollari': [
    {
      id: 'portlandsement-m400',
      name: 'Portlandsement M400',
      price: 62000,
      unit: 'qop',
      description: 'M400 markali portlandsement, 50 kg qop, beton va suvoq qorishmalari uchun.',
      iconKey: 'cement',
    },
    {
      id: 'gipskarton-list',
      name: 'Gipskarton devor listi',
      price: 68000,
      unit: 'dona',
      description: 'Devor va shift qoplamasi uchun 12,5 mm qalinlikdagi list, 1200x2500 mm.',
      iconKey: 'board',
    },
    {
      id: 'ud-profil',
      name: 'Galvanizli UD profil',
      price: 22000,
      unit: 'dona',
      description: 'Osma shift karkasi uchun galvanizli UD profil, 27x28 mm, uzunligi 3 metr.',
      iconKey: 'profile',
    },
    {
      id: 'mineral-paxta',
      name: 'Mineral paxta plita',
      price: 38000,
      unit: 'm2',
      description: '50 mm qalinlikdagi mineral paxta plita, issiqlik va tovush izolyatsiyasi uchun.',
      iconKey: 'insulation',
    },
    {
      id: 'qizil-gisht',
      name: 'Qizil pishgan gʻisht',
      price: 1300,
      unit: 'dona',
      description: 'M150 markali pishgan qizil gʻisht, 250x120x65 mm, tashqi devor terish uchun.',
      iconKey: 'brick',
    },
    {
      id: 'qurilish-qumi',
      name: 'Yuvilgan qurilish qumi',
      price: 16000,
      unit: 'qop',
      description: 'Yuvilgan qurilish qumi, fraksiya 0-2 mm, 25 kg qop, qorishma tayyorlash uchun.',
      iconKey: 'sand',
    },
    {
      id: 'start-shpaklovka',
      name: 'Gipsli start shpaklovka',
      price: 45000,
      unit: 'qop',
      description: 'Gips asosidagi start shpaklovka, 20 kg qop, devor tekislash qatlami uchun.',
      iconKey: 'putty',
    },
    {
      id: 'alyuminiy-narvon',
      name: 'Alyuminiy ikki qismli narvon',
      price: 1150000,
      unit: 'dona',
      description: 'Alyuminiy narvon, 12 pogʻona, ish balandligi 4,2 metr, yuk chidamliligi 150 kg.',
      iconKey: 'ladder',
    },
  ],
  'Elektr tovarlar': [
    {
      id: 'kabel-vvg-3x25',
      name: 'Mis kabel VVG 3x2,5',
      price: 26000,
      unit: 'm',
      description: 'Uch tomirli mis oʻtkazgich, 2,5 mm² kesim, 220 V ichki elektr tarmogʻi uchun.',
      iconKey: 'cable',
    },
    {
      id: 'avtomat-25a',
      name: 'Avtomat vyklyuchatel 25A',
      price: 34000,
      unit: 'dona',
      description: 'Bir qutbli modulli avtomat, 25 A nominal tok, DIN reykaga oʻrnatiladi.',
      iconKey: 'breaker',
    },
    {
      id: 'rozetka-ikki-uya',
      name: 'Ikki uyali rozetka',
      price: 27000,
      unit: 'dona',
      description: 'Yer ulanishli ikki uyali ichki rozetka, 16 A, devor osti qutisiga mos.',
      iconKey: 'socket',
    },
    {
      id: 'vyklyuchatel-ikki',
      name: 'Ikki klavishli vyklyuchatel',
      price: 21000,
      unit: 'dona',
      description: 'Ichki oʻrnatma ikki klavishli vyklyuchatel, 10 A, IP20 himoya darajasi.',
      iconKey: 'switch',
    },
    {
      id: 'led-lampa-12vt',
      name: 'Svetodiod lampa 12 Vt',
      price: 23000,
      unit: 'dona',
      description: 'E27 patronli svetodiod lampa, 12 Vt quvvat, 4000 K neytral yorugʻlik.',
      iconKey: 'lamp',
    },
    {
      id: 'led-lenta-toplam',
      name: 'Svetodiod lenta toʻplami',
      price: 145000,
      unit: 'toʻplam',
      description: 'Besh metrli 12 V svetodiod lenta, metriga 60 dioda, quvvat bloki bilan.',
      iconKey: 'ledstrip',
    },
    {
      id: 'elektr-shchiti',
      name: 'Modulli elektr shchiti',
      price: 185000,
      unit: 'dona',
      description: 'Devor ichiga oʻrnatiladigan 12 modulli plastik shchit, shina va qopqoq bilan.',
      iconKey: 'panel',
    },
    {
      id: 'stabilizator-10kva',
      name: 'Kuchlanish stabilizatori 10 kVA',
      price: 2350000,
      unit: 'dona',
      description: 'Bir fazali releli stabilizator, 10 kVA quvvat, 140-260 V kirish oraligʻi.',
      iconKey: 'measure',
    },
  ],
  Santexnika: [
    {
      id: 'ppr-quvur-25',
      name: 'Polipropilen quvur 25 mm',
      price: 13000,
      unit: 'm',
      description: 'PN20 polipropilen quvur, diametri 25 mm, issiq suv va isitish tizimlari uchun.',
      iconKey: 'pipe',
    },
    {
      id: 'ppr-fitinglar',
      name: 'PPR fitinglar toʻplami',
      price: 38000,
      unit: 'toʻplam',
      description: 'PPR fitinglar toʻplami: burchak, mufta va troynik, 25 mm payvandlash uchun.',
      iconKey: 'pipe',
    },
    {
      id: 'shar-kran-12',
      name: 'Latun shar kran 1/2',
      price: 42000,
      unit: 'dona',
      description: 'Latun korpusli chorak burilishli shar kran, ishchi bosimi 16 bargacha.',
      iconKey: 'faucet',
    },
    {
      id: 'rakovina-sifoni',
      name: 'Rakovina sifoni 40 mm',
      price: 58000,
      unit: 'dona',
      description: 'Butilkasimon sifon, plastik korpus, 40 mm chiqish quvuri va zichlagichlar bilan.',
      iconKey: 'sink',
    },
    {
      id: 'bir-richagli-smesitel',
      name: 'Bir richagli smesitel',
      price: 395000,
      unit: 'dona',
      description: 'Oshxona rakovinasi uchun smesitel, aylanuvchi joʻmrak va keramik kartrij.',
      iconKey: 'faucet',
    },
    {
      id: 'dush-toplami',
      name: 'Termostatli dush toʻplami',
      price: 890000,
      unit: 'toʻplam',
      description: 'Termostatik smesitel, sozlanuvchi shtanga, uch rejimli leyka va shlang.',
      iconKey: 'shower',
    },
    {
      id: 'suv-filtri',
      name: 'Uch bosqichli suv filtri',
      price: 1250000,
      unit: 'dona',
      description: 'Oqim ostidagi filtr: mexanik, koʻmir va posttugatuvchi kartrijlar bilan.',
      iconKey: 'filter',
    },
    {
      id: 'kompakt-unitaz',
      name: 'Ikki rejimli kompakt unitaz',
      price: 1750000,
      unit: 'dona',
      description: 'Sanfayans unitaz, 3/6 litrli ikki rejimli bachok va mikroliftli qopqoq.',
      iconKey: 'toilet',
    },
  ],
  'Boʻyoq va lak': [
    {
      id: 'akril-boyoq-oq',
      name: 'Suvli akril boʻyoq oq',
      price: 145000,
      unit: 'litr',
      description: 'Ichki devor va shift uchun akril asosli, matt qoplama, 8 soatda quriydi.',
      iconKey: 'paint',
    },
    {
      id: 'alkid-emal',
      name: 'Alkid emal boʻyoq',
      price: 68000,
      unit: 'kg',
      description: 'Metall va yogʻoch yuzalar uchun yaltiroq emal, ochiq havoda chidamli.',
      iconKey: 'paint',
    },
    {
      id: 'chuqur-grunt',
      name: 'Chuqur singuvchi grunt',
      price: 92000,
      unit: 'litr',
      description: 'Gʻovak yuzani mustahkamlaydi va boʻyoq sarfini kamaytiradi, singishi 5 mm.',
      iconKey: 'primer',
    },
    {
      id: 'parket-laki',
      name: 'Parket laki yarim yaltiroq',
      price: 210000,
      unit: 'litr',
      description: 'Poliuretan asosli, yurish yuklamasiga chidamli, uch qatlam surtiladi.',
      iconKey: 'varnish',
    },
    {
      id: 'pardoz-shpaklovka',
      name: 'Tayyor pardoz shpaklovkasi',
      price: 135000,
      unit: 'qop',
      description: 'Yakuniy tekislash uchun polimer aralashma, qatlam 0,2 dan 2 mm gacha.',
      iconKey: 'putty',
    },
    {
      id: 'boyoq-valigi',
      name: 'Boʻyoq valigi tukli 240 mm',
      price: 42000,
      unit: 'dona',
      description: 'Poliakril tukli qoplama, tuk uzunligi 18 mm, suvli boʻyoq uchun.',
      iconKey: 'roller',
    },
    {
      id: 'moyqalam-toplami',
      name: 'Moʻyqalam toʻplami 5 dona',
      price: 58000,
      unit: 'toʻplam',
      description: 'Tabiiy tukli tekis moʻyqalamlar 20 dan 75 mm gacha, burchak va derazalar uchun.',
      iconKey: 'brush',
    },
    {
      id: 'niqoblash-lentasi',
      name: 'Boʻyoq niqoblash lentasi',
      price: 12000,
      unit: 'dona',
      description: 'Kengligi 48 mm, uzunligi 40 m, iz qoldirmay ajraladi, chegara aniq chiqadi.',
      iconKey: 'tape',
    },
  ],
  Asboblar: [
    {
      id: 'perforator-850vt',
      name: 'Perforator SDS-plus 850 Vt',
      price: 1450000,
      unit: 'dona',
      description: 'SDS-plus patronli, 3 rejimli, zarb kuchi 2,8 J, beton va gʻishtga teshik ochadi.',
      iconKey: 'drill',
    },
    {
      id: 'shurupovert-18v',
      name: 'Shurupovert akkumulyatorli 18 V',
      price: 890000,
      unit: 'dona',
      description: '18 V li-ion akkumulyator, 45 Nm aylantirish momenti, ikki tezlikli reduktor.',
      iconKey: 'screwdriver',
    },
    {
      id: 'bolgarka-125',
      name: 'Burchak bolgarka 125 mm',
      price: 520000,
      unit: 'dona',
      description: '125 mm disk, 11000 ayl/daq, metall va keramika kesish uchun himoya qopqogʻi.',
      iconKey: 'grinder',
    },
    {
      id: 'lazerli-olchagich',
      name: 'Lazerli oʻlchagich 40 m',
      price: 380000,
      unit: 'dona',
      description: '40 m masofani ±2 mm aniqlikda oʻlchaydi, maydon va hajm hisoblash rejimi bor.',
      iconKey: 'measure',
    },
    {
      id: 'kalitlar-toplami',
      name: 'Kalitlar toʻplami 108 dona',
      price: 640000,
      unit: 'toʻplam',
      description: 'Xrom-vanadiy poʻlat, 1/4 va 1/2 dyuym uchliklar, zarbaga chidamli keysda.',
      iconKey: 'wrenchset',
    },
    {
      id: 'transformer-narvon',
      name: 'Alyuminiy transformer narvon',
      price: 1250000,
      unit: 'dona',
      description: 'Uch qismli transformer narvon, ish balandligi 6,2 m, koʻtarish quvvati 150 kg.',
      iconKey: 'ladder',
    },
    {
      id: 'himoya-toplami',
      name: 'Himoya koʻzoynagi va qoʻlqop',
      price: 45000,
      unit: 'toʻplam',
      description: 'Zarbaga chidamli polikarbonat koʻzoynak va nitril qoplamali toʻqima qoʻlqop.',
      iconKey: 'safety',
    },
    {
      id: 'ruletka-5m',
      name: 'Oʻlchov ruletkasi 5 m',
      price: 32000,
      unit: 'dona',
      description: 'Poʻlat tasma 25 mm, magnitli ilgak va avtomatik toʻxtatgich bilan.',
      iconKey: 'tape',
    },
  ],
};

/**
 * Doʻkon narx koeffitsienti: identifikatordan hosil qilingan BARQAROR qiymat
 * (0,92 dan 1,08 gacha). `Math.random()` ishlatilmaydi — har renderda narx
 * oʻzgarib turishi maʼlumotni ishonchsiz qilardi.
 */
function priceFactor(shopId: string): number {
  let hash = 0;
  for (let i = 0; i < shopId.length; i += 1) hash = (hash * 31 + shopId.charCodeAt(i)) % 1000;
  return 0.92 + (hash % 17) / 100;
}

/** Narx 500 soʻmgacha yaxlitlanadi — bozorda narxlar shunday koʻrsatiladi. */
const roundPrice = (value: number): number => Math.round(value / 500) * 500;

export function shopProducts(shopId: string, category: ShopCategory): Product[] {
  const factor = priceFactor(shopId);
  return PRODUCTS_BY_CATEGORY[category].map((product) => ({
    ...product,
    price: roundPrice(product.price * factor),
  }));
}

export function findProduct(
  shopId: string,
  category: ShopCategory,
  productId: string,
): Product | undefined {
  return shopProducts(shopId, category).find((product) => product.id === productId);
}
