import { envConfig } from '@ludwig-preprocessor/config/env';
import pino from 'pino';

export const logger = pino({
  level: envConfig.SERVER_ENVIRONMENT === 'production' ? 'info' : 'debug',

  // 2. Formatting: Use 'pino-pretty' only in dev
  transport:
    envConfig.SERVER_ENVIRONMENT !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard', // "2024-01-01 12:00:00"
            ignore: 'pid,hostname', // Clean up the output
          },
        }
      : undefined,
});
