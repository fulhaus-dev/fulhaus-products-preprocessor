import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { envConfig } from '@ludwig-preprocessor/config/env';

export const googleGenerativeAI = createGoogleGenerativeAI({
  apiKey: envConfig.GOOGLE_GEMINI_API_KEY,
});
