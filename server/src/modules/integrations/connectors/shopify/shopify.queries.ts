import { ShopifyGid, ShopifyProductSetInput } from './shopify.types';

/**
 * Límites numéricos oficiales documentados por Shopify (shopify.dev/docs/api/usage/limits & help.shopify.com).
 */
export const SHOPIFY_OFFICIAL_LIMITS = {
  MAX_ARRAY_INPUT_ELEMENTS: 250,
  MAX_PAGINATION_DEPTH_OBJECTS: 25000,
  MAX_VARIANTS_PER_PRODUCT: 2048,
  MAX_PRODUCT_OPTIONS: 3,
  MAX_TAGS_PER_PRODUCT: 250,
  MAX_BARCODES_PER_VARIANT: 20,
  HARMONIZED_SYSTEM_CODE_MIN_DIGITS: 6,
  HARMONIZED_SYSTEM_CODE_MAX_DIGITS: 13,
  MAX_ORDER_NOTE_CHARS: 5000,
  MAX_METAFIELDS_PER_SET_CALL: 25,
  MAX_METAFIELDS_PAYLOAD_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_MEDIA_PER_PRODUCT: 250,
  MAX_IMAGE_MEGAPIXELS: 25,
  RECOMMENDED_RATE_LIMIT_RETRY_MS: 1000,
} as const;

export const SHOPIFY_24_CORE_GRAPHQL_TYPES = [
  'Product',
  'ProductVariant',
  'ProductSetInput',
  'Order',
  'LineItem',
  'Customer',
  'MailingAddress',
  'InventoryItem',
  'InventoryLevel',
  'Company',
  'CompanyLocation',
  'Collection',
  'Fulfillment',
  'PriceList',
  'Catalog',
  'DiscountApplication',
  'OrderTransaction',
  'SellingPlan',
  'Market',
  'StaffMember',
  'Refund',
  'Duty',
  'TaxLine',
  'FulfillmentOrder',
  'Metafield',
] as const;

export class ShopifyProtocolHelper {
  public static toGid(resourceType: string, id: string | number): ShopifyGid {
    const str = String(id).trim();
    if (str.startsWith('gid://shopify/')) return str as ShopifyGid;
    return `gid://shopify/${resourceType}/${str}`;
  }

