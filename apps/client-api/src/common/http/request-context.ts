import type { FastifyRequest } from 'fastify';

/**
 * Soʻrovning audit uchun kerakli qismi — kim qayerdan va nima bilan keldi.
 *
 * NEGA umumiy joyda: bir xil ikki maydon admin kirishida ham, usta
 * arizasida ham, keyingi boʻlimlarda ham kerak. Har modul oʻz nusxasini
 * eʼlon qilsa, biri `ip`, boshqasi `ipAddress` deb nomlab ketardi va audit
 * yozuvlari bir-biriga oʻxshamay qolardi.
 */
export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

/** Fastify soʻrovidan audit kontekstini ajratadi. */
export const requestContextOf = (request: FastifyRequest): RequestContext => ({
  ipAddress: request.ip ?? null,
  userAgent: request.headers['user-agent'] ?? null,
});
