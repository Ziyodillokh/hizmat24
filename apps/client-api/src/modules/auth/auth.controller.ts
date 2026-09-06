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
  @Throttle({ default: { limit: 3, ttl: 300_000 } })
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
