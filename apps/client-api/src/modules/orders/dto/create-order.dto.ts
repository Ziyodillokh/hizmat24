import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  ValidateNested,
} from 'class-validator';
import {
  API_PAYMENT_METHODS,
  ORDER_DESCRIPTION_MAX_LENGTH,
  ORDER_DESCRIPTION_MIN_LENGTH,
  ORDER_MAX_ATTACHMENTS,
  type ApiPaymentMethod,
} from '@shared/index';
import { AddressDto } from './address.dto';

export class CreateOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  categoryId: string;

  @ApiProperty({
    description: 'Muammo tavsifi — majburiy',
    minLength: ORDER_DESCRIPTION_MIN_LENGTH,
    maxLength: ORDER_DESCRIPTION_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty({ message: "Muammo tavsifi boʻsh boʻlishi mumkin emas" })
  @Length(ORDER_DESCRIPTION_MIN_LENGTH, ORDER_DESCRIPTION_MAX_LENGTH)
  description: string;

  @ApiPropertyOptional({ type: [String], maxItems: ORDER_MAX_ATTACHMENTS })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(ORDER_MAX_ATTACHMENTS)
  @IsUrl({ require_tld: false }, { each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  clientAddress: AddressDto;

  /**
   * Toʻlov usuli — majburiy: mijoz uni toʻlov ekranida tanlaydi va chek shu
   * asosda yoziladi. Taxminiy qiymat qoʻyilmaydi.
   */
  @ApiProperty({ enum: API_PAYMENT_METHODS, example: 'cash' })
  @IsIn(API_PAYMENT_METHODS, { message: "Toʻlov usuli notoʻgʻri" })
  paymentMethod: ApiPaymentMethod;

  /**
   * Rejalashtirilgan vaqt (ISO-8601). Berilmasa — "imkon qadar tez".
   * Kelajakdagi vaqt boʻlsa usta qidiruvi shu vaqtgacha boshlanmaydi.
   */
  @ApiPropertyOptional({ example: '2026-09-21T09:00:00+05:00' })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: "Rejalashtirilgan vaqt ISO-8601 formatida boʻlsin" })
  scheduledAt?: string;

  /** Mijoz soʻragan usta — SOʻROV, kafolat emas. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  preferredMasterId?: string;

  /**
   * Idempotentlik kaliti — ilova tugmani ikki marta bosganda ikkita
   * buyurtma yaratilmasligi uchun (biznes-qoida 5.6). Sarlavha orqali ham
   * yuborilishi mumkin; ikkalasi berilsa sarlavha ustun turadi.
   */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @Length(8, 120)
  idempotencyKey?: string;
}
