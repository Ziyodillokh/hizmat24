import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { MASTER_ETA_MAX, MASTER_ETA_MIN, WORK_NOTE_MAX } from '../domain/master-order-rules';

export class DepartDto {
  @ApiProperty({ minimum: MASTER_ETA_MIN, maximum: MASTER_ETA_MAX, example: 20 })
  @IsInt({ message: 'Yetib borish vaqti butun daqiqada koʻrsatiladi' })
  @Min(MASTER_ETA_MIN)
  @Max(MASTER_ETA_MAX)
  etaMinutes!: number;
}

export class FinishDto {
  /**
   * Ish izohi IXTIYORIY: majburiy qilinsa, usta uni shunchaki «bajarildi»
   * deb toʻldirib qoʻyardi va chekdagi qator hech narsa aytmasdi.
   */
  @ApiPropertyOptional({ maxLength: WORK_NOTE_MAX })
  @IsOptional()
  @IsString()
  @Length(1, WORK_NOTE_MAX)
  workNote?: string;
}

export class MasterCancelDto {
  @ApiProperty({ example: 'Mashinam buzilib qoldi, yetib bora olmayman' })
  @IsString()
  @Length(10, 500, { message: 'Sababni kamida 10 belgi bilan yozing — mijoz buni koʻradi' })
  reason!: string;
}

export class DeclineDto {
  @ApiPropertyOptional({ example: 'Bu ishni bajara olmayman' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
