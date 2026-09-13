import santexnikaTamiri from '@/assets/services/santexnika-tamiri.webp';
import suvIsitgich from '@/assets/services/suv-isitgich.webp';
import unitaz from '@/assets/services/unitaz.webp';
import rakovina from '@/assets/services/rakovina.webp';
import quvurlar from '@/assets/services/quvurlar.webp';
import barchasi from '@/assets/services/barchasi.webp';

/**
 * Bosh sahifadagi xizmat kartalarining rasmlari — loyiha egasi bergan
 * (2026-09-13), ilova ichiga joylangan 420x280 WebP (13–22 KB har biri).
 *
 * Kalit — kategoriya `id`. Rasmi yoʻq kategoriya kartada soha ikonasi
 * bilan chiziladi (`ServiceTile`), shuning uchun yangi kategoriya rasmsiz
 * ham buzilmaydi.
 *
 * Rasmlar illyustrativ: ular xizmatni tanitadi, aniq ustani yoki buyurtmani
 * emas.
 */
export const SERVICE_IMAGES: Record<string, string> = {
  'c-repair': santexnikaTamiri,
  'c-water-heater': suvIsitgich,
  'c-toilet': unitaz,
  'c-tap': rakovina,
  'c-pipes': quvurlar,
};

/** "Barcha xizmatlar" kartasi — u kategoriya emas, shuning uchun alohida. */
export const ALL_SERVICES_IMAGE = barchasi;
