import { zProductFileFieldMapSchema } from '@ludwig-preprocessor/zod.schema';
import type { z } from 'zod';

export type ProductFileConfig = {
  map: z.infer<typeof zProductFileFieldMapSchema>['map'];
  delimiter: string;
  headerLine: string;
  skuIndex: number;
  categoryIndex: number;
  currencyIndex: number;
  typeIndex: number;
  stockQtyIndex: number;
};
