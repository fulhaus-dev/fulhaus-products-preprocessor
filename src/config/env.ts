import { t } from 'elysia';
import { Value } from '@sinclair/typebox/value';

const EnvSchema = t.Object({
  PORT: t.Optional(t.Number({ minimum: 1, maximum: 65535, default: 3000 })),
  SERVER_ENVIRONMENT: t.Union([
    t.Literal('development'),
    t.Literal('production'),
  ]),
  SERVER_API_KEY: t.String({ minLength: 32, maxLength: 32 }),
  CLOUDFLARE_R2_ENDPOINT: t.String(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: t.String(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: t.String(),
  CLOUDFLARE_R2_VENDOR_PRODUCT_DATA_BUCKET_NAME: t.String(),
  GOOGLE_GEMINI_API_KEY: t.String(),
  PRODUCT_FILE_STREAM_MAX_FILE_LINE_BATCH_SIZE: t.Number(),
  PRODUCT_CATEGORY_MAX: t.Number(),
});

type Env = typeof EnvSchema.static;

const rawEnv = { ...Bun.env };

export const envConfig = Value.Convert(EnvSchema, rawEnv) as Env;

if (!Value.Check(EnvSchema, envConfig)) {
  const errors = [...Value.Errors(EnvSchema, envConfig)];
  const errorMessages = errors
    .map((e) => `   ${e.path.slice(1)}: ${e.message} (Got: "${e.value}")`)
    .join('\n');

  console.error(`\n\n❌ ENVIRONMENT VARIABLES ERROR:\n${errorMessages}\n`);
  process.exit(1);
}
