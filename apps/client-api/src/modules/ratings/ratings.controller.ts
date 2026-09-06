import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@client/common/decorators/current-user.decorator';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService, type RatingView } from './ratings.service';

@ApiTags('ratings')
@ApiBearerAuth()
@Controller({ path: 'orders/:orderId/rating', version: '1' })
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buyurtmani baholash (1-5 yulduz)' })
  rate(
    @CurrentUser('id') clientId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body() dto: CreateRatingDto,
  ): Promise<RatingView> {
    return this.ratings.rateOrder(orderId, clientId, dto.stars, dto.comment ?? null);
  }
}
