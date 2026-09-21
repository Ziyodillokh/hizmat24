import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, IsUUID, Length } from 'class-validator';
import { MAX_REQUESTED_CATEGORIES, MIN_REQUESTED_CATEGORIES } from '../domain/application-rules';

export const MIN_REJECTION_REASON_LENGTH = 10;
export const MAX_REJECTION_REASON_LENGTH = 500;

/**
 * Tasdiqlash. Kategoriyalarni MODERATOR tanlaydi — usta soʻragani taklif,
 * qaror emas: odam «hamma xizmatni qilaman» deb belgilab yuborishi mumkin.
 */
export class ApproveApplicationDto {
  @ApiProperty({ description: 'Ustaga biriktiriladigan xizmatlar', type: [String] })
  @IsArray()
  @ArrayMinSize(MIN_REQUESTED_CATEGORIES)
  @ArrayMaxSize(MAX_REQUESTED_CATEGORIES)
  @IsUUID('4', { each: true })
  categoryIds: string[];
}

/**
 * Rad etish. Sabab MAJBURIY va u mijoz ilovasida soʻzma-soʻz koʻrinadi —
 * shuning uchun eng kam uzunlik bor: «yoʻq» degan javob odamga nima
 * qilish kerakligini aytmaydi.
 */
export class RejectApplicationDto {
  @ApiProperty({ example: 'Sertifikat nusxasi oʻqilmadi — qaytadan yuboring.' })
  @IsString()
  @Length(MIN_REJECTION_REASON_LENGTH, MAX_REJECTION_REASON_LENGTH)
  reason: string;
}
