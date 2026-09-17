-- Kategoriya ikonasi/fotosi kaliti.
--
-- Ilova ikonani va xizmat rasmini shu kalit boʻyicha tanlaydi. Nullable:
-- kaliti yoʻq kategoriya guruhning kalitiga tushadi va hech narsa buzilmaydi.
ALTER TABLE "service_categories" ADD COLUMN "icon_key" VARCHAR(60);
