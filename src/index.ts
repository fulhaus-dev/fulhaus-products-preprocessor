import { envConfig } from '@ludwig-preprocessor/config/env';
import { logger } from '@ludwig-preprocessor/util/logger';
import { preprocessorRoute } from '@ludwig-preprocessor/v1/preprocessor';
import { Elysia, t } from 'elysia';

const app = new Elysia();

// PUBLIC ROUTES
app.get('/', () => 'Hello from 🛋️Ludwig products preprocessor!');
app.get('/health', () => '🛋️ Ludwig products preprocessor is up and running!');

// PROTECTED ROUTES
app.guard(
  {
    headers: t.Object({
      'lpp-api-key': t.String({
        error: 'Unauthorized!',
      }),
    }),
    beforeHandle({ headers, status }) {
      const apiKey = headers['lpp-api-key'];
      const VALID_API_KEY = envConfig.SERVER_API_KEY;

      if (apiKey !== VALID_API_KEY) return status(401, 'Unauthorized!');
    },
  },
  (app) => app.use(preprocessorRoute),
);

app.onError(({ code, error, status }) => {
  let errorMessage = 'An unknown error occurred.';
  if (error instanceof Error) errorMessage = error.message;

  let statusCode = Number(code);
  if (isNaN(statusCode)) statusCode = 500;

  return status(statusCode, errorMessage);
});

app.listen(envConfig.PORT ?? 8080);

logger.info(
  `🛋️ Ludwig products preprocessor is running at ${app.server?.hostname}:${app.server?.port}`,
);
