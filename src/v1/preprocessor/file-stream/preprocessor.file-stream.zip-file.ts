import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import StreamZip from 'node-stream-zip';
import { logger } from '@ludwig-preprocessor/util/logger';
import processFlatFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.flat-file';
import processSpreadsheetFileProductDataStream from '@ludwig-preprocessor/v1/preprocessor/file-stream/preprocessor.file-stream.spreadsheet-file';

const TEMP_DIR = path.join(os.tmpdir(), 'zip-processing');

const FLAT_FILE_EXTENSIONS = new Set(['csv', 'txt', 'tsv']);
const SPREADSHEET_EXTENSIONS = new Set(['xlsx', 'xls']);

export default async function processZipFileProductDataStream(args: {
  zipFileStream: NodeJS.ReadableStream;
  vendorNameId: string;
  ownerId: string;
  fileName: string;
}) {
  const { zipFileStream, vendorNameId, ownerId, fileName } = args;

  // Ensure temp directory exists
  await mkdir(TEMP_DIR, { recursive: true });

  const tmpZipPath = path.join(TEMP_DIR, `zip-${randomUUID()}.zip`);
  let zip: InstanceType<typeof StreamZip.async> | null = null;

  try {
    logger.info(`Downloading ${fileName} → ${tmpZipPath}`);
    await pipeline(zipFileStream, createWriteStream(tmpZipPath));

    logger.info(`Opening ZIP (async) → ${tmpZipPath}`);
    zip = new StreamZip.async({ file: tmpZipPath });

    const entriesCount = await zip.entriesCount;
    logger.info(`ZIP ready – ${entriesCount} entries`);

    const entries = await zip.entries();

    for (const [entryName, entry] of Object.entries(entries)) {
      if (entry.isDirectory) continue;

      const fileNameInZip = path.basename(entryName);
      const ext = path.extname(fileNameInZip).toLowerCase().slice(1);

      const zipEntryStream = await zip.stream(entryName);

      const isFlatFile = FLAT_FILE_EXTENSIONS.has(ext);
      const isSpreadsheet = SPREADSHEET_EXTENSIONS.has(ext);

      try {
        if (isFlatFile)
          await processFlatFileProductDataStream({
            flatFileStream: zipEntryStream,
            vendorNameId,
            ownerId,
            fileName,
          });
        else if (isSpreadsheet)
          await processSpreadsheetFileProductDataStream({
            spreadsheetFileStream: zipEntryStream,
            vendorNameId,
            ownerId,
            fileName,
          });
      } catch (err) {
        // Log but continue to next entry — don't abort the whole zip
        logger.error(`Error processing ${fileNameInZip}: ${err}`);
      }
    }
  } catch (err) {
    logger.error(`Error processing ${fileName}: ${err}`);
  } finally {
    // Single cleanup path — always runs exactly once
    if (zip) {
      try {
        await zip.close();
      } catch {
        // zip may already be closed or invalid — ignore
      }
    }
    await unlink(tmpZipPath).catch(() => {});
  }
}
