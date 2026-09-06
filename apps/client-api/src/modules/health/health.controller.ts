import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  Inject,
  Logger,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  type HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { collectDefaultMetrics, register } from 'prom-client';
import { timingSafeEqual } from 'node:crypto';
import { Public } from '@client/common/decorators/public.decorator';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { REDIS_CLIENT } from '@client/infra/redis/redis.module';
import type { AppEnv } from '@client/infra/config/env.validation';

collectDefaultMetrics({ prefix: 'hizmat24_client_api_' });

@ApiTags('health')
@Controller({ version: VERSION_NEUTRAL })
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Public()
  @Get('health/live')
  @ApiExcludeEndpoint()
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Public()
  @Get('health/ready')
  @HealthCheck()
  @ApiExcludeEndpoint()
  ready() {
    return this.health.check([() => this.checkDatabase(), () => this.checkRedis()]);
  }

  /**
   * Metrikalar ichki monitoring uchun. `METRICS_TOKEN` berilmagan bo'lsa endpoint
   * yopiq — anonim so'rov orqali ichki holat oshkor bo'lmasin.
   */
  @Public()
  @Get('metrics')
  @Header('content-type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiExcludeEndpoint()
  metrics(@Headers('x-metrics-token') token?: string): Promise<string> {
    const expected = this.config.get('METRICS_TOKEN', { infer: true });

    if (!expected || !this.matchesToken(expected, token)) {
      throw new ForbiddenException("Metrikalarga ruxsat yo'q");
    }

    return register.metrics();
  }

  private matchesToken(expected: string, provided?: string): boolean {
    if (!provided) return false;

    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(provided);

    return (
      expectedBuffer.length === providedBuffer.length &&
      timingSafeEqual(expectedBuffer, providedBuffer)
    );
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    const check = this.indicator.check('database');
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return check.up();
    } catch (error) {
      // Tafsilotlar faqat serverda qoladi — anonim chaqiruvchiga umumiy xabar.
      this.logger.error({ err: error }, 'Readiness: DB tekshiruvi muvaffaqiyatsiz');
      return check.down({ message: 'unavailable' });
    }
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    const check = this.indicator.check('redis');
    try {
      await this.redis.ping();
      return check.up();
    } catch (error) {
      this.logger.error({ err: error }, 'Readiness: Redis tekshiruvi muvaffaqiyatsiz');
      return check.down({ message: 'unavailable' });
    }
  }
}
