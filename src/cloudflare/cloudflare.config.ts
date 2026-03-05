import { S3Client } from '@aws-sdk/client-s3';
import { envConfig } from '@ludwig-preprocessor/config/env';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: envConfig.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: envConfig.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: envConfig.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  requestHandler: {
    requestTimeout: 0, // Set to 0 to disable timeout
  },
  // Fix for AWS SDK v3.729.0+ compatibility with R2
  // Only calculate checksums when required, not for all operations
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
