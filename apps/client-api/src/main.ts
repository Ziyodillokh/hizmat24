import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import type { AppEnv } from './infra/config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 2 * 1024 * 1024 }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  await configureApp(app);

  const config = app.get(ConfigService<AppEnv, true>);

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Hizmat24 — Mijoz ilovasi API')
      .setDescription(
        "Santexnik/elektrik xizmatlari platformasi. Barcha narxlar so'mda (UZS), " +
          'vaqtlar Asia/Tashkent zonasida qaytariladi.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
      jsonDocumentUrl: 'api/docs-json',
    });
  }

  await app.listen({
    port: config.get('PORT', { infer: true }),
    host: config.get('HOST', { infer: true }),
  });
}

void bootstrap();
