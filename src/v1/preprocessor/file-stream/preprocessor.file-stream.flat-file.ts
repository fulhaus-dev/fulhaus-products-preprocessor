import { aiAgent } from '@ludwig-preprocessor/ai/ai.agent';
import { logger } from '@ludwig-preprocessor/util/logger';
import { asyncTryCatch } from '@ludwig-preprocessor/util/try-catch';
import {
  getCategoryKeyCount,
  getCategoryTotal,
} from '@ludwig-preprocessor/v1/preprocessor/preprocessor.category-count-state';
import { processProductDataLines } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.service';
import { ProductFileConfig } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.type';

// Tune these for throughput vs responsiveness.
// For large TSVs: 50k–200k is a good range.
const MAX_LINES_BATCH = 200000;

export default async function processFlatFileProductDataStream(args: {
  flatFileStream: NodeJS.ReadableStream;
  vendorNameId: string;
  ownerId: string;
  fileName: string;
}) {
  const { flatFileStream, vendorNameId, ownerId, fileName } = args;

  logger.info(
    `✅ Started processing lines from ${fileName} for vendor ${vendorNameId}`,
  );

  const decoder = new TextDecoder();

  let buffer = '';
  let fileConfig: ProductFileConfig | null = null;

  let fileLinesBatch: string[] = [];

  for await (const chunk of flatFileStream) {
    if (typeof chunk === 'string') buffer += chunk;
    else buffer += decoder.decode(chunk, { stream: true });

    const lines = buffer.split(/\r\n|\n|\r/);
    buffer = lines.pop() || '';

    if (lines.length > 2 && !fileConfig) {
      logger.info(`Starting AI mapping for ${fileName}`);
      const { data, errorRecord } = await asyncTryCatch(() =>
        aiAgent.productFileFieldMapGeneratorAgent().generate({
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: lines.slice(0, 2).join('\n') }],
            },
          ],
        }),
      );

      if (errorRecord) {
        logger.error(
          `AI Mapping Failed for ${fileName}: ${JSON.stringify(errorRecord, null, 2)}`,
        );
        return;
      }

      const out = data.output;
      logger.info(`AI Mapping: ${JSON.stringify(out, null, 2)}`);

      const headerFields = out.headerLine.split(out.delimiter);
      const categoryIndex = headerFields.indexOf(out.map.category);
      const currencyIndex = headerFields.indexOf(out.map.currency);
      const typeIndex = out.map.type ? headerFields.indexOf(out.map.type) : -1;

      fileConfig = {
        ...out,
        categoryIndex,
        currencyIndex,
        typeIndex,
      };

      // push buffered sample into batch for processing
      for (let i = 0; i < lines.length; i++) {
        fileLinesBatch.push(lines[i]);
      }

      continue;
    }

    if (!fileConfig) continue;

    // accumulate lines into a bounded batch
    for (let i = 0; i < lines.length; i++) {
      fileLinesBatch.push(lines[i]);
    }

    if (fileLinesBatch.length >= MAX_LINES_BATCH) {
      // O(1) swap — hand off the current batch and start a fresh array
      const batch = fileLinesBatch;
      fileLinesBatch = [];

      processProductDataLines({
        fileConfig,
        lines: batch,
      });

      logger.info(`PROGRESS ${fileName}: uniqueKeys=${getCategoryKeyCount()}`);
    }
  }

  buffer += decoder.decode();

  // flush remaining lines
  if (fileConfig) {
    if (buffer.trim()) {
      fileLinesBatch.push(buffer);
    }

    if (fileLinesBatch.length) {
      processProductDataLines({ fileConfig, lines: fileLinesBatch });
    }
  }

  logger.info(`✅ Categories processed. Unique keys=${getCategoryKeyCount()}`);

  const total = getCategoryTotal();
  logger.info(
    `✅ Completed ${total} lines from ${fileName} for vendor ${vendorNameId}`,
  );
}
