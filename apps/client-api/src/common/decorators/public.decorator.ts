import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Global JwtAuthGuard'dan chetlab o'tish (faqat auth va health endpointlari uchun). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
