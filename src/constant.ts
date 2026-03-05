export const PRODUCT_DATA_FIELDS = [
  {
    name: 'sku',
    required: true,
    description:
      'The vendor field that represents the unique product identifier',
  },
  {
    name: 'itemId',
    required: false,
    description:
      'The vendor field that represents a variant or specific item identifier',
  },
  {
    name: 'groupId',
    required: false,
    description:
      'The vendor field that represents a variant or specific item identifier',
  },
  {
    name: 'gtin',
    required: false,
    description:
      'The vendor field that contains a global trade item number, UPC, EAN, or similar barcode',
  },
  {
    name: 'mpn',
    required: false,
    description:
      'The vendor field that contains the manufacturer part number or model identifier',
  },
  {
    name: 'brand',
    required: false,
    description:
      'The vendor field that identifies the brand or manufacturer name',
  },
  {
    name: 'name',
    required: true,
    description: 'The vendor field that contains the product name or title',
  },
  {
    name: 'description',
    required: true,
    description:
      'The vendor field that contains the product description or detailed information',
  },
  {
    name: 'link',
    required: true,
    description:
      'The vendor field that contains a URL or link to the product detail page',
  },
  {
    name: 'currency',
    required: true,
    description: 'The vendor field that represents the currency of the product',
  },
  {
    name: 'wholesalePrice',
    required: false,
    description:
      'The vendor field that represents the wholesale or trade price',
  },
  {
    name: 'retailPrice',
    required: false,
    description:
      'The vendor field that represents the retail or consumer price',
  },
  {
    name: 'salePrice',
    required: false,
    description: 'The vendor field that represents the sale or discount price',
  },
  {
    name: 'mapPrice',
    required: false,
    description:
      'The vendor field that represents the minimum advertised price or lowest allowed selling price',
  },
  {
    name: 'msrpPrice',
    required: false,
    description:
      'The vendor field that represents the manufacturer suggested retail price or list price',
  },
  {
    name: 'unitPerBox',
    required: false,
    description:
      'The vendor field that indicates quantity per package, case pack, sets or units per container',
  },
  {
    name: 'stockQty',
    required: false,
    description:
      'The vendor field that represents current inventory quantity or stock level',
  },
  {
    name: 'category',
    required: true,
    description: 'The vendor field that represents the product category',
  },
  {
    name: 'type',
    required: false,
    description: 'The vendor field that represents the detailed product type',
  },
  {
    name: 'dimension',
    required: true,
    description:
      'The vendor field that represents the product dimension string representation',
  },
  {
    name: 'dimensionUnit',
    required: false,
    description:
      'The vendor field that represents the product dimension unit of measurement',
  },
  {
    name: 'width',
    required: false,
    description: 'The vendor field that represents the product width',
  },
  {
    name: 'height',
    required: false,
    description: 'The vendor field that represents the product height',
  },
  {
    name: 'depth',
    required: false,
    description: 'The vendor field that represents the product depth',
  },
  {
    name: 'weight',
    required: false,
    description: 'The vendor field that represents the product weight',
  },
  {
    name: 'weightUnit',
    required: false,
    description:
      'The vendor field that represents the product weight unit of measurement',
  },
  {
    name: 'weightUnit',
    required: false,
    description:
      'The vendor field that represents the product weight unit of measurement',
  },
  {
    name: 'materials',
    required: false,
    description: 'The vendor field that represents the product materials',
  },
  {
    name: 'styles',
    required: false,
    description: 'The vendor field that represents the product styles',
  },
  {
    name: 'colors',
    required: false,
    description: 'The vendor field that represents the product colors',
  },
] as const;
