// ============================================================
// UrbanCore Gateway — Environment Configuration
// All config is loaded from environment variables.
// Uses Zod for runtime validation — crashes early if misconfigured.
// ============================================================

import { z } from 'zod';

const configSchema = z.object({
  // ─── Application ─────────────────────────────────────────
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_VERSION: z.string().default('0.1.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // ─── Server ──────────────────────────────────────────────
  GATEWAY_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  GATEWAY_HOST: z.string().default('0.0.0.0'),

  // ─── Auth ────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // ─── CORS ────────────────────────────────────────────────
  CORS_ORIGINS: z.string().transform((val) => val.split(',')),

  // ─── Database ────────────────────────────────────────────
  DATABASE_URL: z.string().url(),

  // ─── Redis ───────────────────────────────────────────────
  REDIS_URL: z.string().url(),

  // ─── Internal Services ───────────────────────────────────
  AI_SERVICE_URL: z.string().url().default('http://ai-service:8001'),
  GIS_SERVICE_URL: z.string().url().default('http://gis-service:8002'),
  INTELLIGENCE_SERVICE_URL: z.string().url().default('http://intelligence-service:8003'),
  AI_SERVICE_INTERNAL_SECRET: z.string().min(16),
  GIS_SERVICE_INTERNAL_SECRET: z.string().min(16),
  INTELLIGENCE_SERVICE_INTERNAL_SECRET: z.string().min(16),

  // ─── Rate Limiting ───────────────────────────────────────
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
});

export type AppConfig = z.infer<typeof configSchema>;

function loadConfig(): AppConfig {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

// Singleton — loaded once at startup
export const config: AppConfig = loadConfig();
