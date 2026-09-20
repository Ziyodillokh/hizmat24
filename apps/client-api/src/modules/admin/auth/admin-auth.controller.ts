import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Public } from '@client/common/decorators/public.decorator';
import { AdminOnly } from '@client/common/decorators/admin.decorator';
import { readBearerToken } from '../guards/admin.guard';
import {
  AdminAuthService,
  type PasswordAccepted,
  type RequestContext,
  type SignedIn,
} from './admin-auth.service';
import { AdminLoginDto, AdminTotpDto } from './dto/admin-login.dto';

const contextOf = (request: FastifyRequest): RequestContext => ({
  ipAddress: request.ip ?? null,
  userAgent: request.headers['user-agent'] ?? null,
});

@ApiTags('admin-auth')
@Controller({ path: 'admin/auth', version: '1' })
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  /**
   * Cheklov hisobdan EMAS, IP dan quriladi: hisob blokini bir necha
   * hisobga taqsimlab aylanib oʻtish mumkin, IP cheklovi esa bunga
   * yoʻl qoʻymaydi.
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '1-bosqich: email va parol' })
  login(@Body() dto: AdminLoginDto, @Req() request: FastifyRequest): Promise<PasswordAccepted> {
    return this.auth.signInWithPassword(dto.email, dto.password, contextOf(request));
  }

  @Public()
  @Post('totp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: '2-bosqich: autentifikator kodi' })
  totp(@Body() dto: AdminTotpDto, @Req() request: FastifyRequest): Promise<SignedIn> {
    return this.auth.signInWithTotp(dto.challengeToken, dto.code, contextOf(request));
  }

  @AdminOnly()
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Sessiyani bekor qilish' })
  async logout(@Req() request: FastifyRequest): Promise<void> {
    const token = readBearerToken(request.headers.authorization);
    if (token) await this.auth.signOut(token, contextOf(request));
  }
}
