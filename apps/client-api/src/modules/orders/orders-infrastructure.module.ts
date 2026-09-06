import { Module } from '@nestjs/common';
import { OrdersRepository } from './infrastructure/orders.repository';

/**
 * Faqat persistence qatlami. Matching moduli order'larni o'qish/yozish uchun
 * shu modulni import qiladi — orders application qatlamiga bog'lanmaydi (9.2).
 */
@Module({
  providers: [OrdersRepository],
  exports: [OrdersRepository],
})
export class OrdersInfrastructureModule {}
