import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FastifyReply } from 'fastify';
import { fail, type ApiErrorBody } from '@shared/index';

/** Shu chegaradan yuqori statuslar server tomonidagi nosozlik hisoblanadi va logga yoziladi. */
const SERVER_ERROR_STATUS_THRESHOLD = 500;

/** Barcha xatolarni yagona { success, data, error } konvertiga keltiradi (1.2). */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const { status, body } = this.normalize(exception);

    if (status >= SERVER_ERROR_STATUS_THRESHOLD) {
      this.logger.error({ err: exception, code: body.code }, `Kutilmagan xato: ${body.message}`);
    }

    void reply.status(status).type('application/json; charset=utf-8').send(fail(body));
  }

  private normalize(exception: unknown): { status: number; body: ApiErrorBody } {
    if (exception instanceof HttpException) {
      return { status: exception.getStatus(), body: this.fromHttpException(exception) };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrismaError(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: 'INTERNAL_SERVER_ERROR', message: 'Ichki server xatosi' },
    };
  }

  private fromHttpException(exception: HttpException): ApiErrorBody {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return { code: this.statusToCode(exception.getStatus()), message: response };
    }

    const payload = response as Record<string, unknown>;
    return {
      code: (payload.code as string) ?? this.statusToCode(exception.getStatus()),
      message: Array.isArray(payload.message)
        ? (payload.message as string[]).join('; ')
        : ((payload.message as string) ?? exception.message),
      details: payload.details ?? (Array.isArray(payload.message) ? payload.message : undefined),
    };
  }

  private fromPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    body: ApiErrorBody;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          body: { code: 'DUPLICATE_RESOURCE', message: 'Bunday yozuv allaqachon mavjud' },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: { code: 'RESOURCE_NOT_FOUND', message: 'Resurs topilmadi' },
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          body: { code: 'DATABASE_ERROR', message: "Ma'lumotlar bazasi xatosi" },
        };
    }
  }

  private statusToCode(status: number): string {
    return HttpStatus[status] ?? 'ERROR';
  }
}
