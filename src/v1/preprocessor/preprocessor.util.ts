import {
  FLAT_FILE_EXTS_TO_PROCESS,
  SPREADSHEET_FILE_EXTS_TO_PROCESS,
  ZIP_FILE_EXTS_TO_PROCESS,
} from '@ludwig-preprocessor/v1/preprocessor/preprocessor.constant';

export function getVendorProductDataFileKeysThatCanBeProcessed(keys: string[]) {
  const flatFileKeys = keys.filter((key) =>
    FLAT_FILE_EXTS_TO_PROCESS.some((ext) => key.endsWith(ext)),
  );

  const spreadsheetFileKeys = keys.filter((key) =>
    SPREADSHEET_FILE_EXTS_TO_PROCESS.some((ext) => key.endsWith(ext)),
  );

  const zipFileKeys = keys.filter((key) =>
    ZIP_FILE_EXTS_TO_PROCESS.some((ext) => key.endsWith(ext)),
  );

  return {
    flatFileKeys,
    spreadsheetFileKeys,
    zipFileKeys,
  };
}
