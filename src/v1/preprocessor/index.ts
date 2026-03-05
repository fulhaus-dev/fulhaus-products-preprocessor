import { ingestorController } from '@ludwig-preprocessor/v1/preprocessor/preprocessor.controller';
import Elysia, { t } from 'elysia';

export const preprocessorRoute = new Elysia({ prefix: '/api/v1/preprocessor' });

preprocessorRoute.post(
  '/webhook/:vendorNameId',
  async ({
    params: { vendorNameId },
    query: { 'owner-id': ownerId = 'fulhaus' },
  }) => {
    ingestorController({
      vendorNameId,
      ownerId,
    });

    return { message: 'Product preprocessing started!' };
  },
  {
    params: t.Object({
      vendorNameId: t.String(),
    }),
    query: t.Object({
      'owner-id': t.Optional(t.String()),
    }),
  },
);
