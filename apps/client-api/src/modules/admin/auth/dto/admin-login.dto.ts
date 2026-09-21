import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { MAX_PASSWORD_LENGTH } from '../password-policy';

/** Kirishdagi eng qisqa qabul qilinadigan parol — siyosat chegarasi emas. */
const LOGIN_MIN_PASSWORD_LENGTH = 10;

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@hizmat24.uz' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email notoʻgʻri' })
  @MaxLength(160)
  email!: string;

  /**
   * Chegaralar `password-policy.ts` dan olinadi — ikki joydagi son
   * bir-biridan uzoqlashib ketmasin.
   *
   * Pastki chegara siyosatnikidan (12) PAST: kirish yoʻli siyosatni
   * qoʻllamaydi, u faqat aql bovar qiladigan oʻlchamni tekshiradi. Siyosat
   * ertaga qatʼiylashsa, eski parolli admin kirish sahifasidayoq
   * toʻxtatilib, hisobidan ayrilib qolmasligi kerak.
   */
  @ApiProperty({ minLength: LOGIN_MIN_PASSWORD_LENGTH, maxLength: MAX_PASSWORD_LENGTH })
  @IsString()
  @Length(LOGIN_MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, {
    message: `Parol kamida ${LOGIN_MIN_PASSWORD_LENGTH} belgidan iborat boʻlsin`,
  })
  password!: string;
}

export class AdminTotpDto {
  @ApiProperty({ description: 'Parol bosqichidan qaytgan chipta' })
  @IsString()
  @MaxLength(400)
  challengeToken!: string;

  @ApiProperty({ example: '123456' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value))
  @Matches(/^\d{6}$/, { message: 'Kod 6 ta raqamdan iborat boʻlsin' })
  code!: string;
}
