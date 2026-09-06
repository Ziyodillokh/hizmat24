import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  ValidateNested,
} from 'class-validator';
import {
  ORDER_DESCRIPTION_MAX_LENGTH,
  ORDER_DESCRIPTION_MIN_LENGTH,
  ORDER_MAX_ATTACHMENTS,
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
  @IsNotEmpty({ message: "Muammo tavsifi bo'sh bo'lishi mumkin emas" })
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
}
