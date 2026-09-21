import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@client/common/decorators/current-user.decorator';
import { Public } from '@client/common/decorators/public.decorator';
import { AuthService, type AuthTokens, type RequestOtpResult, type UserView } from './auth.service';
import { RefreshTokenDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  // IP boʻyicha 5 daqiqada 10 ta: bitta ofis/Wi-Fi ortidagi bir necha odam
  // ketma-ket kirganda 3 ta juda kam edi — toʻrtinchi odam 429 olardi.
  // Bitta raqamga SMS toshqini alohida, raqam boʻyicha 60 s kutish bilan
  // toʻxtatiladi (OTP_RESEND_COOLDOWN_MS).
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @ApiOperation({ summary: 'Telefon raqamiga SMS-OTP yuborish' })
  requestOtp(@Body() dto: RequestOtpDto): Promise<RequestOtpResult> {
    return this.auth.requestOtp(dto.phoneNumber);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @ApiOperation({ summary: 'OTP tekshirish va tokenlar olish' })
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthTokens & { user: UserView }> {
    return this.auth.verifyOtp(dto.phoneNumber, dto.otpCode);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access tokenni yangilash (rotation + reuse detection)' })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sessiyani yopish' })
  async logout(@CurrentUser('id') userId: string, @Body() dto: RefreshTokenDto): Promise<void> {
    await this.auth.logout(userId, dto.refreshToken);
  }
}
