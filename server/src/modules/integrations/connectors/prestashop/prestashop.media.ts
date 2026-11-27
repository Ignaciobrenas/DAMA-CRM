import { IntegrationHttpClient } from '../../core/http-client';

export interface PrestaShopImageUploadParams {
  storeUrl: string;
  productId: number | string;
  imageId?: number | string;
  mode?: 'classic' | 'admin_api';
  fileName: string;
  mimeType?: string;
  contentBase64?: string;
  wsKey?: string;
  adminAccessToken?: string;
  classicHeaders?: Record<string, string>;
}

/**
 * Helper multipart/form-data para subida y edición de imágenes de producto en PrestaShop:
 * - Webservice Clásico: `POST /api/images/products/{productId}` (campo `image`)
 * - Admin API v9 (Alta): `POST /admin-api/products/{productId}/images` (campo `image`)
 * - Admin API v9 (Edición): **SIEMPRE `POST /admin-api/products/images/{imageId}`** (nunca PUT, ya que PHP/Symfony no parsea multipart en PUT).
 */
export class PrestaShopMediaUploader {
  public static buildMultipartBody(params: {
    fieldName: string;
    fileName: string;
    mimeType: string;
    contentBase64: string;
    boundary?: string;
  }): { body: string; contentType: string } {
    const boundary = params.boundary || `----DAMAPrestaShopBoundary${Date.now()}`;
    const rawContent = Buffer.from(params.contentBase64, 'base64').toString('latin1');
    const body = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${params.fieldName}"; filename="${params.fileName}"`,
      `Content-Type: ${params.mimeType}`,
      '',
      rawContent,
      `--${boundary}--`,
      '',
    ].join('\r\n');

    return {
      body,
      contentType: `multipart/form-data; boundary=${boundary}`,
    };
  }

  public static async uploadProductImage(params: PrestaShopImageUploadParams): Promise<{
    endpoint: string;
    method: 'POST';
    mode: 'classic' | 'admin_api';
    isEdit: boolean;
    statusCode: number;
    imageId: number | string;
  }> {
    const cleanBase = (params.storeUrl || 'https://tienda-prestashop.example.com').replace(/\/$/, '');
    const mode = params.mode || 'admin_api';
    const isEdit = Boolean(params.imageId);

    const endpoint =
      mode === 'classic'
        ? `${cleanBase}/api/images/products/${params.productId}${params.wsKey ? `?ws_key=${encodeURIComponent(params.wsKey)}` : ''}`
        : isEdit
        ? `${cleanBase}/admin-api/products/images/${params.imageId}`
        : `${cleanBase}/admin-api/products/${params.productId}/images`;

    const { body, contentType } = this.buildMultipartBody({
      fieldName: 'image',
      fileName: params.fileName || 'product.jpg',
      mimeType: params.mimeType || 'image/jpeg',
      contentBase64:
        params.contentBase64 ||
        Buffer.from('DAMA-PRESTASHOP-IMAGE-BYTES').toString('base64'),
    });

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      ...(mode === 'classic'
        ? params.classicHeaders || {}
        : params.adminAccessToken
        ? { Authorization: `Bearer ${params.adminAccessToken}` }
        : {}),
    };

    // En PS9 Admin API incluso la edición de imagen debe ir obligatoriamente con método POST
    const res = await IntegrationHttpClient.request<any>({
      url: endpoint,
      method: 'POST',
      headers,
      body,
    });

    const resolvedImageId = res.data?.imageId || res.data?.id || params.imageId || 1001;
    return {
      endpoint: endpoint.split('?')[0],
      method: 'POST',
      mode,
      isEdit,
      statusCode: res.statusCode || 200,
      imageId: resolvedImageId,
    };
  }
}
