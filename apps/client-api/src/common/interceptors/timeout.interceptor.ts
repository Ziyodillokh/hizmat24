import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { catchError, throwError, timeout, TimeoutError, type Observable } from 'rxjs';

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/**
 * DIQQAT: bu interceptor `useClass` bilan ro'yxatdan o'tkazilmaydi — Nest
 * konstruktordagi `number` ni DI orqali inject qilmoqchi bo'lib xato beradi
 * (standart qiymat bunda yordam bermaydi). `app.module.ts` da `useFactory`
 * orqali yaratiladi.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((error: unknown) =>
        throwError(() =>
          error instanceof TimeoutError
            ? new RequestTimeoutException("So'rov vaqti tugadi")
            : error,
        ),
      ),
    );
  }
}
