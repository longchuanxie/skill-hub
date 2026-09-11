import { z } from 'zod';

// Central environment contract. Imported for its side effect at the top of
// app.ts: validation runs once at startup and the process refuses to boot
// with an invalid configuration (fail-fast).
const boolish = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().optional(),

  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/skillhub'),

  // JWT - required in production; dev/test fall back to insecure defaults
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),

  // SMTP (email)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),

  // Frontend
  FRONTEND_URL: z.string().optional(),
  OAUTH_CALLBACK_BASE_URL: z.string().optional(),

  // Storage
  STORAGE_PROVIDER: z.enum(['local']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),

  // Rate limiting (see middleware/rateLimit)
  RATE_LIMIT_ENABLED: boolish,
  REDIS_URL: z.string().optional(),

  // Enterprise multi-tenancy
  ENTERPRISE_MODE: z.enum(['single', 'multi']).default('multi'),
  DEFAULT_ENTERPRISE_ID: z.string().optional(),

  // Initial super admin bootstrap
  INITIAL_SUPER_ADMIN_USERNAME: z.string().optional(),
  INITIAL_SUPER_ADMIN_EMAIL: z.string().optional(),
  INITIAL_SUPER_ADMIN_PASSWORD: z.string().optional(),

  // Misc
  LOG_LEVEL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

// Production hard requirements that cannot have safe defaults.
if (env.NODE_ENV === 'production') {
  const missing: string[] = [];
  if (!env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `Refusing to start in production with missing required environment variables: ${missing.join(', ')}`
    );
    process.exit(1);
  }
}

export default env;
