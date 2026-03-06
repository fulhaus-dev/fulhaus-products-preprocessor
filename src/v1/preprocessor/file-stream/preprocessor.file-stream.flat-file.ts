import { aiAgent } from '@ludwig-preprocessor/ai/ai.agent';
import { logger } from '@ludwig-preprocessor/util/logger';
import { asyncTryCatch } from '@ludwig-preprocessor/util/try-catch';
import {
  getCategoryKeyCount,
  getCategoryTotal,
} from '@ludwig-preprocessor/v1/preprocessor/state/preprocessor.state.category-count';
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

  const processedTotal = getCategoryTotal();
  const processedKeyCount = getCategoryKeyCount();

  logger.info(
    `✅ Started preprocessing for file ${fileName} from vendor ${vendorNameId}`,
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
      logger.info(`Started AI Mapping for ${fileName}`);
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
      logger.info(`Completed AI Mapping for ${fileName}`);

      if (errorRecord) {
        // TODO: Implement remote logger
        logger.error(
          `AI Mapping Failed for ${fileName} from vendor ${vendorNameId}: ${JSON.stringify(errorRecord, null, 2)}`,
        );
        return;
      }

      const dataOutput = data.output;

      const headerFields = dataOutput.headerLine.split(dataOutput.delimiter);
      const skuIndex = headerFields.indexOf(dataOutput.map.sku);
      const categoryIndex = headerFields.indexOf(dataOutput.map.category);
      const currencyIndex = headerFields.indexOf(dataOutput.map.currency);
      const typeIndex = dataOutput.map.type
        ? headerFields.indexOf(dataOutput.map.type)
        : -1;
      const stockQtyIndex = dataOutput.map.stockQty
        ? headerFields.indexOf(dataOutput.map.stockQty)
        : -1;

      fileConfig = {
        ...dataOutput,
        skuIndex,
        categoryIndex,
        currencyIndex,
        typeIndex,
        stockQtyIndex,
      };

      // push buffered sample into batch for processing
      for (let i = 0; i < lines.length; i++) {
        fileLinesBatch.push(lines[i]);
      }

      logger.info(`Started preprocessing lines for ${fileName}`);

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

  logger.info(
    `✅ Preprocessing completed for file ${fileName} from vendor ${vendorNameId}.`,
  );

  const finalTotalForFile = getCategoryTotal() - processedTotal;
  const finalKeyCountForFile = getCategoryKeyCount() - processedKeyCount;
  logger.info(
    `🚪🛏️ Totals for ${fileName}: ${JSON.stringify(
      {
        PRODUCTS: finalTotalForFile,
        NEW_CATEGORIES: finalKeyCountForFile,
      },
      null,
      2,
    )}.
    
    `,
  );
}
