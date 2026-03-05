import { processVendorProductDataService } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.service';

export async function ingestorController(args: {
  vendorNameId: string;
  ownerId: string;
}) {
  processVendorProductDataService(args);
}
