type ErrorDetails = Record<string, unknown>;

export type ErrorRecord = {
  statusCode: number;
  message: string;
  details?: ErrorDetails;
};
