import { parseCorsOrigins } from './cors';

export type EnvironmentVariables = {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
};

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const databaseUrl = config.DATABASE_URL;

  if (typeof databaseUrl !== 'string' || !databaseUrl.trim()) {
    throw new Error('DATABASE_URL is required');
  }

  const rawPort = config.PORT ?? '3000';
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number');
  }

  const nodeEnv =
    typeof config.NODE_ENV === 'string' && config.NODE_ENV.trim()
      ? config.NODE_ENV.trim()
      : 'development';

  const corsOrigin =
    typeof config.CORS_ORIGIN === 'string' && config.CORS_ORIGIN.trim()
      ? config.CORS_ORIGIN.trim()
      : 'http://localhost:3000';

  if (parseCorsOrigins(corsOrigin).length === 0) {
    throw new Error('CORS_ORIGIN must contain at least one valid origin');
  }

  return {
    DATABASE_URL: databaseUrl.trim(),
    PORT: port,
    NODE_ENV: nodeEnv,
    CORS_ORIGIN: corsOrigin,
  };
}
