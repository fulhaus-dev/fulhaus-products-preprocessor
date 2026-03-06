import r2 from '@ludwig-preprocessor/cloudflare/cloudflare.r2';
import { logger } from '@ludwig-preprocessor/util/logger';
import processFlatFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.flat-file';
import processSpreadsheetFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.spreadsheet-file';
import processZipFileProductDataStream, {
  cleanupStaleTempFiles,
} from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.zip-file';
import {
  clearCategoryCountMap,
  getCategoryCountMap,
  isCategoryFull,
  setCategoryCount,
} from '@ludwig-preprocessor/v1/preprocessor/state/preprocessor.state.category-count';
import {
  clearSkuDedup,
  markSkuIfNew,
} from '@ludwig-preprocessor/v1/preprocessor/state/preprocessor.state.sku-dedup';
import { ProductFileConfig } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.type';
import { getVendorProductDataFileKeysThatCanBeProcessed } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.util';

export async function processVendorProductDataService(args: {
  vendorNameId: string;
  ownerId: string;
}) {
  await cleanupStaleTempFiles();
  clearCategoryCountMap();
  clearSkuDedup();

  const { vendorNameId, ownerId } = args;

  const allProductFileKeys =
    await r2.getAllFileKeysInVendorProductDataBucketFolder(vendorNameId);

  const { flatFileKeys, spreadsheetFileKeys, zipFileKeys } =
    getVendorProductDataFileKeysThatCanBeProcessed(allProductFileKeys);

  for (const flatFileKey of flatFileKeys) {
    const { data: flatFileStream } =
      await r2.getProductDataFileStream(flatFileKey);
    if (!flatFileStream) continue;

    await processFlatFileProductDataStream({
      flatFileStream,
      vendorNameId,
      ownerId,
      fileName: flatFileKey,
    });
  }

  for (const spreadsheetFileKey of spreadsheetFileKeys) {
    const { data: spreadsheetFileStream } =
      await r2.getProductDataFileStream(spreadsheetFileKey);
    if (!spreadsheetFileStream) continue;

    await processSpreadsheetFileProductDataStream({
      spreadsheetFileStream,
      vendorNameId,
      ownerId,
      fileName: spreadsheetFileKey,
    });
  }

  for (const zipFileKey of zipFileKeys) {
    const { data: zipFileStream } =
      await r2.getProductDataFileStream(zipFileKey);
    if (!zipFileStream) continue;

    await processZipFileProductDataStream({
      zipFileStream,
      vendorNameId,
      ownerId,
      fileName: zipFileKey,
    });
  }

  // Log all categories before clearing
  const categoryMap = getCategoryCountMap();
  for (const [key, count] of categoryMap) {
    logger.info(`CATEGORY: ${key} → ${count}`);
  }

  clearCategoryCountMap();
  clearSkuDedup();
}

export function processProductDataLines(args: {
  fileConfig: ProductFileConfig;
  lines: string[];
}) {
  const { fileConfig, lines } = args;
  const delimiter = fileConfig.delimiter;

  // Use pre-computed indices from fileConfig (set during AI mapping)
  const skuIdx = fileConfig.skuIndex;
  const catIdx = fileConfig.categoryIndex;
  const curIdx = fileConfig.currencyIndex;
  const typeIdx = fileConfig.typeIndex;
  const stockQtyIdx = fileConfig.stockQtyIndex;

  // Failsafe: If the AI mapped a column that doesn't actually exist in the header
  if (skuIdx === -1 || catIdx === -1 || curIdx === -1) return;

  // Pre-compute header first field once for skip check
  const firstDelimPos = fileConfig.headerLine.indexOf(delimiter);
  const headerFirstField =
    firstDelimPos === -1
      ? fileConfig.headerLine
      : fileConfig.headerLine.slice(0, firstDelimPos);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Skip header — check first field only without splitting
    const firstDelim = line.indexOf(delimiter);
    const firstField = firstDelim === -1 ? line : line.slice(0, firstDelim);
    if (firstField === headerFirstField) continue;

    // Split once, direct index access O(1)
    const values = line.split(delimiter);

    // Stock gate — skip everything if stock qty is 0
    const stockQty =
      stockQtyIdx !== -1 ? Number(values[stockQtyIdx].trim()) : NaN;
    if (!isNaN(stockQty) && stockQty < 1) continue;

    const category = values[catIdx];
    const currency = values[curIdx];
    const type = typeIdx !== -1 ? values[typeIdx] : null;

    if (category === undefined || currency === undefined) continue;

    const categoryKey = `${category}${type ? ` | ${type}` : ''} ${currency}`;

    // Category gate — skip everything if category is full
    if (isCategoryFull(categoryKey)) continue;

    // SKU gate — skip everything if already seen
    const sku = values[skuIdx]?.trim();
    if (!sku || !markSkuIfNew(sku)) continue;

    setCategoryCount(categoryKey);
  }
}
