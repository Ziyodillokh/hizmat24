-- Platforma ishlaydigan hudud: markaz + radius.
--
-- Boshlanishda bitta qator — Namangan shahri, 12 km radius. Shahar nomi
-- kodda emas, bazada: ikkinchi shahar qoʻshilganda dastur qayta
-- yigʻilmasligi kerak.
CREATE TABLE "service_areas" (
    "id" UUID NOT NULL,
    "city_name" VARCHAR(80) NOT NULL,
    "center_lat" DOUBLE PRECISION NOT NULL,
    "center_lng" DOUBLE PRECISION NOT NULL,
    "radius_km" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_areas_is_active_sort_order_idx" ON "service_areas"("is_active", "sort_order");

-- Namangan shahri markazi. Radius 12 km — shahar va yaqin atrofni qamraydi.
INSERT INTO "service_areas" ("id", "city_name", "center_lat", "center_lng", "radius_km", "updated_at")
VALUES (gen_random_uuid(), 'Namangan', 40.9983, 71.6726, 12, CURRENT_TIMESTAMP);
