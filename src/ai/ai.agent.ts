import { GoogleLanguageModelOptions } from '@ai-sdk/google';
import { productFileFieldMapGeneratorAgentInstruction } from '@ludwig-preprocessor/ai/ai.instruction';
import {
  getAiModelTokenUsagePrice,
  googleGemini3FlashLatest,
} from '@ludwig-preprocessor/ai/ai.model';
import { zProductFileFieldMapSchema } from '@ludwig-preprocessor/zod.schema';
import { Output, ToolLoopAgent } from 'ai';

function productFileFieldMapGeneratorAgent() {
  const model = googleGemini3FlashLatest;
  const modelId = model.modelId;

  return new ToolLoopAgent({
    model,
    instructions: productFileFieldMapGeneratorAgentInstruction,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel: 'medium',
          includeThoughts: false,
        },
        structuredOutputs: true,
      } satisfies GoogleLanguageModelOptions,
    },
    output: Output.object({
      schema: zProductFileFieldMapSchema,
    }),

    onFinish: async (result) => {
      const {
        inputTokens = 0,
        outputTokens = 0,
        totalTokens = 0,
      } = result.totalUsage;

      const aiModelTokenUsagePrice = getAiModelTokenUsagePrice(modelId, {
        inputTokens,
        outputTokens,
      });

      console.log({
        inputTokens,
        outputTokens,
        totalTokens,
        aiModelTokenUsagePrice,
      });

      // await convexHttpClient.mutation(
      //   api.v1.workspace.token.server.mutation.saveWorkspaceTokenUsage,
      //   {
      //     serverApiKey: envConfig.SERVER_API_KEY,
      //     workspaceId: args.workspaceId,
      //     executionId: args.executionId,
      //     agentName: 'automationTriggerDataAgent',
      //     modelId,
      //     usedTokens: {
      //       inputTokens,
      //       outputTokens,
      //       totalTokens,
      //       ...aiModelTokenUsagePrice,
      //     },
      //   },
      // );
    },
  });
}

export const aiAgent = {
  productFileFieldMapGeneratorAgent,
};
