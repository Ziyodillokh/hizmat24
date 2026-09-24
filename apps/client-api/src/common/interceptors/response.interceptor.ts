import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';
import { ok, type ApiResponse } from '@shared/index';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

/**
 * Muvaffaqiyatli javoblarni { success, data, error } konvertiga o'raydi (1.2).
 *
 * `@RawResponse()` bilan belgilangan endpoint chetlab oʻtiladi: fayl
 * (masalan CSV) konvert ichiga tushib qolsa, brauzer uni ocha olmaydi.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return isRaw ? next.handle() : next.handle().pipe(map((data) => ok(data)));
  }
}
