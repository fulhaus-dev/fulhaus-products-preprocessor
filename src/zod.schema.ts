import { PRODUCT_DATA_FIELDS } from '@ludwig-preprocessor/constant';
import { z, type ZodNullable, type ZodString } from 'zod';

type ZProductFileFieldMapFieldValue<T extends { required: boolean }> =
  T['required'] extends true ? ZodString : ZodNullable<ZodString>;

type ZProductFieldMapFields = {
  [K in (typeof PRODUCT_DATA_FIELDS)[number] as K['name']]: ZProductFileFieldMapFieldValue<
    Extract<(typeof PRODUCT_DATA_FIELDS)[number], { name: K['name'] }>
  >;
};

const zProductFieldMapFieldsSchema = PRODUCT_DATA_FIELDS.reduce(
  (acc, fieldName) => {
    if (fieldName.required)
      acc[fieldName.name] = z.string().describe(fieldName.description);

    if (!fieldName.required)
      acc[fieldName.name] = z
        .string()
        .nullable()
        .describe(fieldName.description);

    return acc;
  },
  {} as ZProductFieldMapFields,
);

export const zProductFileFieldMapSchema = z
  .object({
    map: z
      .object(zProductFieldMapFieldsSchema)
      .describe(
        'The header field name mapping for the vendor product data file.',
      )
      .strip(),
    delimiter: z
      .enum(['\\t', ',', '|', ';'])
      .describe('The delimiter used in the vendor product data file.')
      .transform((val) => (val === '\\t' ? '\t' : val)),
    headerLine: z
      .string()
      .describe(
        'The complete header line from the vendor product data file, that was used for mapping.',
      )
      .transform((val) => val.replace(/\\t/g, '\t').replace(/\\n/g, '\n')),
  })
  .strip();
