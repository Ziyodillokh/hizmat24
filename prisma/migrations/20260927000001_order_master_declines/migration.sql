-- Usta rad etgan buyurtma unga QAYTMAYDI.
--
-- Rad etish javob bermaslikdan farq qiladi: usta ochiq «yoʻq» dedi. Bu
-- yozuvsiz qidiruv uni bir necha soniyadan keyin oʻsha buyurtmaga
-- qaytarardi — rejalashtiruvchi tayinlashni qaytadan boshlaydi va joriy
-- urinishdagi istisno roʻyxati unda yoʻq.
CREATE TABLE "order_master_declines" (
    "order_id" UUID NOT NULL,
    "master_id" UUID NOT NULL,
    "reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_master_declines_pkey" PRIMARY KEY ("order_id", "master_id")
);

CREATE INDEX "order_master_declines_master_id_idx" ON "order_master_declines"("master_id");

ALTER TABLE "order_master_declines"
  ADD CONSTRAINT "order_master_declines_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_master_declines"
  ADD CONSTRAINT "order_master_declines_master_id_fkey"
  FOREIGN KEY ("master_id") REFERENCES "masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
