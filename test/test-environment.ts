import { execSync } from 'node:child_process';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export interface TestInfrastructure {
  databaseUrl: string;
  redisHost: string;
  redisPort: number;
  stop: () => Promise<void>;
}

/**
 * Integration/e2e testlar haqiqiy Postgres va Redis ustida ishlaydi (TZ 9.8) —
 * mock emas, shu sababli `FOR UPDATE SKIP LOCKED`, triggerlar va tranzaksiyalar
 * xatti-harakati production bilan bir xil tekshiriladi.
 */
export async function startInfrastructure(): Promise<TestInfrastructure> {
  const postgres: StartedPostgreSqlContainer = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('hizmat24_test')
    .withUsername('hizmat24')
    .withPassword('hizmat24')
    .start();

  const redis: StartedTestContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .start();

  const databaseUrl = postgres.getConnectionUri();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  return {
    databaseUrl,
    redisHost: redis.getHost(),
    redisPort: redis.getMappedPort(6379),
    stop: async () => {
      await redis.stop();
      await postgres.stop();
    },
  };
}
