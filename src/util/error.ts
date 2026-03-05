import { ErrorRecord } from '@ludwig-preprocessor/types';

export function getUnknownErrorRecord(error: unknown) {
  const errorResponse: ErrorRecord = {
    statusCode: 500,
    message: 'An unknown error occurred',
  };

  // Check if the error is an instance of Error
  if (error instanceof Error)
    errorResponse.message = error.message ?? 'An unknown error occurred';

  return errorResponse;
}
