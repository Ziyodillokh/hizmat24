import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@hizmat24.uz' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email notoʻgʻri' })
  @MaxLength(160)
  email!: string;

  /**
   * Yuqori chegara ham kerak: scrypt kiritilgan matnning butun uzunligini
   * qayta ishlaydi, shuning uchun uzun parol serverni band qilib turishi
   * mumkin (DoS).
   */
  @ApiProperty({ minLength: 10, maxLength: 200 })
  @IsString()
  @Length(10, 200, { message: 'Parol kamida 10 belgidan iborat boʻlsin' })
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
