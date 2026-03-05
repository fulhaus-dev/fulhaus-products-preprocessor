import {
  GetObjectCommand,
  ListObjectsV2Command,
  type _Object as S3Object,
} from '@aws-sdk/client-s3';
import { r2Client } from '@ludwig-preprocessor/cloudflare/cloudflare.config';
import { envConfig } from '@ludwig-preprocessor/config/env';
import { ErrorRecord } from '@ludwig-preprocessor/types';
import { asyncTryCatch } from '@ludwig-preprocessor/util/try-catch';
import { Readable } from 'stream';

async function getFileKeysInVendorProductDataBucketFolder(
  folderName: string,
  continuationToken?: string,
) {
  const folderNameWithPrefix = folderName.endsWith('/')
    ? folderName
    : `${folderName}/`;

  const { data: listObjectsV2CommandOutput, errorRecord } = await asyncTryCatch(
    () =>
      r2Client.send(
        new ListObjectsV2Command({
          Bucket: envConfig.CLOUDFLARE_R2_VENDOR_PRODUCT_DATA_BUCKET_NAME,
          Prefix: folderNameWithPrefix,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        }),
      ),
  );
  if (errorRecord) return { errorRecord };

  const keys = (listObjectsV2CommandOutput.Contents || [])
    .filter((obj): obj is S3Object => obj.Key !== undefined)
    .map((obj) => obj.Key!);

  return {
    data: {
      keys,
      isTruncated: listObjectsV2CommandOutput.IsTruncated || false,
      nextContinuationToken: listObjectsV2CommandOutput.NextContinuationToken,
      totalCount: listObjectsV2CommandOutput.KeyCount || 0,
    },
  };
}

async function getAllFileKeysInVendorProductDataBucketFolder(
  folderName: string,
) {
  const fileKeys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const { data: response, errorRecord } =
      await getFileKeysInVendorProductDataBucketFolder(
        folderName,
        continuationToken,
      );
    if (errorRecord) continue;

    fileKeys.push(...response.keys);
    continuationToken = response.nextContinuationToken;
  } while (continuationToken);

  return fileKeys;
}

async function getProductDataFileStream(fileKey: string) {
  let errorRecord: ErrorRecord | null = null;

  const { data: response, errorRecord: getProductDataFileStreamErrorRecord } =
    await asyncTryCatch(() =>
      r2Client.send(
        new GetObjectCommand({
          Bucket: envConfig.CLOUDFLARE_R2_VENDOR_PRODUCT_DATA_BUCKET_NAME,
          Key: fileKey,
        }),
      ),
    );
  if (getProductDataFileStreamErrorRecord)
    errorRecord = getProductDataFileStreamErrorRecord;
  if (!getProductDataFileStreamErrorRecord && !response.Body)
    errorRecord = {
      message: 'Response Body not found.',
      statusCode: 500,
    };

  if (errorRecord || !response) {
    return {
      errorRecord: errorRecord ?? {
        message: 'Response not found.',
      },
    };
  }

  return { data: response.Body as Readable };
}

const r2 = {
  getAllFileKeysInVendorProductDataBucketFolder,
  getProductDataFileStream,
};
export default r2;
