import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { MAX_VIDEO_BYTES } from './modules/admin/catalog/domain/media-rules';
import { buildCorsOptions } from './common/http/cors-options';
import type { AppEnv } from './infra/config/env.validation';

/**
 * HTTP qatlamining global sozlamalari. main.ts va e2e testlar bir xil
 * konfiguratsiyadan foydalanadi — test va production oʻrtasida farq bo'lmasin.
 */
export async function configureApp(app: NestFastifyApplication): Promise<void> {
  await app.register(helmet, { contentSecurityPolicy: false });

  /*
   * Fayl yuklash — faqat admin katalogida ishlatiladi, lekin plagin
   * ilovaning butun HTTP qatlamiga bir marta ulanadi.
   *
   * Chegara SHU YERDA ham qoʻyiladi: `checkMedia` faylni butunlay
   * oʻqib boʻlgach tekshiradi, bu esa 500 MB li faylni xotiraga
   * yuklashga imkon berardi. Plagin uni oʻqish paytidayoq toʻxtatadi.
   */
  await app.register(multipart, { limits: { fileSize: MAX_VIDEO_BYTES, files: 1 } });

  const config = app.get(ConfigService<AppEnv, true>);

  const corsOptions = buildCorsOptions(
    config.get('CORS_ORIGINS', { infer: true }),
    config.get('ADMIN_WEB_ORIGIN', { infer: true }),
  );

  if (corsOptions) {
    app.enableCors(corsOptions);
  }

  app.enableShutdownHooks();

  // Health va metrics — infra uchun: load balancer va Prometheus ular
  // `/api/v1/...` ostida boʻlishini kutmaydi.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET },
    ],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
}
