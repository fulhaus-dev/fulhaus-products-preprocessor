import r2 from '@ludwig-preprocessor/cloudflare/cloudflare.r2';
import processFlatFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.flat-file';
import processSpreadsheetFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.spreadsheet-file';
import processZipFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.zip-file';
import {
  clearCategoryCountMap,
  setCategoryCount,
} from '@ludwig-preprocessor/v1/preprocessor/preprocessor.category-count-state';
import { ProductFileConfig } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.type';
import { getVendorProductDataFileKeysThatCanBeProcessed } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.util';

export async function processVendorProductDataService(args: {
  vendorNameId: string;
  ownerId: string;
}) {
  clearCategoryCountMap();
  const { vendorNameId, ownerId } = args;

  const allProductFileKeys =
    await r2.getAllFileKeysInVendorProductDataBucketFolder(vendorNameId);

  const { flatFileKeys, spreadsheetFileKeys, zipFileKeys } =
    getVendorProductDataFileKeysThatCanBeProcessed(allProductFileKeys);

  console.log({
    flatFileKeys,
    spreadsheetFileKeys,
    zipFileKeys,
  });

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

  clearCategoryCountMap();
}

export function processProductDataLines(args: {
  fileConfig: ProductFileConfig;
  lines: string[];
}) {
  const { fileConfig, lines } = args;
  const delimiter = fileConfig.delimiter;

  // Use pre-computed indices from fileConfig (set during AI mapping)
  const catIdx = fileConfig.categoryIndex;
  const curIdx = fileConfig.currencyIndex;
  const typeIdx = fileConfig.typeIndex;

  // Failsafe: If the AI mapped a column that doesn't actually exist in the header
  if (catIdx === -1 || curIdx === -1) return;

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

    const category = values[catIdx];
    const currency = values[curIdx];
    const type = typeIdx !== -1 ? values[typeIdx] : null;

    if (category === undefined || currency === undefined) continue;

    const categoryKey = `${category}${type ? ` | ${type}` : ''} ${currency}`;
    setCategoryCount(categoryKey);
  }
}

// function extractColumn(
//   line: string,
//   delimiter: string,
//   columnIndex: number,
// ): string | undefined {
//   let start = 0;
//   let col = 0;

//   while (col < columnIndex) {
//     const next = line.indexOf(delimiter, start);
//     if (next === -1) return undefined;
//     start = next + delimiter.length;
//     col++;
//   }

//   const end = line.indexOf(delimiter, start);
//   return end === -1 ? line.slice(start) : line.slice(start, end);
// }

// export function processProductDataLines(args: {
//   fileConfig: ProductFileConfig;
//   lines: string[];
// }) {
//   const { fileConfig, lines } = args;
//   const delimiter = fileConfig.delimiter;

//   const catIdx = fileConfig.categoryIndex;
//   const curIdx = fileConfig.currencyIndex;
//   const typeIdx = fileConfig.typeIndex;

//   if (catIdx === -1 || curIdx === -1) return;

//   const headerFirstField = fileConfig.headerLine.slice(
//     0,
//     fileConfig.headerLine.indexOf(delimiter) === -1
//       ? fileConfig.headerLine.length
//       : fileConfig.headerLine.indexOf(delimiter),
//   );

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     if (!line) continue;

//     // Skip if this line is the header — check first field only without splitting
//     const firstDelim = line.indexOf(delimiter);
//     const firstField = firstDelim === -1 ? line : line.slice(0, firstDelim);
//     if (firstField === headerFirstField) continue;

//     // Extract only the columns we need — O(needed columns) not O(total columns)
//     const category = extractColumn(line, delimiter, catIdx);
//     const currency = extractColumn(line, delimiter, curIdx);
//     const type =
//       typeIdx !== -1 ? extractColumn(line, delimiter, typeIdx) : null;

//     if (category === undefined || currency === undefined) continue;

//     const categoryKey = `${category}${type ? ` | ${type}` : ''} ${currency}`;
//     setCategoryCount(categoryKey);
//   }
// }

// import r2 from '@ludwig-preprocessor/cloudflare/cloudflare.r2';
// import processFlatFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.flat-file';
// import processSpreadsheetFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.spreadsheet-file';
// import processZipFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.zip-file';
// import {
//   clearCategoryCountMap,
//   setCategoryCount,
// } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.category-count-state';
// import { ProductFileConfig } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.type';
// import { getVendorProductDataFileKeysThatCanBeProcessed } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.util';

// export async function processVendorProductDataService(args: {
//   vendorNameId: string;
//   ownerId: string;
// }) {
//   clearCategoryCountMap();
//   const { vendorNameId, ownerId } = args;

//   const allProductFileKeys =
//     await r2.getAllFileKeysInVendorProductDataBucketFolder(vendorNameId);

//   const { flatFileKeys, spreadsheetFileKeys, zipFileKeys } =
//     getVendorProductDataFileKeysThatCanBeProcessed(allProductFileKeys);

//   console.log({
//     flatFileKeys,
//     spreadsheetFileKeys,
//     zipFileKeys,
//   });

//   for (const flatFileKey of flatFileKeys) {
//     const { data: flatFileStream } =
//       await r2.getProductDataFileStream(flatFileKey);
//     if (!flatFileStream) continue;

//     await processFlatFileProductDataStream({
//       flatFileStream,
//       vendorNameId,
//       ownerId,
//       fileName: flatFileKey,
//     });
//   }

//   for (const spreadsheetFileKey of spreadsheetFileKeys) {
//     const { data: spreadsheetFileStream } =
//       await r2.getProductDataFileStream(spreadsheetFileKey);
//     if (!spreadsheetFileStream) continue;

//     await processSpreadsheetFileProductDataStream({
//       spreadsheetFileStream,
//       vendorNameId,
//       ownerId,
//       fileName: spreadsheetFileKey,
//     });
//   }

//   for (const zipFileKey of zipFileKeys) {
//     const { data: zipFileStream } =
//       await r2.getProductDataFileStream(zipFileKey);
//     if (!zipFileStream) continue;

//     await processZipFileProductDataStream({
//       zipFileStream,
//       vendorNameId,
//       ownerId,
//       fileName: zipFileKey,
//     });
//   }

//   clearCategoryCountMap();
// }

// export function processProductDataLines(args: {
//   fileConfig: ProductFileConfig;
//   lines: string[];
// }) {
//   const { fileConfig, lines } = args;
//   const delimiter = fileConfig.delimiter;
//   const headerFields = fileConfig.headerLine.split(delimiter);

//   // 1. Calculate the exact array indices ONCE per chunk
//   const catIdx = headerFields.indexOf(fileConfig.map.category);
//   const curIdx = headerFields.indexOf(fileConfig.map.currency);
//   const typeIdx = fileConfig.map.type
//     ? headerFields.indexOf(fileConfig.map.type)
//     : -1;

//   // Failsafe: If the AI mapped a column that doesn't actually exist in the header
//   if (catIdx === -1 || curIdx === -1) return;

//   // 2. High-speed raw iteration
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     if (!line) continue;

//     const values = line.split(delimiter);

//     // Skip if this line happens to be the header
//     if (values[0] === headerFields[0]) continue;

//     // 3. Direct index access (O(1) allocation)
//     const category = values[catIdx];
//     const currency = values[curIdx];
//     const type = typeIdx !== -1 ? values[typeIdx] : null;

//     // 4. Update the map
//     const categoryKey = `${category}${type ? ` | ${type}` : ''} ${currency}`;
//     setCategoryCount(categoryKey);
//   }
// }