  public static extractLegacyId(gidOrId: string | number): string {
    const str = String(gidOrId).trim();
    const parts = str.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Construye el query string de filtrado para `orders(query: $search)` en `Orders_OUT_v11`.
   */
  public static buildOrdersSearchQuery(filters: {
    financialStatus?: string | string[];
    fulfillmentStatus?: string | string[];
    status?: string;
    tags?: string[];
    excludeTags?: string[];
    gateway?: string;
    processedAfter?: string;
    test?: boolean;
  } = {}): string {
    const clauses: string[] = [];

    const addField = (field: string, val?: string | string[]) => {
      if (!val) return;
      if (Array.isArray(val)) {
        if (val.length === 1) {
          clauses.push(`${field}:${val[0]}`);
        } else if (val.length > 1) {
          clauses.push(`(${val.map((v) => `${field}:${v}`).join(' OR ')})`);
        }
      } else {
        clauses.push(`${field}:${val}`);
      }
    };

    addField('financial_status', filters.financialStatus);
    addField('fulfillment_status', filters.fulfillmentStatus);
    addField('status', filters.status);

    if (filters.tags && filters.tags.length > 0) {
      clauses.push(`(${filters.tags.map((t) => `tag:"${t}"`).join(' OR ')})`);
    }
    if (filters.excludeTags && filters.excludeTags.length > 0) {
      for (const exTag of filters.excludeTags) {
        clauses.push(`-tag:"${exTag}"`);
      }
    }
    if (filters.gateway) {
      clauses.push(`gateway:${filters.gateway}`);
    }
    if (filters.processedAfter) {
      clauses.push(`processed_at:>'${filters.processedAfter}'`);
    }
    if (filters.test !== undefined) {
      clauses.push(`test:${filters.test}`);
    }

    return clauses.join(' AND ');
  }

  /**
   * Valida que un `ProductSetInput` cumpla con todos los límites numéricos oficiales de Shopify.
   */
  public static validateProductSetInput(input: ShopifyProductSetInput): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (input.productOptions && input.productOptions.length > SHOPIFY_OFFICIAL_LIMITS.MAX_PRODUCT_OPTIONS) {
      errors.push(
        `Shopify admite un máximo de ${SHOPIFY_OFFICIAL_LIMITS.MAX_PRODUCT_OPTIONS} opciones por producto (productOptions: ${input.productOptions.length}).`
      );
    }

    if (input.variants && input.variants.length > SHOPIFY_OFFICIAL_LIMITS.MAX_VARIANTS_PER_PRODUCT) {
      errors.push(
        `Shopify admite un máximo de ${SHOPIFY_OFFICIAL_LIMITS.MAX_VARIANTS_PER_PRODUCT} variantes por producto (variants: ${input.variants.length}).`
      );
    }

    if (input.tags && input.tags.length > SHOPIFY_OFFICIAL_LIMITS.MAX_TAGS_PER_PRODUCT) {
      errors.push(
        `Shopify admite un máximo de ${SHOPIFY_OFFICIAL_LIMITS.MAX_TAGS_PER_PRODUCT} tags por producto (tags: ${input.tags.length}).`
      );
    }

    if (input.files && input.files.length > SHOPIFY_OFFICIAL_LIMITS.MAX_MEDIA_PER_PRODUCT) {
      errors.push(
        `Shopify admite un máximo de ${SHOPIFY_OFFICIAL_LIMITS.MAX_MEDIA_PER_PRODUCT} medios por producto (files: ${input.files.length}).`
      );
    }

    if (input.metafields && input.metafields.length > SHOPIFY_OFFICIAL_LIMITS.MAX_METAFIELDS_PER_SET_CALL) {
      errors.push(
        `Shopify admite un máximo de ${SHOPIFY_OFFICIAL_LIMITS.MAX_METAFIELDS_PER_SET_CALL} metafields por llamada.`
      );
    }

    for (const v of input.variants || []) {
      const hsCode = v.inventoryItem?.harmonizedSystemCode;
      if (hsCode && !/^\d{6,13}$/.test(hsCode)) {
        errors.push(
          `harmonizedSystemCode '${hsCode}' inválido: debe contener entre 6 y 13 dígitos.`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const SHOPIFY_GRAPHQL_QUERIES = {
  ORDERS_OUT: `
    query OrdersOut($first: Int!, $after: String, $search: String) {
      orders(first: $first, after: $after, sortKey: PROCESSED_AT, query: $search) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          legacyResourceId
          createdAt
          processedAt
          updatedAt
          cancelledAt
          email
          phone
          note
          tags
          poNumber
          currencyCode
          presentmentCurrencyCode
          taxesIncluded
          totalWeight
          displayFinancialStatus
          displayFulfillmentStatus
          customAttributes { key value }
          customer {
            id
            email
            firstName
            lastName
            phone
            tags
            taxExempt
            defaultAddress {
              firstName lastName company address1 address2 city province provinceCode zip country countryCodeV2 phone
            }
          }
          billingAddress {
            firstName lastName company address1 address2 city province provinceCode zip country countryCodeV2 phone
          }
          shippingAddress {
            firstName lastName company address1 address2 city province provinceCode zip country countryCodeV2 phone
          }
          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalPriceSet { shopMoney { amount currencyCode } }
          totalTaxSet { shopMoney { amount currencyCode } }
          totalDiscountsSet { shopMoney { amount currencyCode } }
          totalShippingPriceSet { shopMoney { amount currencyCode } }
          shippingLines(first: 10) {
            nodes {
              id title code carrierIdentifier source
              originalPriceSet { shopMoney { amount currencyCode } }
            }
          }
          transactions {
            id gateway status processedAt
            amountSet { shopMoney { amount currencyCode } }
          }
          purchasingEntity {
            __typename
            ... on Customer { id email }
            ... on PurchasingCompany {
              company { id name externalId }
              contact { id customer { id email firstName lastName } }
              location { id name externalId taxRegistrationId }
            }
          }
          lineItems(first: 100) {
            edges {
              node {
                id name sku quantity currentQuantity
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                discountedTotalSet { shopMoney { amount currencyCode } }
                taxLines(first: 5) {
                  title rate ratePercentage
                  priceSet { shopMoney { amount currencyCode } }
                }
                product { id }
                variant { id title sku }
              }
            }
          }
        }
      }
    }
  `,

  PRODUCT_VARIANT_BY_IDENTIFIER: `
    query ProductVariantByIdentifier($query: String!) {
      productVariants(first: 1, query: $query) {
        nodes {
          id
          sku
          barcode
          product {
            id
            title
            status
            handle
          }
          inventoryItem {
            id
            tracked
          }
        }
      }
    }
  `,

  PRODUCT_SET_MUTATION: `
    mutation ProductSetUpsert($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
      productSet(synchronous: true, input: $input, identifier: $identifier) {
        product {
          id
          handle
          title
          status
          options(first: 10) { id name position values }
          variants(first: 250) {
            nodes {
              id
              title
              sku
              selectedOptions { name value }
              inventoryItem { id tracked sku }
            }
          }
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `,

  PUBLISHABLE_PUBLISH_MUTATION: `
    mutation PublishProductToChannel($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          ... on Product { id handle status }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,

  INVENTORY_SET_QUANTITIES_MUTATION: `
    mutation InventorySetQuantities($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        inventoryAdjustmentGroup {
          createdAt
          reason
          referenceDocumentUri
          changes {
            name
            delta
            quantityAfterChange
          }
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `,

  PRODUCT_VARIANTS_BULK_UPDATE_MUTATION: `
    mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        product { id }
        productVariants { id price compareAtPrice }
        userErrors { field message }
      }
    }
  `,

  PRODUCT_IMAGES_OUT_QUERY: `
    query ProductImagesOut($id: ID!) {
      product(id: $id) {
        id
        title
        featuredImage { id altText url }
        images(first: 10) {
          nodes { id altText url }
        }
      }
    }
  `,
};
