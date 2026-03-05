import { googleGenerativeAI } from '@ludwig-preprocessor/ai/ai.provider';

export const googleGemini3FlashLatest = googleGenerativeAI(
  'gemini-flash-latest',
);

export const googleGemini3FlashLiteLatest = googleGenerativeAI(
  'gemini-flash-lite-latest',
);

/**
 * AI MODEL TOKEN PRICING
 */
const aiModelTokenPrice = {
  [googleGemini3FlashLatest.modelId]: {
    inputPricePerToken: 0.5 / 1000000,
    outputPricePerToken: 3 / 1000000,
  },
  [googleGemini3FlashLiteLatest.modelId]: {
    inputPricePerToken: 0.25 / 1000000,
    outputPricePerToken: 1.5 / 1000000,
  },
};

export function getAiModelTokenUsagePrice(
  aiModelName: string,
  tokens: {
    inputTokens: number;
    outputTokens: number;
  },
) {
  const inputTokensPrice =
    aiModelTokenPrice[aiModelName].inputPricePerToken * tokens.inputTokens;
  const outputTokensPrice =
    aiModelTokenPrice[aiModelName].outputPricePerToken * tokens.outputTokens;

  const totalTokensPrice = inputTokensPrice + outputTokensPrice;

  return {
    inputTokensPrice,
    outputTokensPrice,
    totalTokensPrice,
  };
}
