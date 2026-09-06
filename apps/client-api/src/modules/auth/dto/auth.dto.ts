import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import { OTP_LENGTH } from '@shared/index';
import { normalizePhoneNumber } from '@client/common/utils/phone.util';

const phoneTransform = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? normalizePhoneNumber(value) : value;

export class RequestOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @Transform(phoneTransform)
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqami +998XXXXXXXXX formatida bo'lsin" })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @Transform(phoneTransform)
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqami +998XXXXXXXXX formatida bo'lsin" })
  phoneNumber: string;

  @ApiProperty({ example: '123456', minLength: OTP_LENGTH, maxLength: OTP_LENGTH })
  @IsString()
  @Length(OTP_LENGTH, OTP_LENGTH)
  @Matches(/^\d+$/, { message: "Kod faqat raqamlardan iborat bo'lsin" })
  otpCode: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @Length(32, 256)
  refreshToken: string;
}
