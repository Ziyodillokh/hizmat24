import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: "Muammo oʻzi hal boʻldi" })
  @IsString()
  @Length(3, 500)
  reason: string;
}
